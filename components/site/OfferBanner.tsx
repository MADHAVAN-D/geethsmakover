import Link from 'next/link';
import type { Offer } from '@/lib/content/types';

export default function OfferBanner({ offer }: { offer: Offer | null }) {
  if (!offer) return null;
  return (
    <section aria-label="Current offer" className="border-y border-line bg-gold-soft/45">
      <div className="page-container flex flex-col gap-6 py-9 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">Currently offering</p>
          <h2 className="mt-2 font-display text-2xl text-ink md:text-[28px]">
            {offer.title}
          </h2>
          {offer.description && (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-[15px]">
              {offer.description}
            </p>
          )}
        </div>
        <Link href="/book" className="btn btn-primary shrink-0">
          Book now
        </Link>
      </div>
    </section>
  );
}
