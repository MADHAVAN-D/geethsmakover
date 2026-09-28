import { NextResponse } from 'next/server';
import { requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { addDays, todayISO } from '@/lib/utils';

/** Admin dashboard numbers + today's list. */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const today = todayISO();
  const todayBookings = repo
    .listBookings({ from: today, to: today })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const weekFrom = addDays(today, -6);
  const weekTo = addDays(today, 6);
  const monthStart = `${today.slice(0, 8)}01`;
  const monthEnd = addDays(today, 31);

  const pending = repo.listBookings({ status: 'pending' }).slice(0, 8);

  return NextResponse.json({
    today,
    todayBookings,
    pending,
    counts: {
      ...repo.countByStatus(),
      today: todayBookings.length,
      week: repo.listBookings({ from: weekFrom, to: weekTo }).length,
      month: repo.listBookings({ from: monthStart, to: monthEnd }).length,
    },
  });
});
