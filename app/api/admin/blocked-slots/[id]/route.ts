import { NextResponse } from 'next/server';
import { jsonError, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import * as repo from '@/lib/db/repositories';

/** Admin: unblock a time range. DELETE /api/admin/blocked-slots/:id */
export const DELETE = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const ok = repo.removeBlockedSlot(Number(id));
  if (!ok) return jsonError(404, 'NOT_FOUND', 'Blocked slot not found.');
  return NextResponse.json({ ok: true });
});
