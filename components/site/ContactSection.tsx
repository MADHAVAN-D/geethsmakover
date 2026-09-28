import Link from 'next/link';
import {
  Clock,
  Instagram,
  MessageCircle,
  Phone,
} from 'lucide-react';
import type { BusinessSettings } from '@/lib/content/types';
import { waLink } from '@/lib/whatsapp';
import { getAvailabilityDays } from '@/lib/db/repositories';
import { DAY_NAMES } from '@/lib/utils';

export default function ContactSection({ settings }: { settings: BusinessSettings }) {
  const days = getAvailabilityDays();

  return (
    <section id="contact" className="border-t border-line bg-cream/50">
      <div className="page-container grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow">Home service & contact</p>
          <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
            We come to you
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft md:text-[15px]">
            Geeths Makeover is a home-service business — we arrive at your home
            or venue. Every appointment is confirmed personally, and WhatsApp
            is the fastest way to reach us.
          </p>

          <ul className="mt-8 space-y-5 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-wine" aria-hidden="true" />
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-ink-soft hover:text-wine">
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 shrink-0 text-wine" aria-hidden="true" />
              <a
                href={waLink(settings.whatsapp, 'Hi Geeths Makeover! I would like to book a home service.')}
                target="_blank"
                rel="noreferrer"
                className="text-ink-soft hover:text-wine"
              >
                WhatsApp: {settings.phone}
              </a>
            </li>
            {settings.instagramUrl && (
              <li className="flex items-center gap-3">
                <Instagram className="h-5 w-5 shrink-0 text-wine" aria-hidden="true" />
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-soft hover:text-wine"
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="btn btn-primary flex-1"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call now
            </a>
            <a
              href={waLink(settings.whatsapp, 'Hi Geeths Makeover! I would like to book a home service.')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline flex-1"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">
            Home service availability may depend on your location.
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="card p-6 md:p-8">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              <Clock className="h-4 w-4 text-wine" aria-hidden="true" />
              Working hours
            </p>
            <ul className="mt-5 divide-y divide-line text-sm">
              {days.map((d) => (
                <li key={d.dayOfWeek} className="flex items-center justify-between py-2.5">
                  <span className={d.enabled ? 'text-ink-soft' : 'text-muted/60'}>
                    {DAY_NAMES[d.dayOfWeek]}
                  </span>
                  <span className={d.enabled ? 'text-ink font-medium' : 'text-muted/60'}>
                    {d.enabled ? 'Open · by appointment' : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/book" className="btn btn-primary btn-block">
                Book a home service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
