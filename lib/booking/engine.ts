/**
 * Pure booking engine — no database, no content layer, no side effects.
 * Everything about "is this slot real?" is decided here, server-side.
 * The frontend only ever DISPLAYS what this module (via the API) returns.
 */

import {
  addDays,
  hhmmOf,
  minutesOf,
  parseISODate,
  toISODate,
} from '@/lib/utils';

export type EngineDay = {
  dayOfWeek: number;
  enabled: boolean;
  openingTime: string;
  closingTime: string;
};

export type EngineTimeWindow = { startTime: string; endTime: string };

export type AvailabilityInput = {
  date: string; // YYYY-MM-DD (shop's local wall-clock)
  serviceDurationMin: number;
  slotDurationMin: number;
  /** Minimum lead time for same-day bookings. */
  leadMin: number;
  /** How many days ahead bookings are accepted. */
  windowDays: number;
  /** Row from availability_days for the day of week of `date`. */
  day: EngineDay | null;
  blockedDate: boolean;
  blockedSlots: EngineTimeWindow[];
  /** Occupied (pending/confirmed) bookings on that date. */
  activeBookings: EngineTimeWindow[];
  /** Injectable clock for tests. */
  now?: Date;
  /** Injectable "today" for tests (defaults to `now`). */
  todayOverride?: string;
};

export type Slot = { start: string; end: string };

export type AvailabilityResult =
  | { ok: true; date: string; slots: Slot[] }
  | {
      ok: false;
      code:
        | 'INVALID_DATE'
        | 'PAST_DATE'
        | 'OUT_OF_WINDOW'
        | 'CLOSED_DAY'
        | 'BLOCKED_DATE'
        | 'NO_SLOTS';
      message: string;
    };

export function dayOfWeekOf(dateIso: string): number {
  const d = parseISODate(dateIso);
  return d ? d.getDay() : 0;
}

/** All candidate start times on an open day for a service of given length. */
export function generateSlots(
  openingTime: string,
  closingTime: string,
  slotDurationMin: number,
  serviceDurationMin: number,
): string[] {
  const open = minutesOf(openingTime);
  const close = minutesOf(closingTime);
  if (close <= open || serviceDurationMin <= 0) return [];
  const starts: string[] = [];
  for (let t = open; t + serviceDurationMin <= close; t += slotDurationMin) {
    starts.push(hhmmOf(t));
  }
  return starts;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function availableSlots(input: AvailabilityInput): AvailabilityResult {
  const now = input.now ?? new Date();
  const todayIso = input.todayOverride ?? toISODate(now);

  if (!parseISODate(input.date)) {
    return { ok: false, code: 'INVALID_DATE', message: 'Please pick a valid date.' };
  }
  if (input.date < todayIso) {
    return { ok: false, code: 'PAST_DATE', message: 'That date is in the past.' };
  }
  const maxDate = addDays(todayIso, input.windowDays);
  if (input.date > maxDate) {
    return {
      ok: false,
      code: 'OUT_OF_WINDOW',
      message: `We take bookings up to ${input.windowDays} days ahead. For later dates, please call or WhatsApp us.`,
    };
  }

  const day = input.day;
  if (!day || !day.enabled) {
    return { ok: false, code: 'CLOSED_DAY', message: 'We are closed on this day.' };
  }
  if (input.blockedDate) {
    return { ok: false, code: 'BLOCKED_DATE', message: 'We are closed on this date.' };
  }

  const isToday = input.date === todayIso;
  const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

  const blocked = input.blockedSlots.map((b) => [minutesOf(b.startTime), minutesOf(b.endTime)] as const);
  const booked = input.activeBookings.map((b) => [minutesOf(b.startTime), minutesOf(b.endTime)] as const);

  const slots: Slot[] = [];
  for (const start of generateSlots(day.openingTime, day.closingTime, input.slotDurationMin, input.serviceDurationMin)) {
    const s = minutesOf(start);
    const e = s + input.serviceDurationMin;
    if (isToday && s < nowMin + input.leadMin) continue;
    if (blocked.some(([bs, be]) => overlaps(s, e, bs, be))) continue;
    if (booked.some(([bs, be]) => overlaps(s, e, bs, be))) continue;
    slots.push({ start, end: hhmmOf(e) });
  }

  if (slots.length === 0) {
    return {
      ok: false,
      code: 'NO_SLOTS',
      message: isToday
        ? 'There are no more time slots left today. Please pick another day.'
        : 'No time slots are available on this date. Please pick another day.',
    };
  }
  return { ok: true, date: input.date, slots };
}
