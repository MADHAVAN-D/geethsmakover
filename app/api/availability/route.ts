import { NextResponse } from 'next/server';
import { wrap, jsonError } from '@/lib/api';
import { getActiveServiceBySlug } from '@/lib/content';
import * as repo from '@/lib/db/repositories';
import { availableSlots, dayOfWeekOf } from '@/lib/booking/engine';
import { todayISO } from '@/lib/utils';

/**
 * Public: which slots exist on a date for a service.
 * GET /api/availability?date=YYYY-MM-DD&service=<slug>
 * Always recomputed server-side from working hours, blocked dates/slots and
 * existing bookings — the calendar UI only shows what this returns.
 */
export const GET = wrap(async (req) => {
  const sp = req.nextUrl.searchParams;
  const date = sp.get('date') ?? '';
  const slug = sp.get('service') ?? '';

  const service = await getActiveServiceBySlug(slug);
  if (!service) {
    return jsonError(404, 'SERVICE_NOT_FOUND', 'This service is not available.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError(400, 'INVALID_DATE', 'Please pick a date from the calendar.');
  }

  const todayIso = todayISO();
  const days = repo.getAvailabilityDays();
  const day = days.find((d) => d.dayOfWeek === dayOfWeekOf(date)) ?? null;

  const result = availableSlots({
    date,
    serviceDurationMin: service.durationMin,
    slotDurationMin: repo.getSlotDurationMin(),
    leadMin: parseInt(repo.getSetting('booking_lead_min', '60'), 10) || 60,
    windowDays: parseInt(repo.getSetting('booking_window_days', '60'), 10) || 60,
    day,
    blockedDate: repo.listBlockedDates().some((b) => b.date === date),
    blockedSlots: repo.getBlockedSlotsForDate(date),
    activeBookings: repo.listActiveBookingsForDate(date),
    now: new Date(),
    todayOverride: todayIso,
  });

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      date,
      service: { slug: service.slug, name: service.name, durationMin: service.durationMin },
      slots: result.slots,
    });
  }
  return NextResponse.json({
    ok: false,
    date,
    code: result.code,
    message: result.message,
  });
});
