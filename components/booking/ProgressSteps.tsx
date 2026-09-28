'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProgressSteps({
  step,
  labels,
  onJump,
}: {
  step: number;
  labels: string[];
  onJump: (step: number) => void;
}) {
  return (
    <div aria-label={`Booking progress: step ${Math.min(step + 1, labels.length)} of ${labels.length}`}>
      {/* Mobile: compact */}
      <div className="md:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Step {Math.min(step + 1, labels.length)} of {labels.length} ·{' '}
          <span className="text-wine">{labels[Math.min(step, labels.length - 1)]}</span>
        </p>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {labels.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full',
                i <= step ? 'bg-wine' : 'bg-line',
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: numbered steps */}
      <ol className="hidden items-center gap-3 md:flex">
        {labels.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-3">
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine text-ivory transition-opacity hover:opacity-80"
                  aria-label={`Go back to step ${i + 1}: ${label}`}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    current ? 'border-wine text-wine' : 'border-line-strong text-muted',
                  )}
                >
                  {i + 1}
                </span>
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  current ? 'text-ink' : 'text-muted',
                )}
                aria-current={current ? 'step' : undefined}
              >
                {label}
              </span>
              {i < labels.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
