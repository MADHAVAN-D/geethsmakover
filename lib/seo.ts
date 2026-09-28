import type { BusinessSettings } from '@/lib/content/types';
import { env } from '@/lib/env';

/**
 * LocalBusiness structured data for the homepage.
 * Home-service business: no physical address, no map. areaServed is only
 * emitted when the owner has explicitly provided a real service area.
 */
export function businessJsonLd(s: BusinessSettings): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: s.businessName,
    description: s.description,
    url: env.siteUrl,
    telephone: s.phone,
    makesOffer: 'Home service — beauty & makeup at your location',
  };
  if (s.serviceArea) out.areaServed = s.serviceArea;
  if (s.instagramUrl) out.sameAs = [s.instagramUrl];
  return out;
}

/** Service structured data for service detail pages. */
export function serviceJsonLd(
  svc: { name: string; description: string; price: number },
  business: BusinessSettings,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: svc.name,
    description: svc.description,
    provider: {
      '@type': 'LocalBusiness',
      name: business.businessName,
      url: env.siteUrl,
    },
    offers: {
      '@type': 'Offer',
      price: svc.price,
      priceCurrency: 'INR',
    },
  };
}
