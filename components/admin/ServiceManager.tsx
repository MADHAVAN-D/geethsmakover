'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { cn, formatDuration, formatINR } from '@/lib/utils';

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string;
  price: number;
  durationMin: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
};

type ServicesResponse = {
  mode: 'sanity' | 'local';
  studioUrl: string;
  services: ServiceRow[];
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240, 300];

type FormState = {
  name: string;
  category: string;
  price: string;
  durationMin: number;
  description: string;
  active: boolean;
  featured: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  price: '',
  durationMin: 60,
  description: '',
  active: true,
  featured: false,
};

export default function ServiceManager() {
  const [data, setData] = useState<ServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mode = data?.mode ?? 'local';

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<ServicesResponse>('/api/admin/services');
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category ?? '',
      price: String(s.price),
      durationMin: s.durationMin,
      description: s.description,
      active: s.active,
      featured: s.featured,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const saveForm = async () => {
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      durationMin: form.durationMin,
      description: form.description,
      active: form.active,
      featured: form.featured,
    };
    try {
      if (editing) {
        await adminFetch(`/api/admin/services/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        flash('Service updated.');
      } else {
        await adminFetch('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        flash('Service added.');
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save the service.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: ServiceRow, patch: { active?: boolean; featured?: boolean }) => {
    try {
      await adminFetch(`/api/admin/services/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not update the service.');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!data) return;
    const ids = data.services.map((s) => s.id);
    const other = index + dir;
    if (other < 0 || other >= ids.length) return;
    [ids[index], ids[other]] = [ids[other], ids[index]];
    try {
      // Server expects numeric ids; local rows use numeric string ids.
      const numeric = ids.map((id) => Number(id)).filter(Number.isInteger);
      await adminFetch('/api/admin/services/reorder', {
        method: 'POST',
        body: JSON.stringify({ order: numeric.length === ids.length ? numeric : ids }),
      });
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not reorder services.');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-9 w-52" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg text-ink">Could not load services</p>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <button type="button" className="btn btn-primary mt-5" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Services</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {mode === 'sanity'
              ? 'Services live in Sanity Studio — the source of truth for your content. This page is a read-only mirror.'
              : 'Add, edit, price and order the services customers can book. Deactivated services hide from the website instantly.'}
          </p>
        </div>
        {mode === 'local' ? (
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add service
          </button>
        ) : (
          data.studioUrl && (
            <a href={data.studioUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open Sanity Studio
            </a>
          )
        )}
      </div>

      {notice && (
        <p role="status" className="animate-fade-in mt-5 rounded border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      <ul className="card mt-6 divide-y divide-line">
        {data.services.map((s, i) => (
          <li key={s.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 p-4', !s.active && 'opacity-60')}>
            {mode === 'local' && (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-line-strong bg-white text-ink-soft disabled:opacity-30"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${s.name} up`}
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded border border-line-strong bg-white text-ink-soft disabled:opacity-30"
                  onClick={() => move(i, 1)}
                  disabled={i === data.services.length - 1}
                  aria-label={`Move ${s.name} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {s.name}
                {s.featured && (
                  <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                    Featured
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {s.category ? `${s.category} · ` : ''}
                {formatDuration(s.durationMin)} ·{' '}
                <span className="font-semibold text-ink">{formatINR(s.price)}</span>
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                s.active ? 'bg-success-soft text-success' : 'bg-sand text-muted',
              )}
            >
              {s.active ? 'Active' : 'Hidden'}
            </span>
            {mode === 'local' && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#6e2b3a]"
                    checked={s.active}
                    onChange={(e) => toggle(s, { active: e.target.checked })}
                  />
                  Visible
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#6e2b3a]"
                    checked={s.featured}
                    onChange={(e) => toggle(s, { featured: e.target.checked })}
                  />
                  Featured
                </label>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => openEdit(s)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add / edit dialog */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? 'Edit service' : 'Add service'}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="animate-fade-in absolute inset-0 bg-ink/50"
            onClick={() => !saving && setFormOpen(false)}
            tabIndex={-1}
          />
          <div className="animate-rise-in card max-h-[90dvh] w-full max-w-lg overflow-y-auto p-6 sm:m-4">
            <h2 className="font-display text-xl text-ink">
              {editing ? `Edit: ${editing.name}` : 'Add a new service'}
            </h2>
            {formError && (
              <p role="alert" className="mt-4 rounded border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
                {formError}
              </p>
            )}
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="sv-name" className="label">Name</label>
                <input
                  id="sv-name"
                  className="input"
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sv-cat" className="label">Category</label>
                  <input
                    id="sv-cat"
                    className="input"
                    placeholder="Bridal, Occasion…"
                    value={form.category}
                    maxLength={40}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="sv-price" className="label">Price (₹)</label>
                  <input
                    id="sv-price"
                    className="input"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="sv-dur" className="label">Duration</label>
                  <select
                    id="sv-dur"
                    className="input"
                    value={form.durationMin}
                    onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {formatDuration(d)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-5 pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#6e2b3a]"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#6e2b3a]"
                      checked={form.featured}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    />
                    Featured
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="sv-desc" className="label">Short description</label>
                <textarea
                  id="sv-desc"
                  className="input"
                  maxLength={600}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveForm} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
