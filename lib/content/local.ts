import type {
  BusinessSettings,
  GalleryItem,
  Offer,
  Service,
  Testimonial,
} from './types';

/**
 * LOCAL FALLBACK CONTENT (demo / development).
 * Used only when CONTENT_MODE=local (or auto without a Sanity project).
 * In production, Sanity is the source of truth — replace everything here.
 *
 * Geeths Makeover is a HOME-SERVICE business. There is no physical studio
 * address; services are performed at the customer's location.
 */

export const LOCAL_SERVICES: Service[] = [
  {
    id: 'local-bridal-airbrush',
    slug: 'bridal-airbrush',
    name: 'Bridal Makeup (Airbrush HD)',
    description:
      'Full airbrush HD bridal look with skin prep, lashes, styling and touch-up kit — done at your home or venue. Designed around your outfit, jewellery and photos.',
    price: 18000,
    durationMin: 240,
    category: 'Bridal',
    image: '/images/services/bridal.jpg',
    alt: 'Indian bride with airbrush HD bridal makeup',
    featured: true,
    active: true,
    displayOrder: 0,
  },
  {
    id: 'local-bridal-trial',
    slug: 'bridal-trial',
    name: 'Bridal Trial Session',
    description:
      'A relaxed sit-down session to finalise your bridal look — skin, shades, jewellery and hair — before the big day.',
    price: 3500,
    durationMin: 90,
    category: 'Bridal',
    image: '/images/services/bridal-trial.jpg',
    alt: 'Makeup artist doing a bridal trial session',
    featured: true,
    active: true,
    displayOrder: 1,
  },
  {
    id: 'local-engagement',
    slug: 'engagement',
    name: 'Engagement Makeup',
    description:
      'Glowing, camera-ready engagement look with soft glam eyes, skin prep and hair styling included.',
    price: 5500,
    durationMin: 120,
    category: 'Bridal',
    image: '/images/services/engagement.jpg',
    alt: 'Woman in elegant engagement makeup',
    featured: true,
    active: true,
    displayOrder: 2,
  },
  {
    id: 'local-reception',
    slug: 'reception',
    name: 'Reception Makeup',
    description:
      'A refined second-look for receptions — different drama, same flawless skin base.',
    price: 6000,
    durationMin: 120,
    category: 'Bridal',
    image: '/images/services/reception.jpg',
    alt: 'Woman in elegant reception makeup',
    featured: false,
    active: true,
    displayOrder: 3,
  },
  {
    id: 'local-party',
    slug: 'party-makeup',
    name: 'Party & Occasion Makeup',
    description:
      'Soft glam to bold — party, sangeet, birthday or anniversary. Includes hair styling on request.',
    price: 3000,
    startingPrice: 2500,
    durationMin: 90,
    category: 'Occasion',
    image: '/images/services/party.jpg',
    alt: 'Woman in festive party makeup',
    featured: true,
    active: true,
    displayOrder: 4,
  },
  {
    id: 'local-hair',
    slug: 'hair-updo',
    name: 'Hair Styling & Updo',
    description:
      'Bridal updos, elegant buns and soft waves. Add on to any makeup service.',
    price: 1500,
    durationMin: 60,
    category: 'Hair',
    image: '/images/services/hair.jpg',
    alt: 'Detailed bridal updo hairstyle with flowers',
    featured: false,
    active: true,
    displayOrder: 5,
  },
  {
    id: 'local-skincare',
    slug: 'pre-bridal-skin',
    name: 'Pre-Bridal Skin Prep',
    description:
      'Gentle pre-bridal facial and skin consultation to keep your skin calm, hydrated and ready for makeup.',
    price: 2500,
    durationMin: 90,
    category: 'Skin',
    image: '/images/services/skincare.jpg',
    alt: 'Calm pre-bridal facial treatment',
    featured: false,
    active: true,
    displayOrder: 6,
  },
];

/**
 * Demo gallery reuses the studio photo set. In production, the gallery is
 * curated in Sanity Studio — add real client photos there.
 */
export const LOCAL_GALLERY: GalleryItem[] = [
  {
    id: 'lg-1',
    image: '/images/hero.jpg',
    alt: 'Bride with airbrush HD makeup in soft window light',
    title: 'The bridal base',
    category: 'Bridal',
    featured: true,
    displayOrder: 0,
  },
  {
    id: 'lg-2',
    image: '/images/services/bridal.jpg',
    alt: 'Close-up of bridal makeup with bindi and floral accessory',
    title: 'Details that tell the story',
    category: 'Bridal',
    featured: true,
    displayOrder: 1,
  },
  {
    id: 'lg-3',
    image: '/images/services/engagement.jpg',
    alt: 'Engagement portrait in peacock green ethnic wear',
    title: 'Engagement day',
    category: 'Engagement',
    featured: true,
    displayOrder: 2,
  },
  {
    id: 'lg-4',
    image: '/images/services/party.jpg',
    alt: 'Festive party makeup with warm bokeh lights',
    title: 'Sangeet energy',
    category: 'Occasion',
    featured: false,
    displayOrder: 3,
  },
  {
    id: 'lg-5',
    image: '/images/services/reception.jpg',
    alt: 'Reception look in an ivory and silver gown',
    title: 'Reception look',
    category: 'Bridal',
    featured: true,
    displayOrder: 4,
  },
  {
    id: 'lg-6',
    image: '/images/services/hair.jpg',
    alt: 'Bridal updo with fresh flowers and pearl pins',
    title: 'The updo',
    category: 'Hair',
    featured: false,
    displayOrder: 5,
  },
  {
    id: 'lg-7',
    image: '/images/services/bridal-trial.jpg',
    alt: 'Bridal trial consultation at the vanity',
    title: 'Trial session',
    category: 'Details',
    featured: false,
    displayOrder: 6,
  },
  {
    id: 'lg-8',
    image: '/images/about.jpg',
    alt: 'Makeup artist at work during a bridal appointment',
    title: 'Behind the chair',
    category: 'Details',
    featured: false,
    displayOrder: 7,
  },
  {
    id: 'lg-9',
    image: '/images/services/skincare.jpg',
    alt: 'Pre-bridal facial treatment in a calm spa setting',
    title: 'Skin first',
    category: 'Skin',
    featured: false,
    displayOrder: 8,
  },
  {
    id: 'lg-10',
    image: '/images/og.jpg',
    alt: 'Close-up of an eye with kohl and warm gold tones',
    title: 'The eye look',
    category: 'Editorial',
    featured: false,
    displayOrder: 9,
  },
];

/**
 * SAMPLE testimonials — hidden by default (active: false) until real client
 * feedback is added in Sanity. Never publish invented reviews.
 */
export const LOCAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'lt-1',
    customerName: 'Sample Client 1',
    review:
      'This is a sample review. Replace it with a real client review in Sanity before launch.',
    rating: 5,
    featured: false,
    active: false,
  },
  {
    id: 'lt-2',
    customerName: 'Sample Client 2',
    review:
      'This is a sample review. Replace it with a real client review in Sanity before launch.',
    rating: 5,
    featured: false,
    active: false,
  },
  {
    id: 'lt-3',
    customerName: 'Sample Client 3',
    review:
      'This is a sample review. Replace it with a real client review in Sanity before launch.',
    rating: 5,
    featured: false,
    active: false,
  },
];

/** No offers by default — add real ones in Sanity when available. */
export const LOCAL_OFFERS: Offer[] = [];

export const LOCAL_SETTINGS: BusinessSettings = {
  businessName: 'Geeths Makeover',
  tagline: 'Professional beauty services, at your doorstep',
  description:
    'Geeths Makeover is a home-service beauty and makeup business. Airbrush HD bridal looks, trials, engagement and occasion makeup — performed at your home or venue. We come to you.',
  phone: '9035462874',
  whatsapp: '919035462874',
  serviceType: 'Home Service',
  bookingNote:
    'Home service availability may depend on your location. We confirm every appointment personally by call or WhatsApp.',
};
