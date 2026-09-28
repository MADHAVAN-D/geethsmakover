import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, MessageCircle, Instagram } from 'lucide-react';
import { getBusinessSettings } from '@/lib/content';
import ContactSection from '@/components/site/ContactSection';
import Reveal from '@/components/site/Reveal';
import { waLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Geeths Makeover — call, WhatsApp, or book a home-service beauty appointment. Professional makeup at your location.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="py-12 md:py-16">
      <div className="page-container">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
            Say hello — or just book
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            We are a home-service team — you tell us where, and we come to
            you. For appointments, the booking flow is fastest; for anything
            else, WhatsApp gets the quickest reply.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal>
            <Link
              href="/book"
              className="card flex h-full flex-col p-6 transition-colors hover:border-line-strong"
            >
              <span className="font-display text-lg text-ink">Book online</span>
              <span className="mt-2 flex-1 text-sm text-ink-soft">
                Pick a service, date and time — takes about a minute.
              </span>
              <span className="mt-4 text-sm font-semibold text-wine">Book now →</span>
            </Link>
          </Reveal>
          <Reveal delay={50}>
            <a
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="card flex h-full flex-col p-6 transition-colors hover:border-line-strong"
            >
              <span className="flex items-center gap-2 font-display text-lg text-ink">
                <Phone className="h-4 w-4 text-wine" aria-hidden="true" />
                Call now
              </span>
              <span className="mt-2 flex-1 text-sm text-ink-soft">{settings.phone}</span>
              <span className="mt-4 text-sm font-semibold text-wine">Call now →</span>
            </a>
          </Reveal>
          <Reveal delay={100}>
            <a
              href={waLink(settings.whatsapp, 'Hi Geeths Makeover! I would like to book a home service.')}
              target="_blank"
              rel="noreferrer"
              className="card flex h-full flex-col p-6 transition-colors hover:border-line-strong"
            >
              <span className="flex items-center gap-2 font-display text-lg text-ink">
                <MessageCircle className="h-4 w-4 text-wine" aria-hidden="true" />
                WhatsApp
              </span>
              <span className="mt-2 flex-1 text-sm text-ink-soft">
                Fastest for questions and same-day queries.
              </span>
              <span className="mt-4 text-sm font-semibold text-wine">Open chat →</span>
            </a>
          </Reveal>
          {settings.instagramUrl && (
            <Reveal delay={150}>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="card flex h-full flex-col p-6 transition-colors hover:border-line-strong"
              >
                <span className="flex items-center gap-2 font-display text-lg text-ink">
                  <Instagram className="h-4 w-4 text-wine" aria-hidden="true" />
                  Instagram
                </span>
                <span className="mt-2 flex-1 text-sm text-ink-soft">
                  Daily looks, weddings and behind the chair.
                </span>
                <span className="mt-4 text-sm font-semibold text-wine">Follow →</span>
              </a>
            </Reveal>
          )}
        </div>

        <Reveal delay={100}>
          <div className="card mt-4 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="text-sm text-ink-soft">
              <p className="font-semibold text-ink">{settings.businessName}</p>
              <p className="mt-1">Home service available</p>
              <p className="mt-1">
                Phone &amp; WhatsApp: {settings.phone}
              </p>
            </div>
            <Link href="/book" className="btn btn-outline shrink-0">
              Book a home service
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 md:mt-24">
        <ContactSection settings={settings} />
      </div>
    </div>
  );
}
