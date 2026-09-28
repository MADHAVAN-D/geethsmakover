import { defineConfig } from 'sanity';
import { schemas } from './schema';

/**
 * Geeths Makeover — Sanity Studio
 *
 * Content lives here: services, gallery, testimonials, offers,
 * business settings and categories.
 *
 * Bookings, availability and blocked times do NOT live in Sanity —
 * they are managed in the custom admin dashboard (/admin).
 */
export default defineConfig({
  name: 'geeths-makeover',
  title: 'Geeths Makeover — Content',
  projectId: process.env.SANITY_PROJECT_ID || 'YOUR_PROJECT_ID',
  dataset: process.env.SANITY_DATASET || 'production',
  schema: {
    types: schemas,
  },
  icon: '/favicon-geeths.svg',
  document: {
    productionUrl: (input) =>
      `https://${process.env.NEXT_PUBLIC_SITE_URL ?? 'localhost:3000'}/services/${input.slug || ''}`,
  },
});
