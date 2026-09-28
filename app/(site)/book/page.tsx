import type { Metadata } from 'next';
import { getActiveServices, getBusinessSettings, getAvailabilityCalendar } from '@/lib/content';
import BookingFlow from '@/components/booking/BookingFlow';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description:
    'Book bridal, engagement, reception or party makeup with Geeths Makeover — choose a service, date and time in under a minute.',
  alternates: { canonical: '/book' },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: serviceParam } = await searchParams;
  const [services, settings, calendar] = await Promise.all([
    getActiveServices(),
    getBusinessSettings(),
    Promise.resolve(getAvailabilityCalendar()),
  ]);

  const initialServiceSlug =
    serviceParam && services.some((s) => s.slug === serviceParam) ? serviceParam : null;

  return (
    <div className="page-container py-10 md:py-16">
      <header className="mb-10 max-w-2xl md:mb-12">
        <p className="eyebrow">Book an appointment</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          Five short steps. Zero confusion.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Pick your service, a real available date and time, tell us who you
          are — and we confirm personally. Need a hand?{' '}
          <a
            href={`tel:${settings.phone.replace(/\s/g, '')}`}
            className="font-semibold text-wine underline-offset-4 hover:underline"
          >
            Call {settings.phone}
          </a>
          .
        </p>
      </header>

      <BookingFlow
        services={services}
        calendar={calendar}
        initialServiceSlug={initialServiceSlug}
      />
    </div>
  );
}
