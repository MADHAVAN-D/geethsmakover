import { env, getContentMode } from '@/lib/env';
import * as repo from '@/lib/db/repositories';
import { toISODate } from '@/lib/utils';
import {
  LOCAL_GALLERY,
  LOCAL_OFFERS,
  LOCAL_SERVICES,
  LOCAL_SETTINGS,
  LOCAL_TESTIMONIALS,
} from './local';
import * as sanity from './sanity';
import { cached } from './cache';
import type {
  BusinessSettings,
  GalleryItem,
  Offer,
  Service,
  Testimonial,
} from './types';

const TTL_MS = 60_000; // content is re-checked at most once a minute

/**
 * Content layer: the website's single door to content.
 *  - Sanity mode: services/gallery/testimonials/offers come from Sanity.
 *  - Local mode:  the same shapes come from local demo data / the local
 *    services table (editable from the admin dashboard).
 * Contact numbers always come from environment variables.
 */

function localServiceRows(): Service[] {
  let rows = repo.listLocalServices();
  if (rows.length === 0) {
    repo.seedLocalServicesIfEmpty(
      LOCAL_SERVICES.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category ?? null,
        description: s.description,
        price: s.price,
        durationMin: s.durationMin,
        image: s.image ?? null,
        featured: s.featured,
        active: s.active,
        displayOrder: s.displayOrder,
      })),
    );
    rows = repo.listLocalServices();
  }
  return rows.map((r) => ({
    id: `local-${r.slug}`,
    slug: r.slug,
    name: r.name,
    description: r.description ?? '',
    price: r.price,
    durationMin: r.durationMin,
    category: r.category ?? undefined,
    image: r.image ?? undefined,
    featured: r.featured,
    active: r.active,
    displayOrder: r.displayOrder,
  }));
}

export async function getServices(): Promise<Service[]> {
  if (getContentMode() === 'sanity') {
    return cached('services', TTL_MS, sanity.sanityServices);
  }
  const rows = localServiceRows();
  void cached; // local rows are read directly (DB is already local)
  return rows;
}

export async function getActiveServices(): Promise<Service[]> {
  const all = await getServices();
  return all.filter((s) => s.active);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const all = await getServices();
  return all.find((s) => s.slug === slug) ?? null;
}

export async function getActiveServiceBySlug(slug: string): Promise<Service | null> {
  const svc = await getServiceBySlug(slug);
  return svc && svc.active ? svc : null;
}

export async function getGallery(): Promise<GalleryItem[]> {
  if (getContentMode() === 'sanity') {
    return cached('gallery', TTL_MS, sanity.sanityGallery);
  }
  return LOCAL_GALLERY;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (getContentMode() === 'sanity') {
    return cached('testimonials', TTL_MS, sanity.sanityTestimonials);
  }
  return LOCAL_TESTIMONIALS;
}

export async function getActiveOffer(): Promise<Offer | null> {
  const offers =
    getContentMode() === 'sanity'
      ? await cached('offers', TTL_MS, sanity.sanityOffers)
      : LOCAL_OFFERS;
  const today = new Date().toISOString().slice(0, 10);
  return (
    offers.find((o) => {
      if (!o.active) return false;
      if (o.validFrom && o.validFrom > today) return false;
      if (o.validUntil && o.validUntil < today) return false;
      return true;
    }) ?? null
  );
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  let settings: BusinessSettings;
  if (getContentMode() === 'sanity') {
    const fromSanity = await cached('settings', TTL_MS, async () => {
      const s = await sanity.sanitySettings();
      return s;
    });
    settings = fromSanity ?? LOCAL_SETTINGS;
  } else {
    settings = LOCAL_SETTINGS;
  }
  // Env vars are the source of truth for contact details.
  return {
    ...settings,
    phone: env.business.phone || settings.phone,
    whatsapp: env.business.whatsapp || settings.whatsapp,
  };
}

/** Day-level availability summary for the booking calendar (local config only). */
export function getAvailabilityCalendar(): {
  today: string;
  windowDays: number;
  days: repo.DayAvailability[];
  blockedDates: string[];
} {
  const windowDays = parseInt(repo.getSetting('booking_window_days', '60'), 10) || 60;
  return {
    today: toISODate(new Date()),
    windowDays,
    days: repo.getAvailabilityDays(),
    blockedDates: repo.listBlockedDates().map((b) => b.date),
  };
}
