import { env } from '@/lib/env';
import type { BookingWithCustomer } from '@/lib/db/repositories';
import { formatDateLong, formatTimeRange } from '@/lib/utils';

/**
 * WhatsApp deep links. The business number comes from env vars (never
 * hard-coded) and only ends up in a shareable URL — never as a secret.
 */
export function waLink(number: string, text: string): string {
  let digits = number.replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`; // assume India
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function businessWaLink(text: string): string {
  return waLink(env.business.whatsapp, text);
}

/** Pre-filled message a customer sends to the business after booking. */
export function newBookingWaMessage(b: {
  reference: string;
  name: string;
  phone: string;
  serviceName: string;
  date: string;
  start: string;
  end: string;
  serviceLocation?: string | null;
  area?: string | null;
  notes?: string | null;
}): string {
  const lines = [
    'New Geeths Makeover Booking (Home Service)',
    `Reference: ${b.reference}`,
    `Customer: ${b.name}`,
    `Phone: ${b.phone}`,
    `Service: ${b.serviceName}`,
    `Date: ${formatDateLong(b.date)}`,
    `Time: ${formatTimeRange(b.start, b.end)}`,
  ];
  if (b.area) lines.push(`Area: ${b.area}`);
  if (b.serviceLocation) lines.push(`Service location: ${b.serviceLocation}`);
  lines.push(`Notes: ${b.notes || '—'}`);
  return lines.join('\n');
}

/** Pre-filled message the business sends to a customer. */
export function customerMessageWaMessage(
  booking: BookingWithCustomer,
  note: string,
): string {
  return [
    `Hi ${booking.customer.name}, this is Geeths Makeover.`,
    ``,
    note,
    ``,
    `Booking: ${booking.serviceName}`,
    `Date: ${formatDateLong(booking.date)}`,
    `Time: ${formatTimeRange(booking.startTime, booking.endTime)}`,
    `Reference: ${booking.id}`,
  ].join('\n');
}

export function customerWaLink(booking: BookingWithCustomer, note: string): string {
  const target = booking.customer.whatsapp || booking.customer.phone;
  return waLink(target, customerMessageWaMessage(booking, note));
}
