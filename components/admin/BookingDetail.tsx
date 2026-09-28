'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  StickyNote,
  X,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import type { BookingWithCustomer } from '@/lib/db/repositories';
import {
  formatDuration,
  formatDateLong,
  formatINR,
  formatTimeRange,
} from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';

export default function BookingDetail({
  booking,
  waLink: customerWa,
}: {
  booking: BookingWithCustomer;
  waLink: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const act = async (status: 'confirmed' | 'cancelled' | 'completed') => {
    setBusy(status);
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setNotice(
        status === 'confirmed'
          ? 'Booking confirmed. The slot is locked in.'
          : status === 'completed'
            ? 'Marked as completed. Thank you!'
            : 'Booking cancelled. The slot is available again.',
      );
      setTimeout(() => router.refresh(), 350);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const c = booking.customer;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-wine"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All bookings
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Booking {booking.id}
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink">{c.name}</h1>
        </div>
        <StatusBadge status={booking.status} className="px-3 py-1.5 text-xs" />
      </div>

      {notice && (
        <p
          role="status"
          className="animate-fade-in mt-5 rounded border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
        >
          {notice}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {booking.status === 'pending' && (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => act('confirmed')}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Confirm booking
          </button>
        )}
        {booking.status === 'confirmed' && (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => act('completed')}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Mark completed
          </button>
        )}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <button type="button" className="btn btn-outline text-danger" disabled={busy !== null} onClick={() => setCancelOpen(true)}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel booking
          </button>
        )}
        <a
          href={customerWa}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Message customer
        </a>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Appointment */}
        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <Clock className="h-4 w-4 text-wine" aria-hidden="true" />
            Appointment
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Service</dt>
              <dd className="mt-0.5 font-semibold text-ink">{booking.serviceName}</dd>
            </div>
            <div>
              <dt className="text-muted">Date</dt>
              <dd className="mt-0.5 font-medium text-ink">{formatDateLong(booking.date)}</dd>
            </div>
            <div>
              <dt className="text-muted">Time</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-ink">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </dd>
            </div>
            <div className="flex gap-6 pt-1">
              {booking.durationMin && (
                <div>
                  <dt className="text-muted">Duration</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDuration(booking.durationMin)}</dd>
                </div>
              )}
              {booking.price && (
                <div>
                  <dt className="text-muted">Price</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatINR(booking.price)}</dd>
                </div>
              )}
            </div>
          </dl>
        </section>

        {/* Customer */}
        <section className="card p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Phone</dt>
              <dd>
                <a
                  href={`tel:${c.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-wine"
                >
                  <Phone className="h-3.5 w-3.5 text-wine" aria-hidden="true" />
                  {c.phoneDisplay}
                </a>
              </dd>
            </div>
            {c.whatsapp && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">WhatsApp</dt>
                <dd>
                  <a
                    href={waLink(c.whatsapp, `Hi ${c.name}, this is Geeths Makeover about your booking (${booking.id}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-wine"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-wine" aria-hidden="true" />
                    {c.whatsapp}
                  </a>
                </dd>
              </div>
            )}
            {c.email && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd>
                  <a
                    href={`mailto:${c.email}`}
                    className="inline-flex items-center gap-1.5 break-all font-medium text-ink hover:text-wine"
                  >
                    <Mail className="h-3.5 w-3.5 text-wine" aria-hidden="true" />
                    {c.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Requested {new Date(booking.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </section>
      </div>

      {/* Home-service location (private — admin only) */}
      {(booking.serviceLocation || booking.area) && (
        <section className="card mt-4 border-wine/30 bg-wine-soft/30 p-6">
          <h2 className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <MapPin className="h-4 w-4 text-wine" aria-hidden="true" />
            Service location
            <span className="inline-flex items-center gap-1 rounded-full border border-wine/30 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-wine">
              <Home className="h-3 w-3" aria-hidden="true" />
              Home service
            </span>
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Service address</dt>
              <dd className="mt-0.5 whitespace-pre-wrap font-medium text-ink">
                {booking.serviceLocation || '—'}
              </dd>
            </div>
            {booking.area && (
              <div>
                <dt className="text-muted">Area / locality</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.area}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 border-t border-wine/15 pt-3 text-xs text-muted">
            Customer&apos;s private location — used only to plan the home service.
            Never shown publicly.
          </p>
        </section>
      )}

      {booking.notes && (
        <section className="card mt-4 p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <StickyNote className="h-4 w-4 text-wine" aria-hidden="true" />
            Notes from customer
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {booking.notes}
          </p>
        </section>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this booking?"
        message={`${c.name} · ${booking.serviceName} on ${formatDateLong(booking.date)} at ${formatTimeRange(booking.startTime, booking.endTime)}. The time slot will open up for other customers.`}
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        danger
        busy={busy === 'cancelled'}
        onConfirm={() => {
          setCancelOpen(false);
          act('cancelled');
        }}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
