import { NextResponse } from 'next/server';
import { jsonError, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import * as repo from '@/lib/db/repositories';

/** Admin: unblock a date. DELETE /api/admin/blocked-dates/:id */
export const DELETE = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const ok = repo.removeBlockedDate(Number(id));
  if (!ok) return jsonError(404, 'NOT_FOUND', 'Blocked date not found.');
  return NextResponse.json({ ok: true });
});
