'use client';

import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container flex min-h-[60vh] flex-col items-start justify-center py-24">
      <div className="flex items-center gap-3 text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
        <h1 className="font-display text-3xl text-ink">Something went wrong</h1>
      </div>
      <p className="mt-4 max-w-md text-ink-soft">
        We could not load this page. Please try again — if it keeps happening,
        call or WhatsApp us and we will sort it right out.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
