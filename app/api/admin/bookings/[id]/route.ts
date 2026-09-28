import { NextResponse } from 'next/server';
import { jsonError, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { customerWaLink } from '@/lib/whatsapp';

/** Admin: single booking with customer + a ready-made WhatsApp link. */
export const GET = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const booking = repo.getBooking(String(id));
  if (!booking) return jsonError(404, 'NOT_FOUND', 'Booking not found.');
  return NextResponse.json({
    booking,
    waLink: customerWaLink(
      booking,
      'Please find your booking details below. We look forward to coming to you!',
    ),
  });
});
