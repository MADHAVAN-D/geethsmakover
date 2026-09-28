import { cn } from '@/lib/utils';

const STYLES: Record<string, string> = {
  pending: 'bg-warn-soft text-warn',
  confirmed: 'bg-success-soft text-success',
  completed: 'bg-sand text-ink-soft',
  cancelled: 'bg-danger-soft text-danger',
};

const LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        STYLES[status] ?? 'bg-sand text-ink-soft',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {LABELS[status] ?? status}
    </span>
  );
}
