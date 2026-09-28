import Image from 'next/image';
import type { Testimonial } from '@/lib/content/types';
import Stars from './Stars';

export default function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="card flex h-full flex-col p-6 md:p-8">
      <Stars rating={t.rating} />
      <blockquote className="mt-5 flex-1 font-display text-lg leading-relaxed text-ink md:text-xl">
        “{t.review}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        {t.photo ? (
          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image src={t.photo} alt="" fill sizes="40px" className="object-cover" />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine-soft font-display text-lg text-wine"
          >
            {t.customerName.charAt(0)}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{t.customerName}</p>
          <p className="text-xs text-muted">Client</p>
        </div>
      </figcaption>
    </figure>
  );
}
