import { randomBytes } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import * as repo from '@/lib/db/repositories';
import { getActiveServiceBySlug } from '@/lib/content';
import type { BookingInput } from '@/lib/validate';
import {
  DETAILS_FIELDS,
  LOCATION_FIELDS,
  hasErrorsFor,
  validateBookingInput,
} from '@/lib/validate';
import { todayISO } from '@/lib/utils';
import { availableSlots, dayOfWeekOf } from './engine';

export type CreateBookingResult =
  | { ok: true; booking: repo.BookingWithCustomer }
  | {
      ok: false;
      code:
        | 'INVALID_INPUT'
        | 'SERVICE_NOT_FOUND'
        | 'INVALID_DATE'
        | 'PAST_DATE'
        | 'OUT_OF_WINDOW'
        | 'CLOSED_DAY'
        | 'BLOCKED_DATE'
        | 'NO_SLOTS'
        | 'SLOT_TAKEN'
        | 'DB_ERROR';
      message: string;
      /** Which booking step the customer should return to. */
      step?: 'service' | 'date' | 'time' | 'details' | 'location';
    };

const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function newBookingId(): string {
  const bytes = randomBytes(5);
  let code = 'GM-';
  for (const b of bytes) code += ID_ALPHABET[b % ID_ALPHABET.length];
  return code;
}

function intSetting(key: string, fallback: number): number {
  const n = parseInt(repo.getSetting(key, String(fallback)), 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Server-side booking creation. Re-validates EVERYTHING (never trusts the
 * browser): customer fields, service, date, working hours, blocked dates,
 * blocked slots and existing bookings — then inserts inside a transaction
 * with a final overlap re-check (SQLite is single-writer, so this is atomic).
 */
export async function createBooking(input: BookingInput): Promise<CreateBookingResult> {
  // 1. Customer data + home-service location
  const { errors, value } = validateBookingInput(input);
  if (Object.keys(errors).length > 0) {
    // Route the customer back to the step that actually has errors.
    const step = hasErrorsFor(errors, LOCATION_FIELDS) ? 'location' : 'details';
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Please fix the highlighted fields and try again.',
      step,
    };
  }

  // 2. Service
  const service = await getActiveServiceBySlug(value.service);
  if (!service) {
    return {
      ok: false,
      code: 'SERVICE_NOT_FOUND',
      message: 'This service is no longer available. Please choose another one.',
      step: 'service',
    };
  }

  // 3. Date + 4. time format
  const todayIso = todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
    return { ok: false, code: 'INVALID_DATE', message: 'Please pick a date from the calendar.', step: 'date' };
  }
  if (value.date < todayIso) {
    return { ok: false, code: 'PAST_DATE', message: 'That date is in the past. Please pick a future date.', step: 'date' };
  }
  if (!/^\d{2}:\d{2}$/.test(value.time)) {
    return { ok: false, code: 'NO_SLOTS', message: 'Please pick a time slot.', step: 'time' };
  }

  // 5-8. Working hours, blocked dates, blocked slots, existing bookings
  const days = repo.getAvailabilityDays();
  const day = days.find((d) => d.dayOfWeek === dayOfWeekOf(value.date)) ?? null;
  const blockedDate = repo.listBlockedDates().some((b) => b.date === value.date);
  const blockedSlots = repo.getBlockedSlotsForDate(value.date);
  const activeBookings = repo.listActiveBookingsForDate(value.date);

  const avail = availableSlots({
    date: value.date,
    serviceDurationMin: service.durationMin,
    slotDurationMin: repo.getSlotDurationMin(),
    leadMin: intSetting('booking_lead_min', 60),
    windowDays: intSetting('booking_window_days', 60),
    day,
    blockedDate,
    blockedSlots,
    activeBookings,
    now: new Date(),
    todayOverride: todayIso,
  });

  if (!avail.ok) {
    return {
      ok: false,
      code: avail.code,
      message: avail.message,
      step: avail.code === 'NO_SLOTS' ? 'time' : 'date',
    };
  }

  // 9. The exact requested slot must still be free.
  const chosen = avail.slots.find((s) => s.start === value.time);
  if (!chosen) {
    return {
      ok: false,
      code: 'SLOT_TAKEN',
      message: 'Sorry, that time was just booked. Please pick another slot.',
      step: 'time',
    };
  }

  // 10. Create safely (transaction + final overlap re-check).
  try {
    const db = getDb();
    const result = db.transaction(() => {
      const conflict = db
        .prepare(
          `SELECT 1 AS x FROM bookings
            WHERE date = ? AND status IN ('pending','confirmed')
              AND start_time < ? AND ? < end_time`,
        )
        .get(value.date, chosen.end, chosen.start);
      if (conflict) return { conflict: true as const };

      const customer = repo.upsertCustomer({
        name: value.name,
        phone: value.phone.replace(/^\+/, ''),
        phoneDisplay: value.phone,
        whatsapp: value.whatsapp || null,
        email: value.email || null,
      });
      const id = newBookingId();
      repo.createBookingRow({
        id,
        customerId: customer.id,
        serviceSlug: service.slug,
        serviceName: service.name,
        price: service.price,
        durationMin: service.durationMin,
        date: value.date,
        startTime: chosen.start,
        endTime: chosen.end,
        serviceLocation: value.serviceLocation || null,
        area: value.area || null,
        notes: value.notes || null,
      });
      return { booking: repo.getBooking(id) as repo.BookingWithCustomer | null };
    })();

    if (result.conflict) {
      return {
        ok: false,
        code: 'SLOT_TAKEN',
        message: 'Sorry, that time was just booked. Please pick another slot.',
        step: 'time',
      };
    }
    if (!result.booking) {
      return { ok: false, code: 'DB_ERROR', message: 'We could not save your booking request. Please try again.' };
    }
    return { ok: true, booking: result.booking };
  } catch (err) {
    console.error('[bookings] createBooking failed:', err);
    return {
      ok: false,
      code: 'DB_ERROR',
      message: 'We could not save your booking request. Please try again or call us.',
    };
  }
}

export type TransitionResult =
  | { ok: true; booking: repo.BookingWithCustomer }
  | { ok: false; code: 'NOT_FOUND' | 'INVALID_TRANSITION' | 'DB_ERROR'; message: string };

/**
 * Admin status transitions. Allowed:
 *   pending   → confirmed | cancelled | completed
 *   confirmed → completed | cancelled
 *   completed / cancelled are terminal.
 */
export function transitionBooking(
  id: string,
  to: repo.BookingStatus,
): TransitionResult {
  const booking = repo.getBooking(id);
  if (!booking) {
    return { ok: false, code: 'NOT_FOUND', message: 'Booking not found.' };
  }
  const allowed: Record<repo.BookingStatus, repo.BookingStatus[]> = {
    pending: ['confirmed', 'cancelled', 'completed'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  if (!allowed[booking.status].includes(to)) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      message: `A ${booking.status} booking cannot be changed to ${to}.`,
    };
  }
  try {
    repo.updateBookingStatus(id, to);
    const updated = repo.getBooking(id);
    return { ok: true, booking: updated! };
  } catch (err) {
    console.error('[bookings] transitionBooking failed:', err);
    return { ok: false, code: 'DB_ERROR', message: 'Could not update the booking. Please try again.' };
  }
}
