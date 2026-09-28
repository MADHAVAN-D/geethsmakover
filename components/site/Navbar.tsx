'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function Logo() {
  return (
    <Link href="/" className="flex items-baseline gap-2" aria-label="Geeths Makeover home">
      <span className="font-display text-[22px] leading-none text-ink">Geeths</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
        Makeover
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-ivory/95 backdrop-blur-sm transition-[border-color]',
        scrolled ? 'border-line' : 'border-transparent',
      )}
    >
      <div className="page-container flex h-16 items-center justify-between md:h-20">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => {
            const active =
              l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-[13px] font-medium tracking-wide transition-colors',
                  active ? 'text-ink underline decoration-wine decoration-2 underline-offset-8' : 'text-ink-soft hover:text-ink',
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/book" className="btn btn-primary btn-sm">
            Book Now
          </Link>
        </nav>

        <div className="flex items-center gap-3 lg:hidden">
          <Link href="/book" className="btn btn-primary btn-sm">
            Book Now
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded border border-line-strong bg-white text-ink"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-30 bg-ivory lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <nav aria-label="Mobile" className="page-container flex h-full flex-col gap-1 overflow-y-auto py-6">
            {LINKS.map((l, i) => {
              const active =
                l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'border-b border-line py-4 font-display text-2xl transition-colors',
                    active ? 'text-wine' : 'text-ink hover:text-wine',
                  )}
                  style={{ transitionDelay: `${i * 20}ms` }}
                >
                  {l.label}
                </Link>
              );
            })}
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted">
              Home-service beauty &amp; makeup
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}
