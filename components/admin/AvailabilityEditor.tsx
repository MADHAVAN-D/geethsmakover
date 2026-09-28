'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, CalendarX2, Clock3, RefreshCw, Save, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import type {
  BlockedDate,
  BlockedSlot,
  DayAvailability,
} from '@/lib/db/repositories';
import { DAY_NAMES, formatDateShort, formatTime12, isValidHHMM, todayISO } from '@/lib/utils';

type AvailabilityData = {
  days: DayAvailability[];
  slotDurationMin: number;
  leadMin: number;
  windowDays: number;
  blockedDates: BlockedDate[];
  blockedSlots: BlockedSlot[];
};

const SLOT_OPTIONS = [15, 30, 45, 60];

export default function AvailabilityEditor() {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [blockDate, setBlockDate] = useState('');
  const [blockDateReason, setBlockDateReason] = useState('');
  const [blockSlotDate, setBlockSlotDate] = useState('');
  const [blockSlotStart, setBlockSlotStart] = useState('10:00');
  const [blockSlotEnd, setBlockSlotEnd] = useState('12:00');
  const [blockSlotReason, setBlockSlotReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<AvailabilityData>('/api/admin/availability');
      setData(d);
      setDays(
        [...d.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      );
      setSlotDuration(d.slotDurationMin);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load availability.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const saveHours = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/availability', {
        method: 'PUT',
        body: JSON.stringify({ days, slotDurationMin: slotDuration }),
      });
      flash('Working hours saved. The customer calendar updates immediately.');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save. Please check your times.');
    } finally {
      setSaving(false);
    }
  };

  const patchDay = (dayOfWeek: number, patch: Partial<DayAvailability>) => {
    setDays((ds) => ds.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  };

  const addBlockedDate = async () => {
    if (!blockDate) {
      flash('Pick a date to block first.');
      return;
    }
    setBusy('date');
    try {
      await adminFetch('/api/admin/blocked-dates', {
        method: 'POST',
        body: JSON.stringify({ date: blockDate, reason: blockDateReason || null }),
      });
      setBlockDate('');
      setBlockDateReason('');
      flash('Date blocked. Customers can no longer book it.');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not block the date.');
    } finally {
      setBusy(null);
    }
  };

  const removeBlockedDate = async (id: number) => {
    setBusy(`date-${id}`);
    try {
      await adminFetch(`/api/admin/blocked-dates/${id}`, { method: 'DELETE' });
      flash('Date unblocked.');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not unblock the date.');
    } finally {
      setBusy(null);
    }
  };

  const addBlockedSlot = async () => {
    if (!blockSlotDate || !isValidHHMM(blockSlotStart) || !isValidHHMM(blockSlotEnd)) {
      flash('Pick a date, start and end time first.');
      return;
    }
    setBusy('slot');
    try {
      await adminFetch('/api/admin/blocked-slots', {
        method: 'POST',
        body: JSON.stringify({
          date: blockSlotDate,
          start: blockSlotStart,
          end: blockSlotEnd,
          reason: blockSlotReason || null,
        }),
      });
      setBlockSlotDate('');
      setBlockSlotStart('10:00');
      setBlockSlotEnd('12:00');
      setBlockSlotReason('');
      flash('Time blocked. Those slots are hidden from customers now.');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not block the time.');
    } finally {
      setBusy(null);
    }
  };

  const removeBlockedSlot = async (id: number) => {
    setBusy(`slot-${id}`);
    try {
      await adminFetch(`/api/admin/blocked-slots/${id}`, { method: 'DELETE' });
      flash('Time unblocked.');
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not unblock the time.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-9 w-56" />
        <div className="mt-6 skeleton h-80" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg text-ink">Could not load availability</p>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <button type="button" className="btn btn-primary mt-5" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const upcomingBlockedDates = data.blockedDates
    .filter((b) => b.date >= todayISO())
    .slice(0, 6);
  const upcomingBlockedSlots = data.blockedSlots
    .filter((b) => b.date >= todayISO())
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Availability</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
            Set when you are open. Block dates or times that are never free —
        customers stop seeing them immediately.
      </p>

      {notice && (
        <p role="status" className="animate-fade-in mt-5 rounded border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      {/* Weekly hours */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Clock3 className="h-4 w-4 text-wine" aria-hidden="true" />
            Weekly hours
          </h2>
          <div className="flex items-center gap-3">
            <label htmlFor="slot-duration" className="text-xs font-semibold text-muted">
              Slot length
            </label>
            <select
              id="slot-duration"
              className="input h-10 w-28 text-sm"
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
            >
              {SLOT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o} min
                </option>
              ))}
            </select>
          </div>
        </div>
        <ul className="divide-y divide-line">
          {days.map((d) => (
            <li key={d.dayOfWeek} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
              <span className="w-24 text-sm font-semibold text-ink">{DAY_NAMES[d.dayOfWeek]}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={d.enabled}
                  onChange={(e) => patchDay(d.dayOfWeek, { enabled: e.target.checked })}
                  aria-label={`${DAY_NAMES[d.dayOfWeek]} open`}
                />
                <span className="relative h-6 w-11 rounded-full bg-line-strong transition-colors peer-checked:bg-success peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wine" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" aria-hidden="true" />
                <span className="sr-only">{d.enabled ? 'Open' : 'Closed'}</span>
              </label>
              <span className={d.enabled ? 'text-xs text-muted' : 'text-xs text-muted/50'}>
                {d.enabled ? 'Open' : 'Closed'}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted">
                  From
                  <input
                    type="time"
                    className="input h-10 w-28 text-sm tabular-nums"
                    value={d.openingTime}
                    disabled={!d.enabled}
                    onChange={(e) => patchDay(d.dayOfWeek, { openingTime: e.target.value })}
                    aria-label={`${DAY_NAMES[d.dayOfWeek]} opening time`}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted">
                  To
                  <input
                    type="time"
                    className="input h-10 w-28 text-sm tabular-nums"
                    value={d.closingTime}
                    disabled={!d.enabled}
                    onChange={(e) => patchDay(d.dayOfWeek, { closingTime: e.target.value })}
                    aria-label={`${DAY_NAMES[d.dayOfWeek]} closing time`}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-cream/40 p-5">
          <p className="text-xs text-muted">
            Slots are offered every {slotDuration} minutes. Long services automatically take more time.
          </p>
          <button type="button" className="btn btn-primary" onClick={saveHours} disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save hours'}
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Block a full date */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <CalendarX2 className="h-4 w-4 text-wine" aria-hidden="true" />
            Block a date
          </h2>
          <p className="mt-1 text-xs text-muted">
            Vacation, festival, or just not taking bookings that day.
          </p>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bd-date" className="label">Date</label>
                <input
                  id="bd-date"
                  type="date"
                  className="input"
                  min={todayISO()}
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bd-reason" className="label">Reason (optional)</label>
                <input
                  id="bd-reason"
                  className="input"
                  placeholder="e.g. Family function"
                  value={blockDateReason}
                  maxLength={100}
                  onChange={(e) => setBlockDateReason(e.target.value)}
                />
              </div>
            </div>
            <button type="button" className="btn btn-outline" onClick={addBlockedDate} disabled={busy === 'date' || !blockDate}>
              <Ban className="h-4 w-4" aria-hidden="true" />
              Block date
            </button>
          </div>
          {upcomingBlockedDates.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {upcomingBlockedDates.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{formatDateShort(b.date)}</p>
                    {b.reason && <p className="truncate text-xs text-muted">{b.reason}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => removeBlockedDate(b.id)}
                    disabled={busy === `date-${b.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Block a time range */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Clock3 className="h-4 w-4 text-wine" aria-hidden="true" />
            Block a time
          </h2>
          <p className="mt-1 text-xs text-muted">
            Keep a lunch break or personal hour free on a working day.
          </p>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="bs-date" className="label">Date</label>
                <input
                  id="bs-date"
                  type="date"
                  className="input"
                  min={todayISO()}
                  value={blockSlotDate}
                  onChange={(e) => setBlockSlotDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bs-start" className="label">From</label>
                <input
                  id="bs-start"
                  type="time"
                  className="input tabular-nums"
                  value={blockSlotStart}
                  onChange={(e) => setBlockSlotStart(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bs-end" className="label">To</label>
                <input
                  id="bs-end"
                  type="time"
                  className="input tabular-nums"
                  value={blockSlotEnd}
                  onChange={(e) => setBlockSlotEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="bs-reason" className="label">Reason (optional)</label>
              <input
                id="bs-reason"
                className="input"
                placeholder="e.g. Lunch break"
                value={blockSlotReason}
                maxLength={100}
                onChange={(e) => setBlockSlotReason(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-outline" onClick={addBlockedSlot} disabled={busy === 'slot' || !blockSlotDate}>
              <Ban className="h-4 w-4" aria-hidden="true" />
              Block time
            </button>
          </div>
          {upcomingBlockedSlots.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {upcomingBlockedSlots.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {formatDateShort(b.date)} · {formatTime12(b.startTime)}–{formatTime12(b.endTime)}
                    </p>
                    {b.reason && <p className="truncate text-xs text-muted">{b.reason}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => removeBlockedSlot(b.id)}
                    disabled={busy === `slot-${b.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
