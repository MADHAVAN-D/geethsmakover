import { describe, expect, it } from 'vitest';
import { availableSlots, dayOfWeekOf, generateSlots } from '@/lib/booking/engine';
import type { AvailabilityInput } from '@/lib/booking/engine';

const DAY = { dayOfWeek: 2, enabled: true, openingTime: '10:00', closingTime: '19:00' };
const CLOSED_DAY = { dayOfWeek: 1, enabled: false, openingTime: '10:00', closingTime: '19:00' };

/** Monday 2026-09-28 14:00 — fixed clock so tests are deterministic. */
const NOW = new Date(2026, 8, 28, 14, 0, 0);
const TODAY = '2026-09-28'; // Monday (closed in defaults)

function input(over: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    date: '2026-09-29', // Tuesday, open
    serviceDurationMin: 90,
    slotDurationMin: 30,
    leadMin: 60,
    windowDays: 60,
    day: DAY,
    blockedDate: false,
    blockedSlots: [],
    activeBookings: [],
    now: NOW,
    todayOverride: TODAY,
    ...over,
  };
}

describe('dayOfWeekOf', () => {
  it('maps ISO dates to JS day-of-week (0=Sunday)', () => {
    expect(dayOfWeekOf('2026-09-28')).toBe(1); // Monday
    expect(dayOfWeekOf('2026-09-29')).toBe(2); // Tuesday
    expect(dayOfWeekOf('2026-10-04')).toBe(0); // Sunday
  });
});

describe('generateSlots', () => {
  it('generates 30-min starts that fully fit inside the day for a 90-min service', () => {
    const slots = generateSlots('10:00', '19:00', 30, 90);
    expect(slots[0]).toBe('10:00');
    expect(slots[slots.length - 1]).toBe('17:30'); // 17:30 + 90 = 19:00
    expect(slots).toHaveLength(16);
  });

  it('reserves the full duration of a 4-hour bridal service', () => {
    const slots = generateSlots('10:00', '19:00', 30, 240);
    expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00']);
  });

  it('returns nothing when the service is longer than the day', () => {
    expect(generateSlots('10:00', '19:00', 30, 600)).toEqual([]);
  });
});

describe('availableSlots', () => {
  it('returns valid slots for an open day', () => {
    const res = availableSlots(input());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.slots.length).toBe(16);
      expect(res.slots[0]).toEqual({ start: '10:00', end: '11:30' });
    }
  });

  it('rejects past dates', () => {
    const res = availableSlots(input({ date: '2026-09-27' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('PAST_DATE');
  });

  it('rejects dates beyond the booking window', () => {
    const res = availableSlots(input({ date: '2026-12-31', windowDays: 60 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('OUT_OF_WINDOW');
  });

  it('rejects closed days (Monday)', () => {
    const res = availableSlots(input({ date: '2026-10-05', day: CLOSED_DAY }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('CLOSED_DAY');
  });

  it('rejects blocked dates', () => {
    const res = availableSlots(input({ date: '2026-10-01', blockedDate: true }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BLOCKED_DATE');
  });

  it('excludes slots overlapping a blocked time range', () => {
    const res = availableSlots(
      input({ blockedSlots: [{ startTime: '14:00', endTime: '16:00' }] }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const starts = res.slots.map((s) => s.start);
      // 13:30 ends 15:00 → overlaps block; 16:30 is fine
      expect(starts).not.toContain('13:30');
      expect(starts).not.toContain('14:00');
      expect(starts).not.toContain('15:30'); // ends 17:00, overlaps 16:00? 15:30<16:00 yes overlap
      expect(starts).toContain('16:30');
    }
  });

  it('excludes slots overlapping an existing booking', () => {
    const res = availableSlots(
      input({ activeBookings: [{ startTime: '12:00', endTime: '15:00' }] }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const starts = res.slots.map((s) => s.start);
      expect(starts).not.toContain('11:30'); // ends 13:00 → overlaps
      expect(starts).not.toContain('12:30');
      expect(starts).not.toContain('14:00');
      expect(starts).toContain('10:30');
      expect(starts).toContain('15:00'); // back-to-back is allowed
    }
  });

  it('respects same-day lead time (no bookings starting within the next hour)', () => {
    const res = availableSlots(input({ date: TODAY, day: DAY }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      const starts = res.slots.map((s) => s.start);
      expect(starts).not.toContain('14:00'); // now=14:00, needs 15:00
      expect(starts).not.toContain('14:30');
      expect(starts).toContain('15:00');
    }
  });

  it('returns NO_SLOTS with a friendly message when nothing is free', () => {
    const res = availableSlots(
      input({ blockedSlots: [{ startTime: '10:00', endTime: '19:00' }] }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('NO_SLOTS');
      expect(res.message.length).toBeGreaterThan(0);
    }
  });

  it('rejects invalid dates', () => {
    const res = availableSlots(input({ date: '2026-02-30' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('INVALID_DATE');
  });
});
