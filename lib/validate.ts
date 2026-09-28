import type { BookingStatus } from '@/lib/db/repositories';
import { parseISODate, todayISO } from '@/lib/utils';

export type BookingInput = {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
  /** Home-service: where the service will be provided (customer's location). */
  serviceLocation: string;
  /** Home-service: area / locality (optional). */
  area?: string;
  service: string; // service slug
  date: string; // YYYY-MM-DD
  time: string; // HH:MM start time
};

export type FieldErrors = Partial<
  Record<
    'name' | 'phone' | 'whatsapp' | 'email' | 'notes' | 'serviceLocation' | 'area',
    string
  >
>;

const PHONE_RE = /^\+?\d{10,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DETAILS_FIELDS: (keyof FieldErrors)[] = [
  'name',
  'phone',
  'whatsapp',
  'email',
  'notes',
];
export const LOCATION_FIELDS: (keyof FieldErrors)[] = ['serviceLocation', 'area'];

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

/**
 * Validates all customer fields. Date/time/service rules are enforced by the
 * booking engine — this covers the person and the home-service location.
 */
export function validateBookingInput(
  input: BookingInput,
): { errors: FieldErrors; value: BookingInput } {
  const errors: FieldErrors = {};

  const name = (input.name ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60) {
    errors.name = 'Please enter your full name (2–60 characters).';
  }

  const phone = normalizePhone(input.phone ?? '');
  if (!PHONE_RE.test(phone)) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }

  const whatsappRaw = (input.whatsapp ?? '').trim();
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : '';
  if (whatsapp && !PHONE_RE.test(whatsapp)) {
    errors.whatsapp = 'Enter a valid WhatsApp number, or leave it empty.';
  }

  const email = (input.email ?? '').trim();
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address, or leave it empty.';
  }

  const notes = (input.notes ?? '').trim();
  if (notes.length > 500) {
    errors.notes = 'Please keep notes under 500 characters.';
  }

  const serviceLocation = (input.serviceLocation ?? '').trim();
  if (serviceLocation.length < 8) {
    errors.serviceLocation =
      'Please enter the full address where we should come (house, street, landmark).';
  } else if (serviceLocation.length > 250) {
    errors.serviceLocation = 'Please keep the address under 250 characters.';
  }

  const area = (input.area ?? '').trim();
  if (area.length > 60) {
    errors.area = 'Please keep the area under 60 characters.';
  }

  return {
    errors,
    value: {
      name,
      phone,
      whatsapp,
      email,
      notes,
      serviceLocation,
      area,
      service: input.service,
      date: input.date,
      time: input.time,
    },
  };
}

export function hasErrorsFor(
  errors: FieldErrors,
  fields: (keyof FieldErrors)[],
): boolean {
  return fields.some((f) => Boolean(errors[f]));
}

export function validateDateInput(date: string): string | null {
  if (!parseISODate(date)) return 'Please pick a date from the calendar.';
  if (date < todayISO()) return 'That date is in the past. Please pick a future date.';
  return null;
}

export function validateStatusTransition(
  from: BookingStatus,
  to: BookingStatus,
): string | null {
  const allowed: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled', 'completed'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  if (!allowed[from].includes(to)) {
    return `A ${from} booking cannot be changed to ${to}.`;
  }
  return null;
}
