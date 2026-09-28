import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { parseISODate } from '@/lib/utils';

/** Admin: block a full date. POST /api/admin/blocked-dates { date, reason? } */
export const POST = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = await readJson<{ date?: unknown; reason?: unknown }>(req);
  const date = body?.date;
  if (typeof date !== 'string' || !parseISODate(date)) {
    return jsonError(400, 'INVALID_INPUT', 'Pick a valid date.');
  }
  const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : null;
  try {
    const created = repo.addBlockedDate(date, reason);
    return NextResponse.json({ ok: true, blocked: created }, { status: 201 });
  } catch {
    return jsonError(409, 'ALREADY_BLOCKED', 'This date is already blocked.');
  }
});
