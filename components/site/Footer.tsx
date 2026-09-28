import Link from 'next/link';
import { Instagram, MessageCircle, Phone } from 'lucide-react';
import { getBusinessSettings } from '@/lib/content';
import { waLink } from '@/lib/whatsapp';

export default async function Footer() {
  const s = await getBusinessSettings();

  return (
    <footer className="mt-24 border-t border-line bg-cream/60 md:mt-32">
      <div className="page-container grid gap-10 py-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="font-display text-2xl text-ink">
            Geeths <span className="italic text-wine">Makeover</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            {s.tagline ?? 'Professional beauty services, at your doorstep.'}{' '}
            Home service — we come to your home or venue.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {s.instagramUrl && (
              <a
                href={s.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded border border-line-strong bg-white text-ink transition-colors hover:border-ink"
                aria-label="Geeths Makeover on Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            <a
              href={waLink(s.whatsapp, 'Hi Geeths Makeover! I would like to book a home service.')}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded border border-line-strong bg-white text-ink transition-colors hover:border-ink"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={`tel:${s.phone.replace(/\s/g, '')}`}
              className="flex h-11 w-11 items-center justify-center rounded border border-line-strong bg-white text-ink transition-colors hover:border-ink"
              aria-label={`Call ${s.phone}`}
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Explore
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ['/services', 'Services & pricing'],
              ['/gallery', 'Gallery'],
              ['/about', 'About'],
              ['/contact', 'Contact'],
              ['/book', 'Book a home service'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-ink-soft transition-colors hover:text-wine">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Contact
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-ink-soft">{s.businessName}</p>
            <p className="text-ink-soft">Home service available</p>
            <a
              href={`tel:${s.phone.replace(/\s/g, '')}`}
              className="block text-ink-soft hover:text-wine"
            >
              Phone: {s.phone}
            </a>
            <a
              href={waLink(s.whatsapp, 'Hi Geeths Makeover! I would like to enquire.')}
              target="_blank"
              rel="noreferrer"
              className="block text-ink-soft hover:text-wine"
            >
              WhatsApp: {s.phone}
            </a>
            {s.businessHours && <p className="text-ink-soft">{s.businessHours}</p>}
            <p className="text-xs text-muted">
              Home service availability may depend on your location.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="page-container flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Geeths Makeover. All rights reserved.
          </p>
          <p>Home service · Beauty &amp; makeup at your location</p>
        </div>
      </div>
    </footer>
  );
}
