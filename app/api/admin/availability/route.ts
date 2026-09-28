import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { isValidHHMM, minutesOf } from '@/lib/utils';

type DayPayload = {
  dayOfWeek?: unknown;
  enabled?: unknown;
  openingTime?: unknown;
  closingTime?: unknown;
};

/** Admin: read working hours + block lists. */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({
    days: repo.getAvailabilityDays(),
    slotDurationMin: repo.getSlotDurationMin(),
    leadMin: parseInt(repo.getSetting('booking_lead_min', '60'), 10) || 60,
    windowDays: parseInt(repo.getSetting('booking_window_days', '60'), 10) || 60,
    blockedDates: repo.listBlockedDates(),
    blockedSlots: repo.listBlockedSlots(),
  });
});

/** Admin: update weekly hours + slot duration. */
export const PUT = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = await readJson<{ days?: DayPayload[]; slotDurationMin?: unknown }>(req);
  if (!body || !Array.isArray(body.days)) {
    return jsonError(400, 'INVALID_INPUT', 'Invalid payload.');
  }
  const days = body.days.map((d) => ({
    dayOfWeek: Number(d.dayOfWeek),
    enabled: Boolean(d.enabled),
    openingTime: String(d.openingTime ?? ''),
    closingTime: String(d.closingTime ?? ''),
  }));
  if (days.length !== 7 || new Set(days.map((d) => d.dayOfWeek)).size !== 7) {
    return jsonError(400, 'INVALID_INPUT', 'Expected exactly 7 days.');
  }
  for (const d of days) {
    if (!isValidHHMM(d.openingTime) || !isValidHHMM(d.closingTime)) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid times.');
    }
    if (d.enabled && minutesOf(d.openingTime) >= minutesOf(d.closingTime)) {
      return jsonError(400, 'INVALID_INPUT', 'Opening time must be before closing time.');
    }
  }
  const slotMin = body.slotDurationMin !== undefined ? Number(body.slotDurationMin) : repo.getSlotDurationMin();
  if (![15, 30, 45, 60].includes(slotMin)) {
    return jsonError(400, 'INVALID_INPUT', 'Slot duration must be 15, 30, 45 or 60 minutes.');
  }

  repo.setAvailabilityDays(
    [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
  );
  repo.setSetting('slot_duration_min', String(slotMin));

  return NextResponse.json({ ok: true });
});
