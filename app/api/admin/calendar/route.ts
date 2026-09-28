import { NextResponse } from 'next/server';
import { jsonError, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { todayISO } from '@/lib/utils';

/**
 * Admin: bookings for a month.
 * GET /api/admin/calendar?month=YYYY-MM
 */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const month = req.nextUrl.searchParams.get('month') ?? todayISO().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return jsonError(400, 'INVALID_INPUT', 'Invalid month.');
  }
  const from = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const to = `${month}-${String(daysInMonth).padStart(2, '0')}`;
  const bookings = repo.listBookings({ from, to, limit: 400 });
  return NextResponse.json({ month, from, to, bookings });
});
