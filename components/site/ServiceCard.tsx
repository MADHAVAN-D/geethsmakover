import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { Service } from '@/lib/content/types';
import { formatDuration, formatINR } from '@/lib/utils';

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(33,27,22,0.35)]">
      <Link
        href={`/services/${service.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream"
        aria-label={service.name}
      >
        {service.image ? (
          <Image
            src={service.image}
            alt={service.alt ?? service.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center font-display text-5xl text-line-strong"
          >
            {service.name.charAt(0)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {service.category && <p className="eyebrow">{service.category}</p>}
        <h3 className="mt-2 font-display text-xl leading-snug text-ink">
          <Link
            href={`/services/${service.slug}`}
            className="transition-colors hover:text-wine"
          >
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {service.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <Clock className="h-4 w-4 text-wine" aria-hidden="true" />
            {formatDuration(service.durationMin)}
          </span>
          <span className="font-semibold text-ink">
            {service.startingPrice
              ? `From ${formatINR(service.startingPrice)}`
              : formatINR(service.price)}
          </span>
        </div>

        <div className="mt-5">
          <Link href={`/book?service=${service.slug}`} className="btn btn-primary btn-sm btn-block">
            Book this service
          </Link>
        </div>
      </div>
    </article>
  );
}
