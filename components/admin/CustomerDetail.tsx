'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BookingWithCustomer, Customer } from '@/lib/db/repositories';
import { formatDateLong, formatDateShort, formatTimeRange } from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';

export default function CustomerDetail({
  customer,
  bookings,
}: {
  customer: Customer;
  bookings: BookingWithCustomer[];
}) {
  const target = customer.whatsapp || customer.phone;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-wine"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All customers
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{customer.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {customer.phoneDisplay}
            {customer.email ? ` · ${customer.email}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`tel:${customer.phone.replace(/\s/g, '')}`}
            className="btn btn-outline"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
          <a
            href={waLink(
              target,
              `Hi ${customer.name}, this is Geeths Makeover. We have your details on file — how can we help?`,
            )}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="btn btn-outline">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </a>
          )}
        </div>
      </div>

      <h2 className="mt-10 mb-4 font-display text-xl text-ink">
        Booking history ({bookings.length})
      </h2>
      {bookings.length === 0 ? (
        <p className="card p-8 text-sm text-muted">No bookings recorded for this customer yet.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/bookings/${b.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 transition-colors hover:bg-cream/50"
              >
                <div className="w-32 shrink-0">
                  <p className="text-sm font-semibold text-ink">{formatDateShort(b.date)}</p>
                  <p className="text-xs text-muted">{formatTimeRange(b.startTime, b.endTime)}</p>
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">{b.serviceName}</p>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Full date view: {bookings[0] ? formatDateLong(bookings[0].date) : ''}
        {bookings.length > 1 ? ' and earlier' : ''}.
      </p>
    </div>
  );
}
