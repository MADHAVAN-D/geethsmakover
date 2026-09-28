import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Isolate the DB in a temp dir BEFORE importing app modules. */
const tmp = mkdtempSync(path.join(os.tmpdir(), 'gm-booking-test-'));
process.env.DATA_DIR = tmp;
process.env.CONTENT_MODE = 'local';
delete process.env.SANITY_PROJECT_ID;

// eslint-disable-next-line import/first
const { closeDb } = await import('@/lib/db/client');
// eslint-disable-next-line import/first
const repo = await import('@/lib/db/repositories');
// eslint-disable-next-line import/first
const { createBooking, transitionBooking } = await import('@/lib/booking/service');
// eslint-disable-next-line import/first
const { addDays, todayISO } = await import('@/lib/utils');
// eslint-disable-next-line import/first
const { dayOfWeekOf } = await import('@/lib/booking/engine');
// eslint-disable-next-line import/first
const { getActiveServiceBySlug } = await import('@/lib/content');

/** Next day (from today) that is open under default settings (Tue–Sun). */
function nextOpenDay(fromOffset = 0): string {
  for (let i = Math.max(0, fromOffset); i <= 8; i++) {
    const iso = addDays(todayISO(), i);
    if (dayOfWeekOf(iso) !== 1) return iso; // Monday closed
  }
  throw new Error('no open day found');
}

function customer(over: Partial<{ name: string; phone: string }> = {}) {
  return {
    name: over.name ?? 'Test Bride',
    phone: over.phone ?? '9800000099',
    serviceLocation: '12 Lotus Apartments, Demo Street',
    area: 'Demo Area',
    email: 'test@example.com',
  };
}

let serviceSlug: string;
let serviceDuration: number;

beforeAll(async () => {
  const svc = await getActiveServiceBySlug('party-makeup');
  expect(svc).toBeTruthy();
  serviceSlug = svc!.slug;
  serviceDuration = svc!.durationMin;
});

afterAll(() => closeDb());

describe('createBooking — validation', () => {
  it('accepts a valid request and returns a pending booking with a GM- reference', async () => {
    const date = nextOpenDay();
    const res = await createBooking({
      ...customer(),
      service: serviceSlug,
      date,
      time: '10:00',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.booking.status).toBe('pending');
      expect(res.booking.id).toMatch(/^GM-[A-Z2-9]{5}$/);
      expect(res.booking.date).toBe(date);
      expect(res.booking.startTime).toBe('10:00');
      expect(res.booking.customer.name).toBe('Test Bride');
      // Home-service location is stored with the booking.
      expect(res.booking.serviceLocation).toBe('12 Lotus Apartments, Demo Street');
      expect(res.booking.area).toBe('Demo Area');
    }
  });

  it('rejects a request without a home-service location (step: location)', async () => {
    const res = await createBooking({
      name: 'No Location Bride',
      phone: '9800000098',
      service: serviceSlug,
      date: nextOpenDay(),
      time: '10:00',
      // Deliberately no serviceLocation — must be rejected server-side.
    } as Parameters<typeof createBooking>[0]);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('INVALID_INPUT');
      expect(res.step).toBe('location');
    }
  });

  it('rejects a past date', async () => {
    const res = await createBooking({
      ...customer(),
      service: serviceSlug,
      date: addDays(todayISO(), -1),
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('PAST_DATE');
  });

  it('rejects a closed day (Monday)', async () => {
    // find a Monday
    let monday = addDays(todayISO(), 1);
    for (let i = 1; i <= 7 && dayOfWeekOf(monday) !== 1; i++) monday = addDays(todayISO(), i);
    const res = await createBooking({
      ...customer(),
      service: serviceSlug,
      date: monday,
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('CLOSED_DAY');
  });

  it('rejects a blocked date', async () => {
    const date = nextOpenDay(2);
    repo.addBlockedDate(date, 'test block');
    const res = await createBooking({
      ...customer(),
      service: serviceSlug,
      date,
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BLOCKED_DATE');
    const blocks = repo.listBlockedDates();
    repo.removeBlockedDate(blocks.find((b) => b.date === date)!.id);
  });

  it('routes invalid customer details to the details step', async () => {
    const res = await createBooking({
      name: 'X',
      phone: '123',
      serviceLocation: '12 Lotus Apartments, Demo Street',
      service: serviceSlug,
      date: nextOpenDay(),
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('INVALID_INPUT');
      expect(res.step).toBe('details');
    }
  });

  it('rejects a time inside a blocked slot', async () => {
    const date = nextOpenDay(3);
    repo.addBlockedSlot(date, '14:00', '15:00', 'lunch');
    const res = await createBooking({
      ...customer({ name: 'Blocked Slot Bride' }),
      service: serviceSlug,
      date,
      time: '14:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('SLOT_TAKEN');
    const blocks = repo.listBlockedSlots();
    repo.removeBlockedSlot(blocks.find((b) => b.date === date)!.id);
  });

  it('rejects invalid customer data', async () => {
    const res = await createBooking({
      name: 'X',
      phone: '123',
      serviceLocation: '12 Lotus Apartments, Demo Street',
      service: serviceSlug,
      date: nextOpenDay(),
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('INVALID_INPUT');
  });

  it('rejects an unknown service', async () => {
    const res = await createBooking({
      ...customer(),
      service: 'does-not-exist',
      date: nextOpenDay(),
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('SERVICE_NOT_FOUND');
  });
});

describe('createBooking — overlap prevention', () => {
  const date = nextOpenDay(4);

  it('takes the first booking of the day', async () => {
    const res = await createBooking({
      ...customer({ name: 'First Bride', phone: '9800000001' }),
      service: serviceSlug,
      date,
      time: '10:00',
    });
    expect(res.ok).toBe(true);
  });

  it('rejects the exact same slot again (race-safe)', async () => {
    const res = await createBooking({
      ...customer({ name: 'Second Bride', phone: '9800000002' }),
      service: serviceSlug,
      date,
      time: '10:00',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('SLOT_TAKEN');
  });

  it('rejects a booking that overlaps the existing one', async () => {
    const startOffset = 30; // 10:30 start overlaps a 10:00 start of 90+ min service
    const start = minutesToHHMM(10 * 60 + startOffset);
    const res = await createBooking({
      ...customer({ name: 'Overlap Bride', phone: '9800000003' }),
      service: serviceSlug,
      date,
      time: start,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('SLOT_TAKEN');
  });

  it('allows a back-to-back booking that ends exactly when the next could start', async () => {
    // first booking: 10:00 → 10:00+duration. Next free start = that end time,
    // but slots are grid-aligned; use a day slot far away instead.
    const res = await createBooking({
      ...customer({ name: 'Evening Bride', phone: '9800000004' }),
      service: serviceSlug,
      date,
      time: '16:00',
    });
    expect(res.ok).toBe(true);
  });
});

function minutesToHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

describe('status transitions', () => {
  async function makeBooking(phone: string, date: string, time: string) {
    const res = await createBooking({
      ...customer({ name: `T ${phone}`, phone }),
      service: serviceSlug,
      date,
      time,
    });
    if (!res.ok) throw new Error(`setup failed: ${res.code} ${res.message}`);
    return res.booking.id;
  }

  it('pending → confirmed → completed, then no further transitions', async () => {
    const id = await makeBooking('9800000010', nextOpenDay(5), '10:00');

    let r = transitionBooking(id, 'confirmed');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.booking.status).toBe('confirmed');

    r = transitionBooking(id, 'completed');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.booking.status).toBe('completed');

    r = transitionBooking(id, 'cancelled');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('INVALID_TRANSITION');
  });

  it('pending → cancelled frees the slot for a new booking', async () => {
    const date = nextOpenDay(6);
    const id = await makeBooking('9800000011', date, '11:00');
    let r = transitionBooking(id, 'cancelled');
    expect(r.ok).toBe(true);

    const res = await createBooking({
      ...customer({ name: 'Replacement Bride', phone: '9800000012' }),
      service: serviceSlug,
      date,
      time: '11:00',
    });
    expect(res.ok).toBe(true);
  });

  it('a cancelled booking cannot be re-confirmed', async () => {
    const date = nextOpenDay(7);
    const id = await makeBooking('9800000013', date, '12:00');
    transitionBooking(id, 'cancelled');
    const r = transitionBooking(id, 'confirmed');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('INVALID_TRANSITION');
  });
});

describe('customer upsert', () => {
  it('reuses the customer for the same phone and updates the name', async () => {
    const date = nextOpenDay(8);
    await createBooking({
      name: 'Ms Test',
      phone: '9800000020',
      serviceLocation: '12 Lotus Apartments, Demo Street',
      service: serviceSlug,
      date,
      time: '10:00',
    });
    await createBooking({
      name: 'Ms Renamed Test',
      phone: '9800000020',
      serviceLocation: '12 Lotus Apartments, Demo Street',
      service: serviceSlug,
      date: nextOpenDay(0),
      time: '15:00',
    });
    const byPhone = repo.findCustomerByPhone('9800000020');
    expect(byPhone).toBeTruthy();
    expect(byPhone!.name).toBe('Ms Renamed Test');
    const all = repo.listCustomers('9800000020');
    expect(all).toHaveLength(1);
  });
});
