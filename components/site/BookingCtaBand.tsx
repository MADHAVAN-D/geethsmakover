import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/whatsapp';
import { env } from '@/lib/env';

export default function BookingCtaBand() {
  return (
    <section className="bg-wine">
      <div className="page-container flex flex-col items-start gap-8 py-16 md:py-20 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ivory/60">
            Ready when you are
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ivory md:text-4xl">
            Your big day deserves the right hands.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ivory/75 md:text-base">
            Pick a service, choose a date and time, and send your request.
            We confirm every appointment personally over call or WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="btn btn-lg"
            style={{ backgroundColor: '#faf7f2', color: '#211b16' }}
          >
            Book an appointment
          </Link>
          <a
            href={waLink(env.business.whatsapp, 'Hi Geeths Makeover! I would like to book an appointment.')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-lg border-ivory/40 text-ivory hover:bg-ivory/10"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
