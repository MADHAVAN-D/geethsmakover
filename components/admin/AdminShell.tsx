'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck2, exact: false },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays, exact: false },
  { href: '/admin/availability', label: 'Availability', icon: Clock3, exact: false },
  { href: '/admin/services', label: 'Services', icon: Sparkles, exact: false },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
];

const BOTTOM_NAV = NAV.slice(0, 3); // Dashboard, Bookings, Calendar

export default function AdminShell({
  user,
  children,
}: {
  user: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      /* redirect regardless */
    }
    window.location.href = '/admin/login';
  };

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-dvh bg-ivory">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2 border-b border-line p-5">
          <span className="font-display text-xl text-ink">Geeths</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-wine">
            Admin
          </span>
        </Link>
        <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item)
                  ? 'bg-wine-soft text-wine'
                  : 'text-ink-soft hover:bg-cream hover:text-ink',
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-cream hover:text-ink"
          >
            <ExternalLink className="h-4.5 w-4.5" aria-hidden="true" />
            View website
          </a>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
            {signingOut ? 'Signing out…' : `Sign out (${user})`}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ivory/95 px-4 backdrop-blur-sm lg:hidden">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-display text-lg text-ink">Geeths</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-wine">Admin</span>
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-white text-ink-soft"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 md:px-8 md:py-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Admin quick"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ivory/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item) ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
              isActive(item) ? 'text-wine' : 'text-muted',
            )}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
          aria-label="More admin pages"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="More admin pages">
          <button
            type="button"
            aria-label="Close menu"
            className="animate-fade-in absolute inset-0 bg-ink/50"
            onClick={() => setMoreOpen(false)}
            tabIndex={-1}
          />
          <div className="animate-rise-in absolute inset-x-0 bottom-0 rounded-t-lg border-t border-line bg-ivory p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-white text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-1">
              {NAV.slice(3).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-3 text-sm font-medium',
                    isActive(item) ? 'bg-wine-soft text-wine' : 'text-ink-soft',
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-ink-soft"
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                View website
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
