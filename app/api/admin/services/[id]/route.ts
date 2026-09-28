import { NextResponse } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap, type RouteContext } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { getContentMode } from '@/lib/env';

/** Admin: update a service (local mode only). */
export const PUT = wrap(async (req, ctx) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (getContentMode() !== 'local') {
    return jsonError(400, 'SANITY_MANAGED', 'In this mode services are managed in Sanity Studio, not here.');
  }
  const { id } = await ctx.params;
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId)) return jsonError(400, 'INVALID_INPUT', 'Invalid service.');

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError(400, 'INVALID_INPUT', 'Invalid payload.');

  const patch: Parameters<typeof repo.updateLocalService>[1] = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 80) {
      return jsonError(400, 'INVALID_INPUT', 'Service name must be 2–80 characters.');
    }
    patch.name = body.name.trim();
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
      return jsonError(400, 'INVALID_INPUT', 'Enter a valid price.');
    }
    patch.price = Math.round(price);
  }
  if (body.durationMin !== undefined) {
    const durationMin = Number(body.durationMin);
    if (![15, 30, 45, 60, 90, 120, 180, 240, 300].includes(durationMin)) {
      return jsonError(400, 'INVALID_INPUT', 'Enter a valid duration (minutes).');
    }
    patch.durationMin = durationMin;
  }
  if (body.category !== undefined) {
    patch.category = typeof body.category === 'string' ? body.category.trim().slice(0, 40) : null;
  }
  if (body.description !== undefined) {
    patch.description = typeof body.description === 'string' ? body.description.trim().slice(0, 600) : null;
  }
  if (body.featured !== undefined) patch.featured = Boolean(body.featured);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.displayOrder !== undefined) {
    const n = Number(body.displayOrder);
    if (Number.isInteger(n) && n >= 0 && n < 1000) patch.displayOrder = n;
  }

  const updated = repo.updateLocalService(serviceId, patch);
  if (!updated) return jsonError(404, 'NOT_FOUND', 'Service not found.');
  return NextResponse.json({ ok: true, service: updated });
});
