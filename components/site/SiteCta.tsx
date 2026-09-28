'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/whatsapp';
import { env } from '@/lib/env';

/**
 * Persistent mobile booking bar — the majority of customers arrive from
 * WhatsApp / Instagram on a phone, so "Book" is always one thumb away.
 */
export default function SiteCta() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/book')) {
    return null;
  }
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex gap-2 px-4 py-3">
        <a
          href={waLink(env.business.whatsapp, 'Hi Geeths Makeover! I have a question.')}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline flex-1"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
        <Link href="/book" className="btn btn-primary flex-[2]">
          Book an appointment
        </Link>
      </div>
    </div>
  );
}
