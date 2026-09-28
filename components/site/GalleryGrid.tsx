'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type Props = { items: GalleryItem[] };

export default function GalleryGrid({ items }: Props) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const g of items) if (g.category) set.add(g.category);
    return ['All', ...Array.from(set).sort()];
  }, [items]);

  const [filter, setFilter] = useState('All');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'All' ? items : items.filter((g) => g.category === filter)),
    [items, filter],
  );

  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setLightbox((cur) =>
        cur === null ? cur : (cur + dir + visible.length) % visible.length,
      );
    },
    [visible.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, close, step]);

  const current = lightbox !== null ? visible[lightbox] : null;

  return (
    <div>
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter gallery by category"
      >
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={filter === c}
            onClick={() => {
              setFilter(c);
              setLightbox(null);
            }}
            className={cn(
              'h-10 rounded-full border px-4 text-[13px] font-medium transition-colors',
              filter === c
                ? 'border-wine bg-wine text-ivory'
                : 'border-line-strong bg-white text-ink-soft hover:border-ink',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3 md:columns-3 md:gap-4">
        {visible.map((g, i) => (
          <figure
            key={g.id}
            className="group relative mb-3 cursor-zoom-in overflow-hidden rounded bg-cream md:mb-4 [break-inside:avoid]"
            onClick={() => setLightbox(i)}
          >
            <Image
              src={g.image}
              alt={g.alt ?? g.title ?? 'Geeths Makeover work'}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {g.title && (
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="font-display text-sm text-ivory">{g.title}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">No photos in this category yet.</p>
      )}

      {current && lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? 'Photo viewer'}
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10"
            aria-label="Close photo viewer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10 sm:flex md:left-6"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors hover:bg-ivory/10 sm:flex md:right-6"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <figure className="animate-rise-in flex max-h-full max-w-4xl flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="relative max-h-[78vh] w-auto overflow-hidden rounded">
              <Image
                src={current.image}
                alt={current.alt ?? current.title ?? 'Geeths Makeover work'}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-ivory/80">
              <span className="font-display text-base text-ivory">
                {current.title ?? 'Geeths Makeover'}
              </span>
              <span className="tabular-nums">
                {lightbox + 1} / {visible.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
