import { NextResponse, type NextRequest } from 'next/server';
import { jsonError, readJson, requireAdmin, wrap } from '@/lib/api';
import * as repo from '@/lib/db/repositories';
import { getServices } from '@/lib/content';
import { getContentMode } from '@/lib/env';

const SLOT_MIN_CHOICES = [15, 30, 45, 60, 90, 120, 180, 240, 300];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Admin: list services. In Sanity mode this is a read-only mirror (content
 * is edited in Sanity Studio — we never duplicate the source of truth).
 */
export const GET = wrap(async (req) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const services = await getServices();
  return NextResponse.json({
    mode: getContentMode(),
    studioUrl: process.env.SANITY_STUDIO_URL ?? '',
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      description: s.description,
      price: s.price,
      durationMin: s.durationMin,
      image: s.image,
      featured: s.featured,
      active: s.active,
      displayOrder: s.displayOrder,
    })),
  });
});

/** Admin: create a service (local mode only). */
export const POST = wrap(async (req: NextRequest) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (getContentMode() !== 'local') {
    return jsonError(
      400,
      'SANITY_MANAGED',
      'In this mode services are managed in Sanity Studio, not here.',
    );
  }
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError(400, 'INVALID_INPUT', 'Invalid payload.');

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    return jsonError(400, 'INVALID_INPUT', 'Service name must be 2–80 characters.');
  }
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
    return jsonError(400, 'INVALID_INPUT', 'Enter a valid price.');
  }
  const durationMin = Number(body.durationMin);
  if (!SLOT_MIN_CHOICES.includes(durationMin)) {
    return jsonError(400, 'INVALID_INPUT', 'Enter a valid duration (minutes).');
  }
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 40) : '';
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 600) : '';
  const image = typeof body.image === 'string' && body.image.startsWith('/') ? body.image.slice(0, 200) : null;

  let slug =
    typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug)
      : slugify(name);
  if (!slug) return jsonError(400, 'INVALID_INPUT', 'Could not create a service slug.');
  if (repo.getLocalServiceBySlug(slug)) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const maxOrder = repo.listLocalServices().reduce((m, s) => Math.max(m, s.displayOrder), -1);
  const created = repo.createLocalService({
    slug,
    name,
    category: category || null,
    description: description || null,
    price: Math.round(price),
    durationMin,
    image,
    featured: Boolean(body.featured),
    active: body.active === undefined ? true : Boolean(body.active),
    displayOrder: maxOrder + 1,
  });
  return NextResponse.json({ ok: true, service: created }, { status: 201 });
});
