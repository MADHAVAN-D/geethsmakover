import { NextResponse } from 'next/server';
import { requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import type { BookingStatus } from '@/lib/db/repositories';

/**
 * Admin: list bookings.
 * GET /api/admin/bookings?status=&q=&from=&to=
 */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get('status') ?? 'all';
  const status: BookingStatus | 'all' =
    statusParam === 'pending' ||
    statusParam === 'confirmed' ||
    statusParam === 'completed' ||
    statusParam === 'cancelled'
      ? statusParam
      : 'all';
  const q = (sp.get('q') ?? '').slice(0, 80);
  const from = sp.get('from') ?? undefined;
  const to = sp.get('to') ?? undefined;

  const bookings = repo.listBookings({ status, q, from, to, limit: 300 });
  return NextResponse.json({
    bookings,
    counts: repo.countByStatus(),
  });
});
