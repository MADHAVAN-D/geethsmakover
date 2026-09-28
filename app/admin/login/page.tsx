'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
      } else {
        setError(data?.error?.message ?? 'Sign in failed. Please try again.');
        setBusy(false);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-baseline gap-2">
          <span className="font-display text-2xl text-ink">Geeths</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
            Makeover
          </span>
        </Link>

        <h1 className="mt-10 font-display text-3xl text-ink">Admin sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Manage bookings, availability and services.
        </p>

        <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6" noValidate>
          {error && (
            <p role="alert" className="rounded border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="admin-username" className="label">
              Username
            </label>
            <input
              id="admin-username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <input
              id="admin-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </>
            )}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
