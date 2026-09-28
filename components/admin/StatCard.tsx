import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StatCard({
  label,
  value,
  hint,
  href,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-4xl',
          accent ? 'text-wine' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card block p-5 transition-colors hover:border-line-strong">
        {inner}
      </Link>
    );
  }
  return <div className="card p-5">{inner}</div>;
}
