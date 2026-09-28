import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">
        This page has moved.
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link href="/services" className="btn btn-outline">
          View services
        </Link>
      </div>
    </div>
  );
}
