# Geeths Makeover 3.0

A production-grade, **booking-first** customer website + **secure admin dashboard** +
**Sanity CMS** integration for a premium Indian **home-service** beauty/makeup
business.

Not a landing page: customers book real slots, the business manages real bookings,
and all content is editable.

```
geeths-makeover/
├── app/
│   ├── (site)/            # Customer website (Home, Services, Service detail,
│   │                      # Gallery, About, Contact, Book)
│   ├── admin/
│   │   ├── login/         # Admin sign-in
│   │   └── (shell)/       # Dashboard, Bookings, Booking detail, Calendar,
│   │                      # Availability, Services, Customers (session-gated)
│   └── api/               # Public + admin route handlers
├── components/            # site/, booking/, admin/, calendar/, ui/
├── lib/
│   ├── db/                # better-sqlite3 client + repositories (all SQL lives here)
│   ├── booking/           # pure slot engine + server-side booking service
│   ├── content/           # Sanity client ↔ local fallback, unified content layer
│   ├── auth/              # iron-session signed cookie sessions
│   └── security/          # in-memory rate limiting
├── sanity/                # Standalone Sanity Studio app (schemas, config)
├── scripts/seed.ts        # Optional FICTIONAL demo data
└── tests/                 # vitest: engine + booking rules (31 tests)
```

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # then edit .env.local
npm run seed                 # optional: fictional demo bookings (see below)
npm run build
npm start                    # http://localhost:3000
```

| URL | What |
| --- | --- |
| `/` | Customer site |
| `/book` | Booking flow: Service → Date → Time → Details → Home-Service Location → Review → Confirmation |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard (today, pending, week, month) |

**Admin credentials** come from `.env.local` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).
A demo `.env.local` is provided locally with `admin / geeths2026` — **change it for
any real deployment.**

### Tests

```bash
npm test        # vitest run (booking engine + full server-side booking rules)
npm run typecheck
```

---

## The booking flow (customer)

HOME → SERVICE → DATE → TIME → CUSTOMER DETAILS → **HOME-SERVICE LOCATION** →
REVIEW → CONFIRMATION, with a persistent **“Continue on WhatsApp”** handoff
after the request is sent.

- The calendar only shows days that are actually open (working days, blocked
  dates, booking window).
- The time grid is fetched **from the server** (`/api/availability`) and only
  lists slots that are genuinely free (working hours, blocked slots, existing
  pending/confirmed bookings, same-day lead time).
- **Home-service location** is the address of the *customer's* home/venue where
  the service happens (plus an optional area/locality). It is a **required,
  private** field: stored with the booking, visible only in the admin, never
  shown on public pages, in SEO metadata, in structured data, or in any public
  API. It is never the business address — the business has no public address.
- Every field is validated **again server-side** in `lib/booking/service.ts`:
  past dates, closed days, blocked dates/slots, service existence, overlap —
  then the insert happens inside a SQLite transaction with a **final overlap
  re-check**, so two simultaneous requests can never double-book.
- New bookings are created as **PENDING** — the UI says “requested, not yet
  confirmed”, never falsely “confirmed”. The business confirms in the admin.
- Booking reference format: `GM-XXXXX`.

## The admin dashboard

Server-side session auth (iron-session, httpOnly cookie, 12 h TTL). Unauthenticated
visitors are redirected to `/admin/login`; admin APIs return `401`.

- **Dashboard** — today’s appointments, pending requests with one-tap
  Confirm/Decline, week/month counts.
- **Bookings** — filter tabs with counts, search by name/phone/ID, quick
  Confirm / Complete / Cancel (Cancel asks for confirmation), row → detail.
- **Booking detail** — customer contact (call / WhatsApp / email), appointment,
  **customer's home-service location** (labelled “HOME SERVICE”), notes, status
  actions, WhatsApp message pre-filled with the details.
- **Calendar** — month grid with status dots, per-day list.
- **Availability** — weekly open/closed + hours, slot length, **block a date**,
  **block a time range**. Changes are visible to customers immediately.
- **Services** — local mode: full CRUD (add/edit/price/duration/reorder/
  hide/feature). Sanity mode: read-only mirror + “Open Sanity Studio”.
- **Customers** — searchable list, per-customer full booking history + contact
  actions.

Status model: `pending → confirmed | cancelled | completed`;
`confirmed → completed | cancelled`; `completed`/`cancelled` are terminal.
Only `pending` + `confirmed` bookings occupy a slot.

## Sanity CMS (content)

Content lives in Sanity; **bookings/availability/customers never do.**

- `CONTENT_MODE=auto` (default): the site uses Sanity when `SANITY_PROJECT_ID`
  is set, otherwise it falls back to the local demo content in
  `lib/content/local.ts`. `sanity`/`local` force a specific mode.
- Schemas (`sanity/schema/`): `service`, `galleryItem`, `testimonial`, `offer`,
  `category`, `businessSettings` (singleton).
- Setup: `cd sanity && npm install && npm run dev` after adding
  `SANITY_PROJECT_ID` (see `sanity/README.md`).
- Contact numbers always come from env vars (`BUSINESS_PHONE`,
  `BUSINESS_WHATSAPP`) — env wins over content.
- Admin services page: **local mode** = editable dashboard CRUD;
  **sanity mode** = read-only + Studio link (no duplicated source of truth).

## Environment variables

See [.env.example](.env.example) for the full annotated list. Highlights:

| Var | Purpose |
| --- | --- |
| `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_USE_CDN`, `SANITY_STUDIO_URL` | Sanity |
| `CONTENT_MODE` | `auto` (default) / `sanity` / `local` |
| `DATA_DIR` | Where the SQLite file lives (`./data` default) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin auth (secret ≥ 16 chars; `openssl rand -hex 32`) |
| `BUSINESS_PHONE`, `BUSINESS_WHATSAPP` | Contact + WhatsApp links |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for OG/sitemap |

**Timezone:** all dates are the shop’s local wall-clock. If hosting outside
India, set `TZ=Asia/Kolkata` on the host so server “today” matches the shop’s.

## Database & deployment

### Deploy to Vercel (checklist)

1. **Import this repo** into Vercel. Framework preset: **Next.js** (auto-detected);
   build command `npm run build`; everything else is default.
2. **Set environment variables** (Vercel → Project → Settings → Environment
   Variables, for all environments):

   | Var | Value |
   | --- | --- |
   | `DATA_DIR` | `/data` |
   | `TZ` | `Asia/Kolkata` |
   | `CONTENT_MODE` | `local` (or `auto` + the Sanity vars once configured) |
   | `ADMIN_USERNAME` | your admin username |
   | `ADMIN_PASSWORD` | strong password |
   | `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |
   | `BUSINESS_PHONE` | `+91 90354 62874` |
   | `BUSINESS_WHATSAPP` | `919035462874` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (no trailing slash) |

3. **Attach a Volume** (Settings → Storage → Volumes): create a volume,
   mount path `/data`, region matching the project. Requires **Fluid Compute**
   (default on current Vercel plans). The SQLite database (`DATA_DIR=/data`)
   then persists across deploys.
4. **Deploy.** Do NOT run `npm run seed` on the host — production starts clean.
   (If you ever want demo data, run seed locally first or delete the rows.)
5. Check `/`, `/book`, `/admin` (login with your admin credentials).

> Native module note: `better-sqlite3` ships prebuilt binaries and is excluded
> from webpack bundling (`serverExternalPackages`), so no build toolchain is
> needed. If a platform ever can't run the native module, swap the `lib/db`
> layer for Postgres — the schema is standard SQL.

Bookings live in **SQLite (WAL)** via `better-sqlite3`, all behind
`lib/db/` (single client + repositories; no SQL anywhere else).

- **Vercel (recommended)**: the serverless filesystem is ephemeral — point
  `DATA_DIR` at a **Vercel Volume** (Fluid Compute), e.g. `DATA_DIR=/data` and
  mount the volume at `/data`. Alternatively, swap the repository layer for
  **Postgres** (Neon/Supabase/RDS): the schema in `lib/db/client.ts` is standard
  SQL; only `lib/db/client.ts` + `repositories.ts` change.
- **Any Node host** (Fly.io, Railway, a VPS): `DATA_DIR` on persistent disk
  just works. `npm run build && npm start` (or `next start`).
- Rate limiting is in-memory per process — fine for single-instance; move it
  to Redis for multi-instance.

## Demo data (and how it’s separated from production)

`npm run seed` inserts **fictional** demo customers/bookings — only into the
local database, only when the bookings table is empty (`--force` to add more).
Nothing demo-related is in the repo, and the site’s testimonials marked as
samples are clearly flagged. For production: start with an empty `DATA_DIR`,
don’t run seed, and replace sample testimonials with real ones in Sanity.
To remove demo data: delete the `data/` folder (dev) or the demo rows.

## WhatsApp layer

- Customer: after sending a request, a **“Continue on WhatsApp”** button opens
  `wa.me` with a pre-filled message containing reference, customer name,
  service, date, time, **service location**, and notes.
- Admin: one-tap pre-filled messages to customers (confirm/cancel/follow-up)
  from the booking detail and customer pages.
- Numbers come from env vars; WhatsApp is a *communication* layer — it never
  stores or modifies booking state.

## Security notes

- Admin: server-side signed cookie sessions; password verified with
  constant-time comparison; login rate-limited (5/15 min/IP); booking
  creation rate-limited (5/h/IP); no stack traces leak to clients.
- No secrets in the repo (`.env*` git-ignored); no client-side DB credentials;
  PII limited to name/phone/whatsapp/email/notes + home-service location/area,
  all validated with length caps. Customer locations are **admin-only** and
  never exposed through public pages, SEO, structured data, or public APIs.
- `robots.txt` disallows `/admin` and `/api`; sitemap only lists public routes.
