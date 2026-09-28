import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveServices } from '@/lib/content';
import ServiceCard from '@/components/site/ServiceCard';
import SectionHeading from '@/components/site/SectionHeading';
import Reveal from '@/components/site/Reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services & Pricing',
  description:
    'Bridal airbrush HD makeup, trials, engagement, reception and party makeup — home service at your location. Clear prices and honest durations.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getActiveServices();
  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[];

  const groups: { label: string; list: typeof services }[] =
    categories.length === 0
      ? [{ label: 'All services', list: services }]
      : [
          ...categories.map((c) => ({
            label: c,
            list: services.filter((s) => s.category === c),
          })),
          ...(services.some((s) => !s.category)
            ? [{ label: 'Other', list: services.filter((s) => !s.category) }]
            : []),
        ];

  return (
    <div className="page-container py-12 md:py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Services & pricing"
          title="Everything, clearly priced"
          description="Pick a service and book a time that suits us at your location. Add-ons like hair styling can be noted in your booking request."
        />
      </Reveal>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c}
              href={`#cat-${c.toLowerCase().replace(/\s+/g, '-')}`}
              className="h-10 rounded-full border border-line-strong bg-white px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink"
            >
              {c}
            </a>
          ))}
        </div>
      )}

      {services.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-xl text-ink">Services are being updated</p>
          <p className="mt-2 text-sm text-ink-soft">
            Please check back soon, or WhatsApp us for the current list.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.label} id={`cat-${group.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <h2 className="mb-5 border-b border-line pb-3 font-display text-2xl text-ink">
                {group.label}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {group.list.map((s) => (
                  <ServiceCard key={s.slug} service={s} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="card mt-16 flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl text-ink">Not sure which one you need?</h2>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Send us a WhatsApp with your date, occasion and outfit — we will
            suggest the right service and time, no pressure.
          </p>
        </div>
        <Link href="/contact" className="btn btn-primary shrink-0">
          Ask us
        </Link>
      </div>
    </div>
  );
}
