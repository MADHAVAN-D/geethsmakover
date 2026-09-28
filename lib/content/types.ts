/** Content types shared by the Sanity mapper and the local fallback. */

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  startingPrice?: number;
  durationMin: number;
  category?: string;
  image?: string;
  alt?: string;
  featured: boolean;
  active: boolean;
  displayOrder: number;
};

export type GalleryItem = {
  id: string;
  image: string;
  alt?: string;
  title?: string;
  category?: string;
  description?: string;
  featured: boolean;
  displayOrder: number;
};

export type Testimonial = {
  id: string;
  customerName: string;
  review: string;
  rating: number;
  photo?: string;
  featured: boolean;
  active: boolean;
};

export type Offer = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
};

/**
 * Business settings. Geeths Makeover is a HOME-SERVICE business:
 * there is intentionally NO physical address / map URL field.
 * Contact numbers always come from environment variables (env wins).
 */
export type BusinessSettings = {
  businessName: string;
  tagline?: string;
  description: string;
  phone: string;
  whatsapp: string;
  email?: string;
  instagramUrl?: string;
  /** e.g. "Home Service" */
  serviceType?: string;
  /** Owner-configured later via Sanity; left empty until provided. */
  serviceArea?: string;
  /** Display hours, editable — empty until the owner sets them. */
  businessHours?: string;
  /** Short note shown during booking (bookingSettings). */
  bookingNote?: string;
};
