'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import MonthGrid from '@/components/calendar/MonthGrid';
import StatusBadge from './StatusBadge';
import { adminFetch } from '@/lib/admin-client';
import type { BookingWithCustomer } from '@/lib/db/repositories';
import { formatDateLong, formatTime12, todayISO } from '@/lib/utils';

type MonthResponse = {
  month: string;
  from: string;
  to: string;
  bookings: BookingWithCustomer[];
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AdminCalendar() {
  const thisMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<MonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async (m: string) => {
    try {
      const d = await adminFetch<MonthResponse>(`/api/admin/calendar?month=${m}`);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(month);
  }, [month, load]);

  const byDate = useMemo(() => {
    const map = new Map<string, BookingWithCustomer[]>();
    for (const b of data?.bookings ?? []) {
      const list = map.get(b.date) ?? [];
      list.push(b);
      map.set(b.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [data]);

  const [y, m] = month.split('-').map(Number);
  const shift = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setMonth(next);
    setSelectedDay(null);
  };

  const dayBookings = selectedDay ? byDate.get(selectedDay) ?? [] : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Calendar</h1>
          <p className="mt-1 text-sm text-muted">
            Tap a day to see its bookings.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setMonth(thisMonth);
              setSelectedDay(todayISO());
            }}
          >
            Today
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => load(month)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {loading && <div className="skeleton h-96" />}
          {error && !loading && (
            <div className="card p-8 text-center">
              <p className="font-display text-lg text-ink">Could not load the calendar</p>
              <p className="mt-2 text-sm text-ink-soft">{error}</p>
              <button type="button" className="btn btn-primary mt-5" onClick={() => load(month)}>
                Try again
              </button>
            </div>
          )}
          {!loading && !error && (
            <MonthGrid
              year={y}
              month={m - 1}
              monthLabel={`${MONTHS[m - 1]} ${y}`}
              today={todayISO()}
              canPrev
              canNext
              onPrev={() => shift(-1)}
              onNext={() => shift(1)}
              selectedDate={selectedDay}
              onSelectDate={setSelectedDay}
              dayDots={(iso) => (byDate.get(iso) ?? []).map((b) => b.status)}
              showLegend
            />
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg text-ink">
            {selectedDay ? formatDateLong(selectedDay) : 'Select a day'}
          </h2>
          {!selectedDay && (
            <p className="card p-6 text-sm text-muted">
              Choose a date on the calendar to see its appointments.
            </p>
          )}
          {selectedDay && dayBookings.length === 0 && (
            <p className="card p-6 text-sm text-muted">
              Nothing booked on this day yet.
            </p>
          )}
          {selectedDay && dayBookings.length > 0 && (
            <ul className="card divide-y divide-line">
              {dayBookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-cream/60"
                  >
                    <p className="w-20 shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {formatTime12(b.startTime)}
                    </p>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{b.customer.name}</p>
                      <p className="truncate text-xs text-muted">{b.serviceName}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
