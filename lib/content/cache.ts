/** Tiny in-process TTL cache for content reads (safe: content is not per-user). */

type Entry = { at: number; value: unknown };
const store = new Map<string, Entry>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  store.set(key, { at: now, value });
  return value;
}

export function clearContentCache(): void {
  store.clear();
}
