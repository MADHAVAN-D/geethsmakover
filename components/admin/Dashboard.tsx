'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, RefreshCw, X } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import StatusBadge from './StatusBadge';
import StatCard from './StatCard';
import { formatDateShort, formatTime12, formatTimeRange } from '@/lib/utils';
import type { BookingWithCustomer } from '@/lib/db/repositories';

type Summary = {
  today: string;
  todayBookings: BookingWithCustomer[];
  pending: BookingWithCustomer[];
  counts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
    week: number;
    month: number;
  };
};

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<Summary>('/api/admin/summary');
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (booking: BookingWithCustomer, status: 'confirmed' | 'cancelled' | 'completed') => {
    setActing(booking.id);
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      const label =
        status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'completed' : 'cancelled';
      setNotice(`${booking.customer.name}'s booking ${label}.`);
      await load();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-9 w-48" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton mt-6 h-64" />
        <span className="sr-only" role="status">
          Loading dashboard…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Could not load your dashboard</p>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const c = data.counts;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Today</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date().toLocaleString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="animate-fade-in mt-5 rounded border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={c.today} hint="appointments" accent href="/admin/bookings" />
        <StatCard label="Pending" value={c.pending} hint="need your reply" href="/admin/bookings?status=pending" />
        <StatCard label="This week" value={c.week} hint="± 6 days" href="/admin/bookings" />
        <StatCard label="This month" value={c.month} hint="bookings" href="/admin/bookings" />
      </div>

      {/* Pending requests */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">New requests to confirm</h2>
          <Link
            href="/admin/bookings?status=pending"
            className="inline-flex items-center gap-1 text-sm font-semibold text-wine"
          >
            All bookings <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        {data.pending.length === 0 ? (
          <p className="card p-6 text-sm text-muted">
            No pending requests. Everything is handled.
          </p>
        ) : (
          <ul className="card divide-y divide-line">
            {data.pending.slice(0, 5).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{b.customer.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDateShort(b.date)} · {formatTimeRange(b.startTime, b.endTime)} ·{' '}
                    {b.serviceName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={acting === b.id}
                    onClick={() => act(b, 'confirmed')}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={acting === b.id}
                    onClick={() => act(b, 'cancelled')}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Today's list */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl text-ink">Today&rsquo;s appointments</h2>
        {data.todayBookings.length === 0 ? (
          <p className="card p-6 text-sm text-muted">
            Nothing scheduled today. A quiet day.
          </p>
        ) : (
          <ul className="card divide-y divide-line">
            {data.todayBookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <p className="w-24 shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {formatTime12(b.startTime)}
                </p>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="min-w-0 flex-1 transition-colors hover:text-wine"
                >
                  <p className="truncate text-sm font-semibold text-ink">{b.customer.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{b.serviceName}</p>
                </Link>
                <StatusBadge status={b.status} />
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-white text-ink-soft"
                  aria-label={`Open booking ${b.id}`}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs text-muted">
        Tip: quick actions here update the booking immediately — the customer
        calendar reflects it right away.
      </p>
    </div>
  );
}
