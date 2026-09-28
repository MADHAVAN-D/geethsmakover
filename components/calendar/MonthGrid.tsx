'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, toISODate, DAY_NAMES_SHORT } from '@/lib/utils';

const DOT_STYLES: Record<string, string> = {
  pending: 'bg-warn',
  confirmed: 'bg-success',
  completed: 'bg-line-strong',
  cancelled: 'bg-danger/60',
};

export type MonthGridProps = {
  year: number;
  /** 0-based month */
  month: number;
  monthLabel: string;
  today: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  isDisabled?: (dateIso: string) => boolean;
  selectedDate?: string | null;
  onSelectDate?: (dateIso: string) => void;
  /** Admin: status dots per date, e.g. ['pending','confirmed'] */
  dayDots?: (dateIso: string) => string[];
  /** Admin: show dot legend under the grid */
  showLegend?: boolean;
  className?: string;
};

/**
 * Shared calendar grid. Customer mode: selectable dates with past/closed/
 * blocked days disabled. Admin mode: read-only grid with booking dots.
 */
export default function MonthGrid(props: MonthGridProps) {
  const {
    year,
    month,
    monthLabel,
    today,
    canPrev,
    canNext,
    onPrev,
    onNext,
    isDisabled,
    selectedDate,
    onSelectDate,
    dayDots,
    showLegend,
    className,
  } = props;

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  return (
    <div className={cn('card p-4 md:p-5', className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-white text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h3 className="font-display text-lg text-ink" aria-live="polite">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-white text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center">
        {DAY_NAMES_SHORT.map((d) => (
          <div
            key={d}
            className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted"
            aria-hidden="true"
          >
            <span className="sm:hidden">{d.charAt(0)}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
        {cells.map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month;
          if (!inMonth) {
            return <div key={iso} aria-hidden="true" className="h-10 md:h-12" />;
          }
          const disabled = Boolean(isDisabled?.(iso));
          const selected = selectedDate === iso;
          const isToday = today === iso;
          const dots = dayDots ? dayDots(iso) : [];
          const dotList = dots.slice(0, 4);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled && !dayDots}
              aria-pressed={selected || undefined}
              aria-label={iso}
              onClick={() => {
                if (!disabled) onSelectDate?.(iso);
              }}
              className={cn(
                'relative mx-auto flex h-10 w-full max-w-[52px] flex-col items-center justify-center rounded text-sm transition-colors md:h-12',
                disabled && !dayDots && 'cursor-not-allowed text-line-strong',
                disabled && dayDots && 'text-line-strong',
                !disabled && 'text-ink hover:bg-cream',
                selected && 'bg-wine font-semibold text-ivory hover:bg-wine',
                isToday && !selected && 'font-semibold text-wine ring-1 ring-inset ring-wine/40',
              )}
            >
              <span>{d.getDate()}</span>
              {dotList.length > 0 && (
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5" aria-hidden="true">
                  {dotList.map((s, i) => (
                    <span
                      key={i}
                      className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[s] ?? 'bg-line-strong')}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-line-strong" aria-hidden="true" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-danger/60" aria-hidden="true" /> Cancelled
          </span>
        </div>
      )}
    </div>
  );
}
