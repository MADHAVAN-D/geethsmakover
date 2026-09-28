import Link from 'next/link';
import Image from 'next/image';
import type { BusinessSettings } from '@/lib/content/types';

export default function Hero({ settings }: { settings: BusinessSettings }) {
  return (
    <section className="relative overflow-hidden">
      <div className="page-container grid gap-10 py-12 md:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="eyebrow">
            {settings.tagline ?? 'Professional beauty services, at your doorstep'}
          </p>
          <h1 className="mt-5 font-display text-[44px] leading-[1.04] text-ink md:text-6xl lg:text-[64px]">
            Geeths <em className="text-wine">Makeover</em>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft md:text-lg">
            Airbrush HD bridal makeup, trials, engagement and occasion looks —
            done at your home or venue. Book your makeover and let Geeths
            Makeover come to you, in under a minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/book" className="btn btn-primary btn-lg">
              Book a home service
            </Link>
            <Link href="/services" className="btn btn-ghost btn-lg">
              Explore services <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {settings.serviceType ?? 'Home Service'} · We come to you
          </p>
        </div>

        <div className="relative lg:col-span-7">
          <div
            aria-hidden="true"
            className="absolute -right-3 -bottom-3 top-3 left-3 hidden rounded border border-line-strong md:block lg:-right-5 lg:-bottom-5 lg:top-5 lg:left-5"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded bg-cream md:aspect-[5/5] lg:aspect-[4/4.4] lg:h-full">
            <Image
              src="/images/hero.jpg"
              alt="Bride with airbrush HD makeup and soft light, by Geeths Makeover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
