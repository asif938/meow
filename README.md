# Meow 🐱

Bangladesh-first marketplace for cats. Buy a cat, adopt one, or buy and sell cat supplies: new products from verified shops, used items from cat owners. Prices are in BDT and the UI is available in English and Bangla.

**Stack:** Next.js 15 (App Router, TypeScript) · React 19 · Tailwind CSS v4 · Neon PostgreSQL · Prisma ORM 7 · Auth.js v5 · zod · Cloudinary · Resend · a generic SMS gateway

---

## Contents

1. [Features](#features)
2. [Quick start](#quick-start)
3. [Environment variables](#environment-variables)
4. [Database and Prisma](#database-and-prisma)
5. [Scripts](#scripts)
6. [Project structure](#project-structure)
7. [How it works](#how-it-works)
8. [Roles and permissions](#roles-and-permissions)
9. [Trust and safety rules](#trust-and-safety-rules)
10. [HTTP API](#http-api)
11. [Deploying to production](#deploying-to-production)
12. [Performance](#performance)
13. [Troubleshooting](#troubleshooting)
14. [Not built yet](#not-built-yet)

---

## Features

- **Auth:** email/password and Google login, phone OTP verification, and the roles buyer, seller, business, shelter and admin.
- **Listings:** three types (cat for sale, adoption, supply) created in a 5-step sell wizard. Supports drafts, editing, marking sold or adopted, relisting and deleting. Photos upload straight from the browser to Cloudinary with signed uploads.
- **Search:** Postgres full-text search plus `pg_trgm` fuzzy matching. Filters for type, category tree, breed, gender, vaccinated, condition, price, division/district and verified sellers. Sorting and pagination live in the URL. On mobile, filters open in a bottom sheet.
- **Listing page:** gallery, key-info table, health and vaccine card, safety checklist, seller card with rating, wishlist, report button, JSON-LD and dynamic metadata. The Chat, Adopt and Order buttons stick to the bottom on mobile.
- **Chat:** conversations are tied to a listing and refresh by polling every 5 seconds. Phone numbers and links in a message trigger an off-platform warning. The header shows an unread badge.
- **Adoption:** request form (home type, other pets, experience). The owner approves or rejects, and the owner's phone number is revealed only after approval. Completing an adoption marks the listing as adopted and cancels the other pending requests.
- **Cash-on-delivery orders:** available for supplies from verified shops only. Stock is reserved inside a database transaction, so two buyers can't oversell the last item. Status flow: pending → confirmed → shipped → delivered, or cancelled (which restocks the item).
- **Reviews:** allowed only after a delivered order or a completed adoption, once each.
- **Seller verification:** NID, trade licence or organisation proof goes to an admin queue. Approval shows a verified badge.
- **Admin panel:** overview with KPI progress, listing moderation queue (approve, reject, feature), seller verification, reports (with takedown or ban), user ban/unban and a category tree editor. Every admin action is written to `audit_logs`.
- **Seller dashboard:** searchable, virtualized list of your listings, status filters, multi-select with CSV export, a lazy-loaded analytics panel, and incoming orders and adoption requests.
- **i18n:** English and Bangla, switchable from the header (cookie-based).
- **SEO:** sitemap, robots, canonical URLs, Open Graph tags and `Product` JSON-LD on listing pages.
- **Static pages:** about, safety and prohibited items, terms and privacy. The terms and privacy pages are templates, so have a lawyer review them.

---

## Quick start

You need Node.js 22 or newer (developed on 24) and a PostgreSQL database. The project is set up for [Neon](https://neon.tech).

```bash
npm install                      # also runs `prisma generate` (postinstall)
cp .env.example .env.local       # then fill in the values (see below)
npm run db:deploy                # applies prisma/migrations: pg_trgm + all tables
npm run db:seed                  # categories, locations, demo users and listings
npm run dev                      # http://localhost:3000
```

The seed is idempotent: it skips rows that already exist. To wipe the demo data and start over, run `npm run db:seed -- --reset` (development only).

**Demo accounts.** The seed creates five accounts, all with the password `meow12345`:

| Account | Role |
| --- | --- |
| `admin@meow.com.bd` (the first email in `ADMIN_EMAILS`) | Admin |
| `shop@meow.com.bd` | Verified business seller |
| `nusrat@meow.com.bd` | Verified individual seller |
| `rescue@meow.com.bd` | Verified shelter |
| `tanvir@meow.com.bd` | Unverified individual seller |

> **Security:** these passwords are public. Change or delete the accounts before the site is reachable by anyone else. Never seed demo data into a database that real users will use.

---

## Environment variables

Copy `.env.example` to `.env.local`. `.env*` files are git-ignored.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon **pooled** connection string (host contains `-pooler`). The app uses it at runtime. |
| `DIRECT_URL` | recommended | Neon **direct** connection string (same without `-pooler`). Used by `prisma migrate`. Falls back to `DATABASE_URL`, but migrations can hang on a pooled connection. |
| `AUTH_SECRET` | yes | Generate with `npx auth secret` or `openssl rand -base64 32`. Use a different one in production. |
| `AUTH_URL` | dev only | `http://localhost:3000` locally. On Vercel it is detected automatically (`AUTH_TRUST_HOST` is enabled). |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | The Google button hides when these are empty. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | recommended | Signed image uploads. When empty, the sell form asks for image URLs instead. |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Transactional email. When empty, emails are printed to the server console. |
| `SMS_GATEWAY_URL` | no | A generic HTTP gateway URL with `{to}` and `{message}` placeholders. When empty, OTP codes are printed to the server console. |
| `ADMIN_EMAILS` | yes | Comma-separated. These users get the admin role when they sign up or when you run the seed. |
| `NEXT_PUBLIC_APP_URL` | yes | Public site URL. Used for the sitemap, canonical URLs and email links. |

Photo hosts are restricted to `res.cloudinary.com` and `images.unsplash.com`. To allow another host, add it to both `IMAGE_HOSTS` in `src/lib/images.ts` and `images.remotePatterns` in `next.config.ts`.

---

## Database and Prisma

The database layer uses **Prisma 7** with the **Neon driver adapter** (`@prisma/adapter-neon`).

- **Schema:** `prisma/schema.prisma`. Table and column names are snake_case (`@@map` / `@map`), the fields in code are camelCase.
- **Config:** `prisma.config.ts` sets the schema path, the migrations folder, the seed command and the connection URL (`DIRECT_URL`, then `DATABASE_URL`).
- **Client:** generated into `src/generated/prisma` (git-ignored, rebuilt by `postinstall`). The app imports the shared instance from `src/db` (`import { db } from "@/db"`). Type-only exports for client components live in `src/db/types.ts`.
- **Seed:** `scripts/seed.ts`.

### Things Prisma can't express

These are written by hand in `prisma/migrations/0_init/migration.sql`. Keep them if you ever regenerate that file:

- the `pg_trgm` extension (fuzzy search),
- `listings.search`, a generated `tsvector` column (full-text search),
- CHECK constraints: `price >= 0`, `stock >= 0`, `rating between 1 and 5`.

The schema declares the generated column's expression with `@default(dbgenerated(...))` so `prisma migrate diff` sees the database and schema as identical.

### Raw SQL

Two places use parameterized raw SQL (`Prisma.sql`), because the Prisma client can't express them:

- `src/lib/queries.ts` → `searchListings()`: full-text rank, trigram similarity, and a `count(*) over()` window for the total.
- `src/lib/inbox.ts` → `getInbox()`: correlated sub-selects for cover image, last message and unread count.

Raw queries cast values explicitly (`::uuid`, `::listing_status`) because they don't get Prisma's automatic typing.

### Transactions

Placing an order, cancelling an order, completing an adoption and saving a listing's images run in transactions (`db.$transaction`). Unique-constraint races (conversations, adoption requests, reviews) are caught with `isUniqueViolation()` from `src/db`.

### Changing the schema

```bash
# 1. edit prisma/schema.prisma
npm run db:migrate -- --name describe_the_change    # creates and applies a migration in dev
# 2. commit prisma/migrations/*
# 3. in production
npm run db:deploy
```

`prisma migrate dev` needs a shadow database and a direct connection (`DIRECT_URL`). Don't run `migrate reset` against a database that holds data you care about. It drops everything.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate the Prisma client (also runs on `npm install`) |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:deploy` | Apply existing migrations (production, CI) |
| `npm run db:seed` | Seed categories, locations and demo data (`-- --reset` wipes first) |
| `npm run db:studio` | Open Prisma Studio |

On low-RAM machines, `LOW_MEM_BUILD=1 npm run build` stops Next from spawning parallel build workers.

---

## Project structure

```
prisma/
  schema.prisma              data model
  migrations/0_init/         initial migration (hand-patched, see above)
prisma.config.ts             Prisma CLI config
scripts/seed.ts              database seed
src/
  app/                       routes (App Router)
    (auth)/                  login, register, phone verification
    (browse)/                search, cats, adopt, shop, category pages
    listing/[slug]/          listing detail + order and adoption forms
    seller/[username]/       public seller profile
    sell/new/                5-step sell wizard
    dashboard/               seller dashboard, orders, shop verification
    messages/                inbox and chat threads
    account/                 profile, wishlist, my orders and requests
    admin/                   moderation, sellers, reports, users, categories
    api/                     JSON endpoints (see HTTP API)
    sitemap.ts, robots.ts    SEO
  actions/                   server actions (all writes)
  components/                UI; components/ui has the shared primitives
  db/                        Prisma client instance + type-only exports
  generated/prisma/          generated client (git-ignored)
  lib/
    auth.ts                  Auth.js config (credentials + Google)
    session.ts               getCurrentUser / requireUser / requireAdmin
    queries.ts               listing search and read queries
    validation.ts            zod schemas for every form
    moderation.ts            banned keywords, contact-info detection, BD phone parsing
    constants.ts             business rules, breeds, divisions, report reasons
    i18n.ts                  English and Bangla strings
    notify.ts                email (Resend) and SMS senders
    cloudinary.ts, images.ts image URLs and allowed hosts
    perf-data.ts             synthetic rows for the ?demo= performance mode
```

---

## How it works

**Reads** happen in Server Components, which call Prisma directly (`src/lib/queries.ts` for listings and search). **Writes** go through server actions in `src/actions/*`. Each action validates input with zod, checks the current user and the business rules, then writes. The JSON routes under `src/app/api` wrap the same actions for API clients.

**Sessions.** Auth.js uses JWT sessions. `getCurrentUser()` re-reads the user from the database on every request, so bans and role changes apply immediately. A banned user is treated as signed out.

**Search.** `searchListings()` builds one SQL query: filters are `AND`ed together, and a text query matches on full-text search, trigram similarity, or a case-insensitive substring of the title or breed. With a text query the default sort is relevance (`ts_rank + similarity`); otherwise it's newest first, with featured listings on top.

**Moderation pipeline.** When a seller publishes, `autoReview()` decides the status: banned keywords or a photo hash already used by another seller send the listing to `pending`; cat sales always go to manual welfare review; everything else goes live. Admins approve, reject or feature from the moderation queue.

**Notifications.** Email goes through Resend and SMS through a generic HTTP gateway. With no keys configured, both just print to the server console, which is how you read OTP codes in development.

**Money.** All prices are whole taka stored as integers. Never use floats.

---

## Roles and permissions

| Role | Gets it by | Can do |
| --- | --- | --- |
| `buyer` | signing up | browse, wishlist, chat, adopt, order, review |
| `seller` | verified individual seller | list used supplies; list cats (needs ID verification) |
| `business` | approved trade licence | list new products, restricted categories, accept online orders |
| `shelter` | approved organisation proof | adoption listings without the 5-cat cap |
| `admin` | email in `ADMIN_EMAILS` | everything in `/admin` |

Sellers apply from **Dashboard → Verification**. A phone number must be verified first.

---

## Trust and safety rules

All enforced on the server (`src/actions/listings.ts`, `src/lib/constants.ts`):

- New-condition products and the Health / Prescription diet categories can only be listed by approved businesses.
- Selling cats requires an approved ID verification. Posting anything requires a verified phone.
- Cats must be at least 8 weeks old. Breed, age, gender and health info are required.
- Adoption listings have no price. The optional rehoming fee is capped at ৳2000.
- Food and medicine need an expiry date in the future. Used food or litter must be sealed.
- Each seller can have at most 5 active cat listings (shelters and admins are exempt). Each user can post at most 5 listings per hour.
- Supply listings need at least 3 photos, cat listings at least 1, and every listing at most 10.
- Listings with banned keywords, or with photos duplicated from another seller, go to the review queue. Cat sale listings always get a manual welfare review.
- At most 20 chat messages per minute and 10 reports per day per user.

---

## HTTP API

Server actions power the UI. These JSON endpoints exist for API clients. All except the public reads need a signed-in session.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/listings` | GET, POST | search listings (same filters as the site) / create a listing |
| `/api/listings/[id]` | GET, PATCH, DELETE | public detail (active listings only, seller contact hidden) / edit or change status (`{action: "sold" \| "relist" \| "unpublish"}`) / delete |
| `/api/orders` | POST, PATCH | place an order / update its status |
| `/api/adoption-requests` | POST, PATCH | request an adoption / approve, reject or complete |
| `/api/reports` | POST | report a listing or user |
| `/api/conversations` | GET | your inbox |
| `/api/conversations/[id]/messages` | GET, POST | poll (`?after=<ISO time>`) / send a message |
| `/api/uploads/sign` | POST | signed Cloudinary upload parameters |
| `/api/auth/[...nextauth]` | — | Auth.js |

---

## Deploying to production

The app is built for Vercel + Neon, but any Node host works.

1. **Database.** Create a Neon project. Copy the pooled connection string to `DATABASE_URL` and the direct one to `DIRECT_URL`.
2. **Apply migrations.** From your machine, with `DIRECT_URL` set to the production database: `npm run db:deploy`. Run it again after every schema change, before the new code goes live.
3. **Seed reference data.** Categories and locations are needed for the site to work. The seed also adds demo users and listings, so on a real site delete them afterwards, or run the seed once and then remove the demo users in the admin panel or Prisma Studio.
4. **Environment variables** (Vercel → Settings → Environment Variables): `DATABASE_URL`, `AUTH_SECRET` (a new one), `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL` (your real domain), plus Cloudinary, Google, Resend and SMS values if you use them. Don't copy `AUTH_URL` or a localhost `NEXT_PUBLIC_APP_URL` from `.env.local`.
5. **Deploy.** Push to GitHub and import the repo in Vercel, or run `vercel --prod`. The default build command (`next build`) is enough, because `postinstall` generates the Prisma client.
6. **Google login (optional).** Add `https://<your-domain>/api/auth/callback/google` as an authorized redirect URI in the Google console.
7. **Register your admin account** with an email listed in `ADMIN_EMAILS`. It becomes admin on sign-up.

**Before launch checklist**

- [ ] No demo accounts left in the database, or their passwords changed
- [ ] New `AUTH_SECRET` set in production
- [ ] SMS gateway configured. Without it, OTP codes only print to the server log and real users can't verify their phones.
- [ ] Resend configured, or accept that emails are only logged
- [ ] Terms and privacy pages reviewed by a lawyer
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain

---

## Performance

The seller dashboard and admin users page were optimized for large lists (virtualized rows, debounced search, memoized rows, lazy-loaded panels, server-side pre-formatting). On 1,500 synthetic rows the dashboard's mobile Lighthouse score went from 27 to 92 and its LCP from 9.1 s to 1.2 s. The method, numbers and remaining limitations are in [`PERFORMANCE.md`](PERFORMANCE.md), with the raw reports in `perf/`.

To try the large-list mode locally, start the server with `PERF_DEMO=1` and open `/dashboard?demo=1500` or `/admin/users?demo=1500`. This shows synthetic rows, not database data, and is ignored when `PERF_DEMO` isn't set, so it is inert in production.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Pages load but show no listings, or queries fail | `DATABASE_URL` is missing or still the `ep-xxx` placeholder. The app falls back to a dead placeholder so `next build` works without a database. |
| `prisma migrate` hangs or times out | You're using the pooled URL. Set `DIRECT_URL` to the non-pooled Neon string. |
| `Cannot find module '@/generated/prisma/client'` or missing Prisma types | Run `npm run db:generate`. The client isn't committed. |
| `type "listing_status" does not exist` or similar | Migrations haven't been applied to this database. Run `npm run db:deploy`. |
| Search returns nothing for any text | `pg_trgm` or the `search` column is missing, meaning the hand-written parts of `0_init` didn't run. Re-apply the migration on a fresh database. |
| Can't log in with Google | `AUTH_GOOGLE_ID`/`SECRET` are empty (the button is hidden), or the redirect URI isn't registered. |
| No OTP SMS arrives | Without `SMS_GATEWAY_URL`, the code is printed in the server terminal. |
| Photos won't upload | Cloudinary variables are empty, so paste an image URL instead. The URL's host must be in the allowed list. |
| `prisma migrate dev` wants to alter `listings.search` | Don't accept that statement. See [Things Prisma can't express](#things-prisma-cant-express). |
| WebSocket errors from the database on an older Node | Use Node 22+, which has a global `WebSocket` the Neon adapter relies on. |

---

## Not built yet

Multi-seller cart, bKash / Nagad / SSLCommerz payments, price-drop alerts, courier integration, vet and grooming directory, PWA, and real-time chat (Pusher or Ably instead of polling). Sentry, Vitest and Playwright are not set up yet, so there are no automated tests.
