import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBusinessSettings } from '@/lib/content';
import Reveal from '@/components/site/Reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Geeths Makeover is a home-service bridal & occasion makeup business — airbrush HD expertise, skin-safe products and calm, on-time appointments at your location.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="page-container py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="flex flex-col justify-center lg:col-span-6">
          <Reveal>
            <p className="eyebrow">About Geeths Makeover</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
              Makeup that lets the moment feel like you
            </h1>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-soft">
              <p>
                {settings.description}
              </p>
              <p>
                We keep the calendar deliberately small so every appointment
                gets full attention — your skin is assessed before any product
                touches it, the look is planned around your outfit and
                jewellery, and the day itself runs to the minute, not against
                it. We pack our kit and come to you.
              </p>
              <p>
                Bridal packages include a trial, so nothing is left to
                imagination on the wedding morning.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-10 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
              {[
                ['Hygiene-first', 'Sterilised tools, single-use applicators, fresh kits for every client.'],
                ['Skin before makeup', 'Gentle prep and the right base for your skin — not the other way around.'],
                ['Honest timelines', 'Durations are real. We tell you what a look needs before you book it.'],
                ['Personal confirmation', 'Every booking is confirmed by a human, by call or WhatsApp.'],
              ].map(([t, b]) => (
                <div key={t} className="bg-white p-6">
                  <h2 className="font-display text-lg text-ink">{t}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="relative lg:col-span-6">
          <Reveal delay={120} className="h-full">
            <div className="relative h-full min-h-[420px] overflow-hidden rounded bg-cream">
              <Image
                src="/images/about.jpg"
                alt="Geeths Makeover artist at work during a bridal appointment"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* How it works */}
      <section className="mt-16 md:mt-24">
        <Reveal>
          <h2 className="font-display text-3xl text-ink md:text-4xl">How booking works</h2>
        </Reveal>
        <div className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-3">
          {[
            {
              n: '1',
              t: 'Pick your service & time',
              b: 'Choose a service, then a date and a real available slot — the calendar only shows times we can actually take.',
            },
            {
              n: '2',
              t: 'We confirm personally',
              b: 'You get a booking reference, and we confirm your slot by call or WhatsApp. Until then, your request is pending, not booked.',
            },
            {
              n: '3',
              t: 'The day, handled',
              b: 'We arrive at your location on schedule, set up calmly, work quietly, and leave you looking like the best version of yourself.',
            },
          ].map((s) => (
            <Reveal key={s.n} className="bg-white">
              <div className="h-full p-7">
                <p className="font-display text-3xl text-wine">{s.n}</p>
                <h3 className="mt-3 font-display text-xl text-ink">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/book" className="btn btn-primary btn-lg">
            Book a home service
          </Link>
        </div>
      </section>
    </div>
  );
}
