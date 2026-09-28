import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import {
  getActiveServices,
  getActiveServiceBySlug,
  getBusinessSettings,
} from '@/lib/content';
import ServiceCard from '@/components/site/ServiceCard';
import { serviceJsonLd } from '@/lib/seo';
import { formatDuration, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const svc = await getActiveServiceBySlug(slug);
  if (!svc) return { title: 'Service not found' };
  return {
    title: svc.name,
    description: svc.description.slice(0, 155),
    alternates: { canonical: `/services/${svc.slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const svc = await getActiveServiceBySlug(slug);
  if (!svc) notFound();

  const all = await getActiveServices();
  const related = all.filter((s) => s.slug !== svc.slug).slice(0, 3);
  const settings = await getBusinessSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd(svc, settings)) }}
      />
      <div className="page-container py-10 md:py-16">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-wine"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All services
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded bg-cream lg:aspect-[4/4.2]">
              {svc.image ? (
                <Image
                  src={svc.image}
                  alt={svc.alt ?? svc.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center font-display text-7xl text-line-strong"
                >
                  {svc.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-5">
            {svc.category && <p className="eyebrow">{svc.category}</p>}
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
              {svc.name}
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft md:text-base">
              {svc.description}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
              <div className="bg-white p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Duration
                </dt>
                <dd className="mt-2 flex items-center gap-2 font-display text-xl text-ink">
                  <Clock className="h-4 w-4 text-wine" aria-hidden="true" />
                  {formatDuration(svc.durationMin)}
                </dd>
              </div>
              <div className="bg-white p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Price
                </dt>
                <dd className="mt-2 font-display text-xl text-ink">
                  {svc.startingPrice
                    ? `From ${formatINR(svc.startingPrice)}`
                    : formatINR(svc.price)}
                </dd>
              </div>
            </dl>

            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              {[
                'Confirmed personally by call or WhatsApp before your appointment',
                'Skin-safe products and sterilised, single-use applicators',
                'Arrive 10 minutes early — we plan for the day, not just the chair',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-wine" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/book?service=${svc.slug}`} className="btn btn-primary btn-lg flex-1">
                Book {svc.name}
              </Link>
              <Link href="/contact" className="btn btn-outline btn-lg">
                Ask a question
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              Booking is a request — we confirm every appointment personally.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20 md:mt-28">
            <h2 className="mb-6 border-b border-line pb-3 font-display text-2xl text-ink">
              Other services
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {related.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
