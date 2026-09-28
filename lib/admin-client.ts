'use client';

/**
 * Fetch helper for admin client components.
 * - sends JSON by default
 * - treats 401 as "session ended" and routes back to the login screen
 * - surfaces the API's friendly message on errors
 */
export class AdminApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw new AdminApiError('UNAUTHENTICATED', 'Your session has ended. Please sign in again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new AdminApiError(
      err?.code ?? 'ERROR',
      err?.message ?? 'Something went wrong. Please try again.',
    );
  }
  return data as T;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
