'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, MessageCircle } from 'lucide-react';
import type { Service } from '@/lib/content/types';
import type { DayAvailability } from '@/lib/db/repositories';
import { addDays, cn, formatDuration, formatINR } from '@/lib/utils';
import { dayOfWeekOf } from '@/lib/booking/engine';
import {
  DETAILS_FIELDS,
  LOCATION_FIELDS,
  hasErrorsFor,
  validateBookingInput,
  type FieldErrors,
} from '@/lib/validate';
import { waLink } from '@/lib/whatsapp';
import { env } from '@/lib/env';
import MonthGrid from '@/components/calendar/MonthGrid';
import ProgressSteps from './ProgressSteps';

export type CalendarInfo = {
  today: string;
  windowDays: number;
  days: DayAvailability[];
  blockedDates: string[];
};

type Details = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes: string;
};

type Location = {
  serviceLocation: string;
  area: string;
};

type SubmittedBooking = {
  id: string;
  status: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  serviceLocation: string | null;
  area: string | null;
  notes: string | null;
};

type FlowError = {
  code: string;
  message: string;
  step?: 'service' | 'date' | 'time' | 'details' | 'location';
};

type StoredState = {
  serviceSlug: string | null;
  date: string | null;
  time: string | null;
  details: Details;
  location: Location;
};

const EMPTY_DETAILS: Details = { name: '', phone: '', whatsapp: '', email: '', notes: '' };
const EMPTY_LOCATION: Location = { serviceLocation: '', area: '' };
const STORAGE_KEY = 'gm-booking-draft';
const STEP_LABELS = ['Service', 'Date', 'Time', 'Details', 'Location', 'Review'];

// Step numbers: 0 Service · 1 Date · 2 Time · 3 Details · 4 Location · 5 Review · 6 Confirmation
const stepIndex = (s: FlowError['step']) =>
  s === 'service' ? 0 : s === 'date' ? 1 : s === 'time' ? 2 : s === 'details' ? 3 : s === 'location' ? 4 : 5;

export default function BookingFlow({
  services,
  calendar,
  initialServiceSlug,
}: {
  services: Service[];
  calendar: CalendarInfo;
  initialServiceSlug: string | null;
}) {
  const [restored] = useState<StoredState | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredState) : null;
    } catch {
      return null;
    }
  });

  const [step, setStep] = useState(0);
  const [serviceSlug, setServiceSlug] = useState<string | null>(
    initialServiceSlug ?? restored?.serviceSlug ?? null,
  );
  const [date, setDate] = useState<string | null>(
    initialServiceSlug ? null : restored?.date ?? null,
  );
  const [time, setTime] = useState<string | null>(
    initialServiceSlug ? null : restored?.time ?? null,
  );
  const [details, setDetails] = useState<Details>(restored?.details ?? EMPTY_DETAILS);
  const [location, setLocation] = useState<Location>(restored?.location ?? EMPTY_LOCATION);
  const [detailErrors, setDetailErrors] = useState<FieldErrors>({});
  const [locationErrors, setLocationErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<FlowError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ booking: SubmittedBooking; waLink: string } | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  const service = useMemo(
    () => services.find((s) => s.slug === serviceSlug) ?? null,
    [services, serviceSlug],
  );

  // Persist the draft so a refresh never loses progress.
  useEffect(() => {
    if (result) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ serviceSlug, date, time, details, location } satisfies StoredState),
      );
    } catch {
      /* storage unavailable — draft just won't persist */
    }
  }, [serviceSlug, date, time, details, location, result]);

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setStep(next);
      setError(null);
      scrollToTop();
    },
    [scrollToTop],
  );

  const maxDate = addDays(calendar.today, calendar.windowDays);
  const closedDays = useMemo(
    () => new Set(calendar.days.filter((d) => !d.enabled).map((d) => d.dayOfWeek)),
    [calendar.days],
  );
  const blockedSet = useMemo(() => new Set(calendar.blockedDates), [calendar.blockedDates]);

  const isDateDisabled = useCallback(
    (iso: string) =>
      iso < calendar.today ||
      iso > maxDate ||
      closedDays.has(dayOfWeekOf(iso)) ||
      blockedSet.has(iso),
    [calendar.today, maxDate, closedDays, blockedSet],
  );

  const nextAvailable = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i <= 30 && out.length < 5; i++) {
      const iso = addDays(calendar.today, i);
      if (!isDateDisabled(iso)) out.push(iso);
    }
    return out;
  }, [calendar.today, isDateDisabled]);

  const fullInput = useCallback(
    () => ({
      name: details.name,
      phone: details.phone,
      whatsapp: details.whatsapp,
      email: details.email,
      notes: details.notes,
      serviceLocation: location.serviceLocation,
      area: location.area,
      service: serviceSlug ?? '',
      date: date ?? '',
      time: time ?? '',
    }),
    [details, location, serviceSlug, date, time],
  );

  // Only validate the fields that belong to the current step.
  const validateDetails = useCallback((): boolean => {
    const { errors } = validateBookingInput(fullInput());
    setDetailErrors(errors);
    return !hasErrorsFor(errors, DETAILS_FIELDS);
  }, [fullInput]);

  const validateLocation = useCallback((): boolean => {
    const { errors } = validateBookingInput(fullInput());
    setLocationErrors(errors);
    return !hasErrorsFor(errors, LOCATION_FIELDS);
  }, [fullInput]);

  const nextActionLabel =
    step === 0
      ? 'Choose a date'
      : step === 1
        ? 'Choose a time'
        : step === 2
          ? 'Enter your details'
          : step === 3
            ? 'Add service location'
            : step === 4
              ? 'Review booking'
              : 'Send booking request';

  const canContinue =
    step === 0 ? Boolean(service) : step === 1 ? Boolean(date) : step === 2 ? Boolean(time) : true;

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    if (step === 3 && !validateDetails()) return;
    if (step === 4 && !validateLocation()) return;
    goTo(step + 1);
  }, [canContinue, step, validateDetails, validateLocation, goTo]);

  const submit = useCallback(async () => {
    if (!service || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: service.slug,
          date,
          time,
          name: details.name,
          phone: details.phone,
          whatsapp: details.whatsapp,
          email: details.email,
          notes: details.notes,
          serviceLocation: location.serviceLocation,
          area: location.area,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.booking) {
        setResult({ booking: data.booking as SubmittedBooking, waLink: data.waLink as string });
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        goTo(6);
      } else {
        const e = data?.error ?? {
          code: 'UNKNOWN',
          message: 'Something went wrong on our side. Please try again.',
        };
        const fe: FlowError = { code: e.code, message: e.message, step: e.step };
        setError(fe);
        if (e.step) goTo(stepIndex(e.step));
      }
    } catch {
      setError({
        code: 'NETWORK',
        message: 'We could not reach the server. Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [service, date, time, details, location, goTo]);

  const reset = useCallback(() => {
    setStep(0);
    setServiceSlug(null);
    setDate(null);
    setTime(null);
    setDetails(EMPTY_DETAILS);
    setLocation(EMPTY_LOCATION);
    setDetailErrors({});
    setLocationErrors({});
    setError(null);
    setResult(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    scrollToTop();
  }, [scrollToTop]);

  const [monthKey, setMonthKey] = useState(() => calendar.today.slice(0, 7));
  const effMonth = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number);
    return { year: y, month: m - 1 };
  }, [monthKey]);

  const maxMonth = maxDate.slice(0, 7);
  const currentMonth = calendar.today.slice(0, 7);
  const monthLabel = new Date(effMonth.year, effMonth.month, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = useCallback(
    (delta: number) => {
      const [y, m] = monthKey.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      setDate(null);
      setTime(null);
    },
    [monthKey],
  );

  return (
    <div ref={topRef} className="scroll-mt-24 pb-24 md:pb-0">
      <ProgressSteps step={step} labels={STEP_LABELS} onJump={(i) => goTo(i)} />

      <div className="mt-8">
        {error && step < 6 && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
          >
            <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
            <p>{error.message}</p>
          </div>
        )}

        {step === 0 && (
          <ServiceStep
            services={services}
            selected={serviceSlug}
            onSelect={(slug) => {
              setServiceSlug(slug);
              setTime(null);
            }}
          />
        )}

        {step === 1 && (
          <DateStep
            calendar={calendar}
            today={calendar.today}
            month={effMonth}
            monthLabel={monthLabel}
            canPrev={monthKey > currentMonth}
            canNext={monthKey < maxMonth}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            isDisabled={isDateDisabled}
            selectedDate={date}
            onSelectDate={(iso) => {
              setDate(iso);
              setTime(null);
              setMonthKey(iso.slice(0, 7));
            }}
            nextAvailable={nextAvailable}
          />
        )}

        {step === 2 && service && date && (
          <TimeStep
            date={date}
            serviceSlug={service.slug}
            serviceName={service.name}
            durationMin={service.durationMin}
            selected={time}
            onSelect={(t) => setTime(t)}
            onPickAnotherDay={() => goTo(1)}
          />
        )}

        {step === 3 && (
          <DetailsStep
            details={details}
            errors={detailErrors}
            onChange={(patch) => {
              setDetails((d) => ({ ...d, ...patch }));
              setDetailErrors({});
            }}
          />
        )}

        {step === 4 && (
          <LocationStep
            location={location}
            errors={locationErrors}
            onChange={(patch) => {
              setLocation((l) => ({ ...l, ...patch }));
              setLocationErrors({});
            }}
          />
        )}

        {step === 5 && service && date && time && (
          <ReviewStep
            service={service}
            date={date}
            time={time}
            details={details}
            location={location}
            onEdit={(target) => goTo(stepIndex(target))}
          />
        )}

        {step === 6 && result && <ConfirmationStep result={result} onReset={reset} />}
      </div>

      {/* Primary actions */}
      {step < 6 && (
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, step - 1))}
            className="btn btn-ghost"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="btn btn-primary"
            >
              {nextActionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  Send booking request
                  <Check className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Mobile sticky action bar */}
      {step < 6 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur-sm md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex gap-2 px-4 py-3">
            <button type="button" onClick={() => goTo(Math.max(0, step - 1))} className="btn btn-outline" disabled={submitting}>
              Back
            </button>
            {step < 5 ? (
              <button type="button" onClick={handleContinue} disabled={!canContinue} className="btn btn-primary flex-[2]">
                {nextActionLabel}
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary flex-[2]">
                {submitting ? 'Sending…' : 'Send request'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ steps */

function ServiceStep({
  services,
  selected,
  onSelect,
}: {
  services: Service[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-display text-2xl text-ink md:text-3xl">What do you need?</legend>
      <p className="mt-2 text-sm text-ink-soft">
        Choose one service to start — you can mention add-ons (hair, extra looks) in the notes.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const active = selected === s.slug;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => onSelect(s.slug)}
              aria-pressed={active}
              className={cn(
                'card group relative flex items-center gap-4 p-4 text-left transition-colors',
                active ? 'border-wine ring-1 ring-wine' : 'hover:border-line-strong',
              )}
            >
              <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded bg-cream sm:h-20 sm:w-20">
                {s.image ? (
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center font-display text-2xl text-line-strong"
                  >
                    {s.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base text-ink sm:text-lg">
                  {s.name}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {formatDuration(s.durationMin)} ·{' '}
                  {s.startingPrice
                    ? `from ${formatINR(s.startingPrice)}`
                    : formatINR(s.price)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  active ? 'border-wine bg-wine text-ivory' : 'border-line-strong text-transparent',
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DateStep(props: {
  calendar: CalendarInfo;
  today: string;
  month: { year: number; month: number };
  monthLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  isDisabled: (iso: string) => boolean;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  nextAvailable: string[];
}) {
  const {
    calendar,
    today,
    month,
    monthLabel,
    canPrev,
    canNext,
    onPrev,
    onNext,
    isDisabled,
    selectedDate,
    onSelectDate,
    nextAvailable,
  } = props;

  const closedLabels = calendar.days
    .filter((d) => !d.enabled)
    .map((d) => (d.dayOfWeek === 1 ? 'Mondays' : ['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'][d.dayOfWeek]));

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">Pick a date</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Greyed-out dates are past, closed or fully reserved.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthGrid
            year={month.year}
            month={month.month}
            monthLabel={monthLabel}
            today={today}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={onPrev}
            onNext={onNext}
            isDisabled={isDisabled}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Next open days
            </p>
            <ul className="mt-4 space-y-2">
              {nextAvailable.length === 0 && (
                <li className="text-sm text-muted">No open days in the next few weeks.</li>
              )}
              {nextAvailable.map((iso) => {
                const d = new Date(iso + 'T00:00:00');
                return (
                  <li key={iso}>
                    <button
                      type="button"
                      onClick={() => onSelectDate(iso)}
                      className={cn(
                        'flex w-full items-center justify-between rounded border px-4 py-3 text-sm transition-colors',
                        selectedDate === iso
                          ? 'border-wine bg-wine-soft font-semibold text-wine'
                          : 'border-line bg-white text-ink hover:border-line-strong',
                      )}
                    >
                      <span>
                        {d.toLocaleString('en-IN', { weekday: 'long' })}
                      </span>
                      <span className="text-muted">
                        {d.toLocaleString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              We take bookings up to {calendar.windowDays} days ahead.
              {closedLabels.length > 0 && ` Closed: ${Array.from(new Set(closedLabels)).join(', ')}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeStep({
  date,
  serviceSlug,
  serviceName,
  durationMin,
  selected,
  onSelect,
  onPickAnotherDay,
}: {
  date: string;
  serviceSlug: string;
  serviceName: string;
  durationMin: number;
  selected: string | null;
  onSelect: (t: string) => void;
  onPickAnotherDay: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [data, setData] = useState<
    | { ok: true; slots: { start: string; end: string }[] }
    | { ok: false; code: string; message: string }
    | null
  >(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !serviceSlug) return;
    const ctrl = new AbortController();
    let active = true;
    setLoading(true);
    setData(null);
    setFetchError(null);
    fetch(`/api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(serviceSlug)}`, {
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok || !json) throw new Error(String(r.status));
        return json;
      })
      .then((json) => {
        if (active) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active && !(e instanceof Error && e.name === 'AbortError')) {
          setFetchError('We could not load the time slots. Please try again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [date, serviceSlug, retryKey]);

  const groups = useMemo(() => {
    if (!data || !data.ok) return [];
    const g: { label: string; slots: { start: string; end: string }[] }[] = [
      { label: 'Morning', slots: [] },
      { label: 'Afternoon', slots: [] },
      { label: 'Evening', slots: [] },
    ];
    for (const s of data.slots) {
      const h = parseInt(s.start.slice(0, 2), 10);
      if (h < 12) g[0].slots.push(s);
      else if (h < 16) g[1].slots.push(s);
      else g[2].slots.push(s);
    }
    return g.filter((x) => x.slots.length > 0);
  }, [data]);

  const d = new Date(date + 'T00:00:00');
  const dateLabel = d.toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink md:text-3xl">Pick a time</h2>
      <p className="mt-2 text-sm text-ink-soft">
        {dateLabel} · {serviceName} takes {formatDuration(durationMin)} — these are the slots
        that are genuinely free.
      </p>

      <div className="mt-6">
        {fetchError && (
          <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-danger">{fetchError}</p>
            <div className="flex gap-3">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRetryKey((k) => k + 1)}>
                Try again
              </button>
              <a
                href={waLink(env.business.whatsapp, `Hi! Is ${serviceName} available on ${dateLabel} at a time not listed? My phone: `)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp us
              </a>
            </div>
          </div>
        )}

        {loading && !fetchError && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Loading time slots" role="status">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-11" />
            ))}
            <span className="sr-only">Loading time slots…</span>
          </div>
        )}

        {!loading && data && !data.ok && (
          <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg text-ink">No times available on this date</p>
              <p className="mt-1 text-sm text-ink-soft">{data.message}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-outline" onClick={onPickAnotherDay}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Pick another date
              </button>
              <a
                href={waLink(
                  env.business.whatsapp,
                  `Hi! No slots showed for ${serviceName} on ${dateLabel}. Could you check if any time works?`,
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask on WhatsApp
              </a>
            </div>
          </div>
        )}

        {!loading && data?.ok && (
          <div className="space-y-6">
            {groups.map((grp) => (
              <div key={grp.label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {grp.label}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {grp.slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => onSelect(s.start)}
                      aria-pressed={selected === s.start}
                      className={cn(
                        'h-11 rounded border text-sm font-medium tabular-nums transition-colors',
                        selected === s.start
                          ? 'border-wine bg-wine text-ivory'
                          : 'border-line-strong bg-white text-ink hover:border-wine hover:text-wine',
                      )}
                    >
                      {formatTime12Client(s.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime12Client(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function DetailsStep({
  details,
  errors,
  onChange,
}: {
  details: Details;
  errors: FieldErrors;
  onChange: (patch: Partial<Details>) => void;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl text-ink md:text-3xl">Your details</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Just what we need to confirm your appointment. We only use your number to
        reach you about this booking.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="bk-name" className="label">
            Full name *
          </label>
          <input
            id="bk-name"
            className="input"
            value={details.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your name"
            autoComplete="name"
            maxLength={60}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="bk-phone" className="label">
            Phone *
          </label>
          <input
            id="bk-phone"
            className="input"
            value={details.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="10-digit mobile number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-wa" className="label">
              WhatsApp (if different)
            </label>
            <input
              id="bk-wa"
              className="input"
              value={details.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value })}
              placeholder="Same as phone"
              type="tel"
              inputMode="tel"
              maxLength={20}
              aria-invalid={Boolean(errors.whatsapp)}
            />
            {errors.whatsapp && <p className="field-error">{errors.whatsapp}</p>}
          </div>
          <div>
            <label htmlFor="bk-email" className="label">
              Email (optional)
            </label>
            <input
            id="bk-email"
              className="input"
              value={details.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="you@example.com"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={120}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="bk-notes" className="label">
            Notes / special requests
          </label>
          <textarea
            id="bk-notes"
            className="input"
            value={details.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Outfit colour, theme, allergies, travel plans…"
            maxLength={500}
            aria-invalid={Boolean(errors.notes)}
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>
      </div>
    </div>
  );
}

function LocationStep({
  location,
  errors,
  onChange,
}: {
  location: Location;
  errors: FieldErrors;
  onChange: (patch: Partial<Location>) => void;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="flex items-center gap-2 font-display text-2xl text-ink md:text-3xl">
        <MapPin className="h-6 w-6 text-wine" aria-hidden="true" />
        Where should we come?
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        This is the address of <strong>your home or venue</strong> where the service
        will happen — not a business address. Add enough detail (building, flat,
        landmark) so we can reach you easily.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="bk-loc" className="label">
            Service address / location *
          </label>
          <textarea
            id="bk-loc"
            className="input"
            rows={3}
            value={location.serviceLocation}
            onChange={(e) => onChange({ serviceLocation: e.target.value })}
            placeholder="House / building, flat or door number, street, landmark"
            maxLength={250}
            aria-invalid={Boolean(errors.serviceLocation)}
          />
          {errors.serviceLocation && <p className="field-error">{errors.serviceLocation}</p>}
        </div>

        <div>
          <label htmlFor="bk-area" className="label">
            Area / locality (helps with travel planning)
          </label>
          <input
            id="bk-area"
            className="input"
            value={location.area}
            onChange={(e) => onChange({ area: e.target.value })}
            placeholder="e.g. your neighbourhood or area name"
            maxLength={60}
            aria-invalid={Boolean(errors.area)}
          />
          {errors.area && <p className="field-error">{errors.area}</p>}
        </div>

        <div className="rounded border border-line bg-cream/60 p-4 text-xs leading-relaxed text-muted">
          Your location is private — it is only used to plan your home service and
          is never shown publicly. Home service availability may depend on your
          location; we confirm every appointment personally.
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  service,
  date,
  time,
  details,
  location,
  onEdit,
}: {
  service: Service;
  date: string;
  time: string;
  details: Details;
  location: Location;
  onEdit: (target: 'service' | 'date' | 'time' | 'details' | 'location') => void;
}) {
  const d = new Date(date + 'T00:00:00');
  const rows: {
    label: string;
    value: string;
    target: 'service' | 'date' | 'time' | 'details' | 'location';
  }[] = [
    {
      label: 'Service',
      value: `${service.name} · ${formatDuration(service.durationMin)} · ${
        service.startingPrice ? `from ${formatINR(service.startingPrice)}` : formatINR(service.price)
      }`,
      target: 'service',
    },
    {
      label: 'Date',
      value: d.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      target: 'date',
    },
    { label: 'Time', value: `${formatTime12Client(time)}`, target: 'time' },
    { label: 'Name', value: details.name, target: 'details' },
    { label: 'Phone', value: details.phone, target: 'details' },
    {
      label: 'Location',
      value: [location.serviceLocation, location.area].filter(Boolean).join(', '),
      target: 'location',
    },
  ];
  if (details.whatsapp) rows.push({ label: 'WhatsApp', value: details.whatsapp, target: 'details' });
  if (details.email) rows.push({ label: 'Email', value: details.email, target: 'details' });
  if (details.notes) rows.push({ label: 'Notes', value: details.notes, target: 'details' });

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl text-ink md:text-3xl">Review your request</h2>
      <p className="mt-2 text-sm text-ink-soft">One last look before you send it.</p>

      <dl className="card mt-6 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-5 py-4">
            <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:w-28">
              {r.label}
            </dt>
            <dd className="min-w-0 flex-1 break-words text-sm font-medium text-ink">{r.value}</dd>
            <button
              type="button"
              onClick={() => onEdit(r.target)}
              className="shrink-0 text-xs font-semibold text-wine underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded border border-warn/25 bg-warn-soft p-4 text-sm leading-relaxed text-ink-soft">
        <strong className="font-semibold text-ink">Good to know:</strong> sending this creates a{' '}
        <em>booking request</em>. Geeths Makeover confirms every appointment personally —
        until we confirm, your slot is reserved for review, not finalised.
      </div>
    </div>
  );
}

function ConfirmationStep({
  result,
  onReset,
}: {
  result: { booking: SubmittedBooking; waLink: string };
  onReset: () => void;
}) {
  const b = result.booking;
  const d = new Date(b.date + 'T00:00:00');

  return (
    <div className="mx-auto max-w-xl">
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-success-soft px-6 py-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            Booking request received
          </p>
        </div>
        <div className="p-6 md:p-8">
          <p className="text-sm text-ink-soft">
            Thank you, {b.name.split(' ')[0]}. Here is what we have:
          </p>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Reference</dt>
              <dd className="font-semibold tracking-wide text-ink">{b.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Service</dt>
              <dd className="text-right font-medium text-ink">{b.serviceName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-medium text-ink">
                {d.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Time</dt>
              <dd className="text-right font-medium text-ink">
                {formatTime12Client(b.startTime)}
              </dd>
            </div>
            {(b.serviceLocation || b.area) && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted">Service location</dt>
                <dd className="min-w-0 flex-1 break-words text-right text-ink">
                  {[b.serviceLocation, b.area].filter(Boolean).join(', ')}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phone</dt>
              <dd className="text-right font-medium text-ink">{b.phone}</dd>
            </div>
            {b.notes && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Notes</dt>
                <dd className="min-w-0 flex-1 break-words text-right text-ink">{b.notes}</dd>
              </div>
            )}
          </dl>

          <div className="mt-7 rounded border border-warn/25 bg-warn-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-warn">
              Status: pending confirmation
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Your appointment is <strong>requested, not yet confirmed</strong>. We will
              confirm by call or WhatsApp — usually within a few working hours. If your
              plan changes, call or WhatsApp us with your reference {b.id}.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <a href={result.waLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Continue on WhatsApp
            </a>
            <div className="flex gap-3">
              <button type="button" onClick={onReset} className="btn btn-outline flex-1">
                Book another
              </button>
              <Link href="/" className="btn btn-ghost flex-1">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
