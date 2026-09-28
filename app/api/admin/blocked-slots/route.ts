import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { isValidHHMM, minutesOf, parseISODate } from '@/lib/utils';

/** Admin: block a time range. POST /api/admin/blocked-slots { date, start, end, reason? } */
export const POST = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = await readJson<{ date?: unknown; start?: unknown; end?: unknown; reason?: unknown }>(req);
  const date = body?.date;
  const start = body?.start;
  const end = body?.end;
  if (typeof date !== 'string' || !parseISODate(date)) {
    return jsonError(400, 'INVALID_INPUT', 'Pick a valid date.');
  }
  if (typeof start !== 'string' || !isValidHHMM(start)) {
    return jsonError(400, 'INVALID_INPUT', 'Pick a valid start time.');
  }
  if (typeof end !== 'string' || !isValidHHMM(end)) {
    return jsonError(400, 'INVALID_INPUT', 'Pick a valid end time.');
  }
  if (minutesOf(start) >= minutesOf(end)) {
    return jsonError(400, 'INVALID_INPUT', 'End time must be after start time.');
  }
  const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : null;
  const created = repo.addBlockedSlot(date, start, end, reason);
  return NextResponse.json({ ok: true, blocked: created }, { status: 201 });
});
