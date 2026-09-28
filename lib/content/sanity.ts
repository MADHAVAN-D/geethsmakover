import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { env } from '@/lib/env';
import type {
  BusinessSettings,
  GalleryItem,
  Offer,
  Service,
  Testimonial,
} from './types';

let _client: SanityClient | null = null;

export function sanityClient(): SanityClient {
  if (!env.sanity.projectId) {
    throw new Error(
      'SANITY_PROJECT_ID is not configured. Set Sanity env vars or use CONTENT_MODE=local.',
    );
  }
  if (!_client) {
    _client = createClient({
      projectId: env.sanity.projectId,
      dataset: env.sanity.dataset,
      apiVersion: env.sanity.apiVersion,
      useCdn: env.sanity.useCdn,
    });
  }
  return _client;
}

let _builder: ReturnType<typeof imageUrlBuilder> | null = null;

function imageBuilder() {
  if (!_builder) {
    _builder = imageUrlBuilder({
      projectId: env.sanity.projectId,
      dataset: env.sanity.dataset,
    });
  }
  return _builder;
}

function imgUrl(asset: unknown, width = 1200): string | undefined {
  if (!asset || typeof asset !== 'object') return undefined;
  return imageBuilder().image(asset).auto('format').fit('max').width(width).url();
}

// ------------------------------------------------------------------ queries

export const Q_SERVICES = /* groq */ `
*[_type == "service"] | order(displayOrder asc, name asc) {
  "id": _id,
  "slug": slug.current,
  name,
  description,
  price,
  startingPrice,
  "durationMin": durationMin,
  "category": category->name,
  "image": image.asset,
  "alt": image.alt,
  featured,
  active,
  displayOrder
}`;

export const Q_GALLERY = /* groq */ `
*[_type == "galleryItem"] | order(displayOrder asc, _createdAt desc) {
  "id": _id,
  "image": image.asset,
  "alt": image.alt,
  title,
  "category": category->name,
  description,
  featured,
  displayOrder
}`;

export const Q_TESTIMONIALS = /* groq */ `
*[_type == "testimonial"] | order(_createdAt desc) {
  "id": _id,
  "customerName": customerName,
  review,
  rating,
  "photo": photo.asset,
  featured,
  active
}`;

export const Q_OFFERS = /* groq */ `
*[_type == "offer"] | order(_createdAt desc) {
  "id": _id,
  title,
  description,
  "image": image.asset,
  validFrom,
  validUntil,
  active
}`;

export const Q_SETTINGS = /* groq */ `
*[_type == "businessSettings"][0] {
  businessName,
  tagline,
  description,
  phone,
  whatsapp,
  email,
  serviceType,
  serviceArea,
  businessHours,
  bookingSettings,
  instagramUrl
}`;

// ------------------------------------------------------------------- mappers

type RawService = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  startingPrice?: number | null;
  durationMin: number;
  category?: string | null;
  image?: unknown;
  alt?: string | null;
  featured?: boolean;
  active?: boolean;
  displayOrder: number;
};

export function mapService(raw: RawService): Service {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    price: raw.price,
    startingPrice: raw.startingPrice ?? undefined,
    durationMin: raw.durationMin,
    category: raw.category ?? undefined,
    image: imgUrl(raw.image, 1000),
    alt: raw.alt ?? undefined,
    featured: Boolean(raw.featured),
    active: raw.active !== false,
    displayOrder: raw.displayOrder,
  };
}

// -------------------------------------------------------------------- fetchers

export async function sanityServices(): Promise<Service[]> {
  const rows = await sanityClient().fetch<RawService[]>(Q_SERVICES);
  return rows.map(mapService).sort((a, b) => a.displayOrder - b.displayOrder);
}

type RawGallery = {
  id: string;
  image?: unknown;
  alt?: string | null;
  title?: string | null;
  category?: string | null;
  description?: string | null;
  featured?: boolean;
  displayOrder: number;
};

export async function sanityGallery(): Promise<GalleryItem[]> {
  const rows = await sanityClient().fetch<RawGallery[]>(Q_GALLERY);
  return rows
    .map((r) => ({
      id: r.id,
      image: imgUrl(r.image, 1400) ?? '',
      alt: r.alt ?? undefined,
      title: r.title ?? undefined,
      category: r.category ?? undefined,
      description: r.description ?? undefined,
      featured: Boolean(r.featured),
      displayOrder: r.displayOrder,
    }))
    .filter((g) => Boolean(g.image))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function sanityTestimonials(): Promise<Testimonial[]> {
  const rows = await sanityClient().fetch<
    Array<{
      id: string;
      customerName: string;
      review?: string | null;
      rating?: number | null;
      photo?: unknown;
      featured?: boolean;
      active?: boolean;
    }>
  >(Q_TESTIMONIALS);
  return rows.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    review: r.review ?? '',
    rating: Math.min(5, Math.max(1, r.rating ?? 5)),
    photo: imgUrl(r.photo, 200),
    featured: Boolean(r.featured),
    active: r.active !== false,
  }));
}

export async function sanityOffers(): Promise<Offer[]> {
  const rows = await sanityClient().fetch<
    Array<{
      id: string;
      title: string;
      description?: string | null;
      image?: unknown;
      validFrom?: string | null;
      validUntil?: string | null;
      active?: boolean;
    }>
  >(Q_OFFERS);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    image: imgUrl(r.image, 1600),
    validFrom: r.validFrom ?? undefined,
    validUntil: r.validUntil ?? undefined,
    active: r.active !== false,
  }));
}

export async function sanitySettings(): Promise<BusinessSettings | null> {
  const row = await sanityClient().fetch<{
    businessName?: string | null;
    tagline?: string | null;
    description?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    serviceType?: string | null;
    serviceArea?: string | null;
    businessHours?: string | null;
    bookingSettings?: string | null;
    instagramUrl?: string | null;
  } | null>(Q_SETTINGS);
  if (!row || !row.businessName) return null;
  return {
    businessName: row.businessName,
    tagline: row.tagline ?? undefined,
    description: row.description ?? '',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? '',
    email: row.email ?? undefined,
    serviceType: row.serviceType ?? undefined,
    serviceArea: row.serviceArea ?? undefined,
    businessHours: row.businessHours ?? undefined,
    bookingNote: row.bookingSettings ?? undefined,
    instagramUrl: row.instagramUrl ?? undefined,
  };
}
