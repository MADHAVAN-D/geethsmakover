import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import { transitionBooking } from '@/lib/booking/service';
import type { BookingStatus } from '@/lib/db/repositories';

const STATUSES: BookingStatus[] = ['confirmed', 'cancelled', 'completed'];

/**
 * Admin: confirm / cancel / complete a booking.
 * POST /api/admin/bookings/:id/status  { "status": "confirmed" | ... }
 */
export const POST = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await readJson<{ status?: unknown }>(req);
  const status = body?.status as BookingStatus;
  if (!STATUSES.includes(status)) {
    return jsonError(400, 'INVALID_INPUT', 'Invalid status.');
  }
  const result = transitionBooking(String(id), status);
  if (!result.ok) {
    return jsonError(
      result.code === 'NOT_FOUND' ? 404 : 409,
      result.code,
      result.message,
    );
  }
  return NextResponse.json({ ok: true, booking: result.booking });
});
