import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  getActiveOffer,
  getActiveServices,
  getBusinessSettings,
  getGallery,
  getTestimonials,
} from '@/lib/content';
import Hero from '@/components/site/Hero';
import SectionHeading from '@/components/site/SectionHeading';
import ServiceCard from '@/components/site/ServiceCard';
import OfferBanner from '@/components/site/OfferBanner';
import TestimonialCard from '@/components/site/TestimonialCard';
import ContactSection from '@/components/site/ContactSection';
import BookingCtaBand from '@/components/site/BookingCtaBand';
import Reveal from '@/components/site/Reveal';
import { businessJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Geeths Makeover — Bridal & Occasion Makeup, Home Service' },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [settings, services, gallery, testimonials, offer] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getGallery(),
    getTestimonials(),
    getActiveOffer(),
  ]);

  const featured = services.filter((s) => s.featured).slice(0, 4);
  const featuredServices = featured.length > 0 ? featured : services.slice(0, 4);
  const heroWork = gallery.filter((g) => g.featured).slice(0, 4);
  const activeTestimonials = testimonials.filter((t) => t.active).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd(settings)) }}
      />

      <Hero settings={settings} />

      <OfferBanner offer={offer} />

      {/* Featured services */}
      <section className="page-container pt-16 md:pt-24">
        <Reveal>
          <SectionHeading
            eyebrow="Services"
            title="Makeup for every moment"
            description="Clear pricing, honest durations, and looks built for real weddings and real cameras."
            action={{ href: '/services', label: 'All services & pricing' }}
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {featuredServices.map((s, i) => (
            <Reveal key={s.slug} delay={i * 60}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured work */}
      <section className="page-container pt-16 md:pt-24">
        <Reveal>
          <SectionHeading
            eyebrow="Recent work"
            title="The gallery"
            description="Brides, engagements and occasions from recent seasons."
            action={{ href: '/gallery', label: 'View full gallery' }}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {heroWork.map((g, i) => (
            <Reveal key={g.id} delay={i * 60}>
              <Link
                href="/gallery"
                className={
                  'group relative block overflow-hidden rounded bg-cream ' +
                  (i === 0
                    ? 'col-span-2 row-span-2 aspect-[4/5] md:aspect-auto md:h-full'
                    : 'aspect-square')
                }
                aria-label={g.title ? `Open gallery: ${g.title}` : 'Open gallery'}
              >
                <Image
                  src={g.image}
                  alt={g.alt ?? g.title ?? 'Geeths Makeover work'}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why Geeths */}
      <section className="page-container pt-16 md:pt-24">
        <Reveal>
          <SectionHeading
            eyebrow="Why Geeths Makeover"
            title="Calm, precise, and yours"
            description="A home-service team that treats every appointment like the only appointment of the day."
          />
        </Reveal>
        <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Airbrush HD expertise',
              body: 'A flawless, camera-proof base that survives tears, feasts and ten-hour days — without feeling heavy.',
            },
            {
              title: 'Skin-safe & hygienic',
              body: 'Gentle products, sterilised tools and single-use applicators, every single time.',
            },
            {
              title: 'On time, every time',
              body: 'Wedding mornings run on minutes. We plan buffers so your day never feels rushed.',
            },
            {
              title: 'Look built around you',
              body: 'Outfit, jewellery, venue light, photos — the makeup is designed around all of it, starting with a trial.',
            },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 60} className="bg-white">
              <div className="h-full p-6 md:p-7">
                <p className="font-display text-lg text-wine">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 font-display text-lg text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {activeTestimonials.length > 0 && (
        <section className="page-container pt-16 md:pt-24">
          <Reveal>
            <SectionHeading
              eyebrow="Kind words"
              title="What clients say"
            />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {activeTestimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 60}>
                <TestimonialCard t={t} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <div className="pt-16 md:pt-24">
        <ContactSection settings={settings} />
      </div>

      <BookingCtaBand />
    </>
  );
}
