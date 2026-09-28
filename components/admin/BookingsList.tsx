'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { adminFetch, debounce } from '@/lib/admin-client';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import { cn, formatDateShort, formatTimeRange } from '@/lib/utils';
import type { BookingStatus, BookingWithCustomer } from '@/lib/db/repositories';

type ListResponse = {
  bookings: BookingWithCustomer[];
  counts: Record<BookingStatus, number>;
};

type Filter = BookingStatus | 'all';

const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsList() {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingWithCustomer | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (f: Filter, query: string) => {
    try {
      const params = new URLSearchParams();
      if (f !== 'all') params.set('status', f);
      if (query.trim()) params.set('q', query.trim());
      const d = await adminFetch<ListResponse>(
        `/api/admin/bookings?${params.toString()}`,
      );
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(filter, q);
  }, [filter, q, load]);

  const debouncedQ = useRef(
    debounce((value: string) => setQ(value), 300),
  ).current;

  const doStatus = async (
    booking: BookingWithCustomer,
    status: 'confirmed' | 'completed',
  ) => {
    setActing(booking.id);
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setNotice(`${booking.customer.name}'s booking ${status}.`);
      load(filter, q);
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setActing(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActing(cancelTarget.id);
    try {
      await adminFetch(`/api/admin/bookings/${cancelTarget.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      setNotice(`${cancelTarget.customer.name}'s booking was cancelled.`);
      setCancelTarget(null);
      load(filter, q);
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not cancel the booking.');
    } finally {
      setActing(null);
    }
  };

  const counts = data?.counts;
  const total = counts
    ? counts.pending + counts.confirmed + counts.completed + counts.cancelled
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-muted">
            Search by name, phone or booking ID.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="booking-search" className="sr-only">
          Search bookings
        </label>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="booking-search"
            ref={searchRef}
            className="input pl-9"
            placeholder="Search name, phone, booking ID…"
            value={q}
            onChange={(e) => debouncedQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => {
          const n =
            t.key === 'all' ? total : (counts?.[t.key] ?? 0);
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(t.key)}
              className={cn(
                'h-10 rounded-full border px-4 text-[13px] font-medium transition-colors',
                active
                  ? 'border-wine bg-wine text-ivory'
                  : 'border-line-strong bg-white text-ink-soft hover:border-ink',
              )}
            >
              {t.label}
              <span className={cn('ml-1.5 tabular-nums', active ? 'text-ivory/70' : 'text-muted')}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {notice && (
        <p role="status" className="animate-fade-in mt-5 rounded border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      <div className="mt-6">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16" />
            ))}
            <span className="sr-only" role="status">
              Loading bookings…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="card p-8 text-center">
            <p className="font-display text-lg text-ink">Could not load bookings</p>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => load(filter, q)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && data && data.bookings.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink">No bookings found</p>
            <p className="mt-2 text-sm text-muted">
              {q
                ? 'Try a different search term.'
                : 'When customers book online, they will appear here.'}
            </p>
          </div>
        )}

        {!loading && !error && data && data.bookings.length > 0 && (
          <ul className="card divide-y divide-line">
            {data.bookings.map((b) => (
              <li key={b.id} className="p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {formatDateShort(b.date)}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted">
                      {formatTimeRange(b.startTime, b.endTime)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="min-w-0 flex-1 transition-colors hover:text-wine"
                  >
                    <p className="truncate text-sm font-semibold text-ink">
                      {b.customer.name}
                      <span className="ml-2 text-xs font-normal text-muted">{b.customer.phoneDisplay}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {b.serviceName} · {b.id}
                      {b.area && <span className="text-muted/70"> · {b.area}</span>}
                    </p>
                  </Link>
                  <StatusBadge status={b.status} />
                  <div className="flex gap-2">
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={acting === b.id}
                        onClick={() => doStatus(b, 'confirmed')}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Confirm
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={acting === b.id}
                        onClick={() => doStatus(b, 'completed')}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Complete
                      </button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm text-danger"
                        disabled={acting === b.id}
                        onClick={() => setCancelTarget(b)}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-white text-ink-soft"
                      aria-label={`Open booking ${b.id}`}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this booking?"
        message={
          cancelTarget
            ? `${cancelTarget.customer.name} · ${cancelTarget.serviceName} on ${formatDateShort(cancelTarget.date)} at ${formatTimeRange(cancelTarget.startTime, cancelTarget.endTime)}. The time slot will open up for other customers.`
            : ''
        }
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        danger
        busy={acting === cancelTarget?.id}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
