'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { adminFetch, debounce } from '@/lib/admin-client';
import type { CustomerWithStats } from '@/lib/db/repositories';
import { formatDateShort } from '@/lib/utils';

type ListResponse = { customers: CustomerWithStats[] };

export default function CustomerList() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const d = await adminFetch<ListResponse>(`/api/admin/customers?${params.toString()}`);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(q);
  }, [q, load]);

  const debouncedQ = useRef(debounce((v: string) => setQ(v), 300)).current;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Customers</h1>
      <p className="mt-1 text-sm text-muted">
        Every customer we have booked with, with their history.
      </p>

      <div className="mt-6 max-w-md">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="customer-search"
            className="input pl-9"
            placeholder="Search name or phone…"
            value={q}
            onChange={(e) => debouncedQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        )}
        {error && !loading && (
          <div className="card p-8 text-center">
            <p className="font-display text-lg text-ink">Could not load customers</p>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => load(q)}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && data && data.customers.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink">No customers yet</p>
            <p className="mt-2 text-sm text-muted">
              Customers appear here automatically after their first booking.
            </p>
          </div>
        )}
        {!loading && !error && data && data.customers.length > 0 && (
          <ul className="card divide-y divide-line">
            {data.customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 transition-colors hover:bg-cream/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{c.phoneDisplay}</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>
                      <span className="font-semibold text-ink">{c.bookingCount}</span> booking
                      {c.bookingCount === 1 ? '' : 's'}
                    </p>
                    {c.upcomingCount > 0 && (
                      <p className="mt-0.5 text-success">
                        {c.upcomingCount} upcoming
                      </p>
                    )}
                    {c.lastBookingDate && (
                      <p className="mt-0.5">Last: {formatDateShort(c.lastBookingDate)}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
