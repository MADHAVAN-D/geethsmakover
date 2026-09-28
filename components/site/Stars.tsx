import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Stars({ rating, className }: { rating: number; className?: string }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`Rated ${r} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn('h-4 w-4', i < r ? 'fill-gold text-gold' : 'fill-line text-line')}
        />
      ))}
    </div>
  );
}
