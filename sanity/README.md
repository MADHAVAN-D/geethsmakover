# Geeths Makeover — Sanity Studio

This folder is the **content management system** for Geeths Makeover:
services, gallery, testimonials, offers, categories and business settings.

> **Sanity ≠ bookings.** Booking requests, availability, blocked dates/slots
> and customers live in the custom admin dashboard at `/admin`, not here.

## 1. Create a Sanity project

1. Go to [sanity.io](https://sanity.io) → **Create a project**.
2. Copy the **Project ID**.

## 2. Configure

Create `.env.local` (in this `sanity/` folder — it is git-ignored):

```
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
```

The root website uses the same two variables in the **root** `.env.local`
plus `CONTENT_MODE=auto` (default) — the site switches to Sanity content as
soon as `SANITY_PROJECT_ID` is set.

## 3. Run the Studio

```bash
cd sanity
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:3333`).

## 4. Add content (in this order)

1. **Business settings** — create exactly ONE document. Fill in business name,
   phone, WhatsApp, service type (“Home Service”), Instagram, and the optional
   fields (service area, business hours, booking note) **only with real,
   confirmed business info** — leave them empty until they exist. There is
   deliberately **no address field**: this is a home-service business.
2. **Categories** — e.g. `Bridal`, `Occasion`, `Hair`, `Skin`.
3. **Services** — one per service. Set price, duration in **minutes**
   (used by the booking calendar), category, image, `active`.
   Featured services appear on the homepage.
4. **Gallery items** — add photos; set category + alt text; feature 3–4.
5. **Testimonials** — add only REAL client feedback.
6. **Offers** — optional banner; set `validFrom`/`validUntil` + `active`.

The website picks up changes within about a minute (CDN cache).

## 5. Deploy the Studio

```bash
npm run deploy   # follows Sanity's guided deployment
```

Or host the Studio on Vercel: create a Vercel project from this folder,
set the same two env vars, and it will serve at
`<project>.<team>.sanity.studio` (the deploy flow prints the URL).

Set `SANITY_STUDIO_URL` in the root `.env.local` to that URL — the admin
dashboard then shows an "Open Sanity Studio" button.
