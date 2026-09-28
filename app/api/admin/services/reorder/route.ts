import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { getContentMode } from '@/lib/env';

/** Admin: reorder services (local mode only). POST { order: number[] } */
export const POST = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (getContentMode() !== 'local') {
    return jsonError(400, 'SANITY_MANAGED', 'In this mode services are managed in Sanity Studio, not here.');
  }
  const body = await readJson<{ order?: unknown }>(req);
  const order = body?.order;
  if (!Array.isArray(order) || order.length === 0 || !order.every((n) => Number.isInteger(n))) {
    return jsonError(400, 'INVALID_INPUT', 'Invalid order.');
  }
  const ids = order as number[];
  const existing = new Set(repo.listLocalServices().map((s) => s.id));
  if (ids.length !== existing.size || !ids.every((id) => existing.has(id))) {
    return jsonError(400, 'INVALID_INPUT', 'Order must include every service exactly once.');
  }
  repo.reorderLocalServices(ids);
  return NextResponse.json({ ok: true });
});
