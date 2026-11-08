# Meow – Dashboard Performance & Optimization Report

**Project:** Meow (cat marketplace, Next.js 15 App Router + React 19 + Prisma/Neon)
**Live URL:** _not deployed from this session – add your Vercel URL here_
**Scope:** Seller dashboard (`/dashboard`), Admin users table (`/admin/users`), Shop/verification page (`/dashboard/shop`)

> **How measured.** Production build (`next build && next start`) on a low-RAM Windows laptop (≈8 GB, ~1 GB free), Lighthouse 13.6 mobile preset (default simulated 4× CPU throttle, slow-4G), logged in as the seeded admin, **1,500 synthetic records** per list. Raw reports: `perf/*.json`. Interaction numbers come from `perf/bench.js` (puppeteer, 4× CPU throttle, Event Timing API). Numbers are single runs, so expect ±10 % noise.
> **Not done:** I could not capture React DevTools Profiler *screenshots* in a headless session. I used the Event Timing API and DOM node counts instead (see §5). Please add DevTools screenshots by hand if the assignment requires them (steps in §8).

---

## 1. Initial audit – bottlenecks found

| # | Bottleneck | Evidence |
|---|-----------|----------|
| 1 | **Seller listings rendered as one unbounded `<ul>`** (every listing, every row with 3 forms + image). | 1,500 rows → **12,168 DOM nodes**, 1.5 MB HTML, LCP 9.1 s, TBT 3.2 s |
| 2 | **Admin users table: unvirtualized `<table>`**, every row with its own form/input. | 1,500 rows → **15,577 DOM nodes**, TBT **6.0 s**, main thread 20.8 s |
| 3 | **No search/filter/sort at all** on the dashboard; admin search was a full server round-trip per submit (and capped at 100 rows). | Code review |
| 4 | **Eagerly bundled heavy forms.** `VerificationForm` (+ Cloudinary uploader) shipped in the `/dashboard/shop` initial JS. | `/dashboard/shop` 121 kB first load |
| 5 | Any search added naively would re-render the whole list on every keystroke. | Naive client list: **worst keystroke 232 ms, avg 88 ms** (4× CPU) |
| – | Large lists: `/dashboard` listings, `/admin/users`, `/dashboard/orders` (≤100), `/admin/listings` (≤50). Heaviest: first two. | |

Baseline build output: `perf-build-before.txt`.

## 2. Optimizations implemented

### Rendering (`src/components/dashboard/*`, `src/lib/hooks.ts`)
- **State colocation** – `SearchBox` owns the raw input text; the parent list state only changes after the debounce. Typing re-renders one input, not 1,500 rows.
- **`React.memo`** on `ListingRow`, `UserRow`, `SearchBox`.
- **`useCallback`/`useMemo`** – `handleSearch`, `getKey`, `renderRow` have stable identity so memoized children never get new function props; lowercase search index is `useMemo`'d once per dataset; filter+sort is `useMemo`'d on `[indexed, query, status, sort]`.
- Server pre-formats rows (price, "3d ago", Cloudinary URL) so no objects are re-derived on the client.

### Virtualization (TanStack Virtual, `virtual-list.tsx`)
- **Two lists:** seller listings and admin users, both tested with 1,500 rows, overscan 6 / 8, dynamic row measurement (`measureElement`) so wrapped mobile rows stay aligned, `role=list` + `aria-label` for accessibility.

### State decoupling & events
- **Debounced search ×2** (250 ms): dashboard listings search and admin users search (`useDebouncedCallback`, timer + latest-callback kept in `useRef`, so identity is stable and no re-render when the timer changes).
- **`requestAnimationFrame` throttling** – "Back to top" visibility (`useScrolledPast`): scroll events coalesce to one check per frame, and React state changes only when the boolean flips.
- **External store + selective subscriptions** – `createSelectionStore` + `useSyncExternalStore`. Each row subscribes to *its own id*; ticking one checkbox re-renders one row (+ the counter), not the list. Powers new multi-select + Export CSV.

### Code splitting
- `React.lazy` + `Suspense`: **`AnalyticsPanel`** (loaded only when "Analytics" is clicked; verified: exactly 1 extra JS chunk is fetched on demand) and **`VerificationForm`** (+ uploader) on `/dashboard/shop`. Both have fixed-height skeleton fallbacks (no CLS).
- No charting library added: the chart is dependency-free SVG, which avoids a ~100 kB dependency entirely.

### Server/Client boundaries
- `dashboard/page.tsx`, stats cards, alerts, header, `admin/users/page.tsx` stay **Server Components**; only the interactive islands (`ListingsManager`, `UsersTable`) are client.
- The island receives **plain pre-formatted strings** – `formatBDT`, `timeAgo`, `cldTransform` (server-only), and Prisma never enter the client bundle. The users page now selects only 8 columns and passes a slim DTO.
- Row markup that was server-rendered HTML for *all* rows is now rendered only for visible rows, which is the major client/HTML reduction.
- Trade-off: the islands *add* client JS (see §4) – that is the cost of search/filter/virtualization.

### UX
- `dashboard/loading.tsx` and `admin/users/loading.tsx` skeletons match final dimensions. Light theme unchanged (the app has no dark mode).

## 3. Lighthouse – before vs after (mobile, 1,500 rows)

| Page | Perf score | FCP | LCP | TBT | CLS | Speed Index | Page weight |
|---|---|---|---|---|---|---|---|
| Seller dashboard – before | **27** | 7.2 s | 9.1 s | 3,220 ms | 0 | 8.9 s | 1,581 KiB |
| Seller dashboard – after | **92** | 1.2 s | 1.2 s | 250 ms | 0 | 4.8 s | 391 KiB |
| Admin users – before | **49** | 1.8 s | 3.8 s | 6,030 ms | 0 | 9.0 s | 497 KiB |
| Admin users – after | **88** | 1.4 s | 1.4 s | 350 ms | 0 | 5.0 s | 339 KiB |

Caveats: baseline pages were un-virtualized copies of the original markup fed the same synthetic rows (sources in `perf/baseline-src/`). The synthetic rows have no cover images, so LCP excludes image loading; the real dashboard with Cloudinary images will have a slightly higher LCP.

## 4. Bundle analysis (`next build`, First Load JS)

| Route | Before | After | Δ |
|---|---|---|---|
| `/dashboard` | 113 kB | 138 kB | **+25 kB** |
| `/admin/users` | 106 kB | 130 kB | **+24 kB** |
| `/dashboard/shop` | 121 kB | **108 kB** | **−13 kB** |
| `/dashboard/orders` | 108 kB | 108 kB | 0 |
| Shared by all | 103 kB | 103 kB | 0 |

**Honest reading:** the two virtualized routes got *bigger* in JS (TanStack Virtual + client islands, ~25 kB) but became ~10× faster at runtime and 4× lighter in HTML, which is a deliberate trade. Analytics chart code (~2 kB) is **not** in the 138 kB; it loads on click. Only `/dashboard/shop` shrank at load time. Unused-dependency review: no deps were removed (`clsx`, `tailwind-merge`, `lucide-react` are used; lucide imports are already per-icon, tree-shaken). Logs: `perf-build-before.txt`, `perf-build-after.txt`.

## 5. Rendering / interaction evidence (4× CPU throttle, typing "persian"/"tanvir", 150 ms between keys)

| Scenario | DOM nodes | Worst key→event | Avg |
|---|---|---|---|
| Naive client list (no memo/debounce/virtualization), 1,500 rows | 12,168 | **232 ms** | 88 ms |
| Optimized listings manager | **613** | **64 ms** | 33 ms |
| Admin users – original markup | 15,577 | – | – |
| Admin users – optimized | **423** | 48 ms | 27 ms |

**INP proxy:** worst observed 64 ms (≤ 200 ms target). It is a proxy, not field INP.

## 6. Core Web Vitals (lab, mobile emulation)

| Metric | Target | Dashboard | Admin users |
|---|---|---|---|
| LCP | ≤ 2.5 s | **1.2 s** ✅ | **1.4 s** ✅ |
| INP (proxy) | ≤ 200 ms | **64 ms** ✅ | **48 ms** ✅ |
| CLS | ≤ 0.1 | **0** ✅ | **0** ✅ |

Functional checks (`perf/bench.js`): search filters (1,500 → 134), status filter (→ 14), checkbox selection + CSV bar, lazy analytics loads one chunk on click, mobile 375 px has no horizontal overflow, **0 console errors** on dashboard, mobile, admin users, and shop. Screenshots: `perf/dashboard-desktop.png`, `perf/dashboard-mobile.png`, `perf/admin-users-desktop.png`. `tsc` and `eslint` pass; production build succeeds.

## 7. Remaining limitations

- **TBT is still 250–350 ms** (hydrating 1,500 row objects + the serialized RSC payload). Next step: paginate/infinite-load from the server (cursor API) instead of shipping all rows; the dashboard query also uses a correlated sub-select per row for the cover image, which should become a lateral join / pre-aggregated query.
- Admin users ships up to 2,000 rows in one payload; fine at that size, not at 100k.
- Added JS (+25 kB) on the two interactive routes.
- Demo-row actions (edit/sell/delete) point to fake IDs; use real data to test mutations.
- Lighthouse run once per page; no median-of-N. No React DevTools screenshots (§8). Not run on a deployed URL.
- `/dashboard/orders`, `/admin/listings`, `/admin/reports` are still plain server lists (bounded at 100/50 rows); candidates for the same treatment if they grow.

## 8. Reproducing

```bash
# add PERF_DEMO=1 to .env.local (opt-in; never enabled by default)
LOW_MEM_BUILD=1 npm run build && npm start         # LOW_MEM_BUILD only for low-RAM machines
# open /dashboard?demo=1500   and   /admin/users?demo=1500   (synthetic rows, no DB writes)
npx lighthouse http://localhost:3000/dashboard?demo=1500 --preset=perf
```
React DevTools: Profiler → record → type in "Search your listings" → compare commit flame graph: only `SearchBox` commits per keystroke, `ListingsManager`/rows commit once after the debounce, and ticking a checkbox commits a single `ListingRow`.

## 9. Files

New: `src/lib/hooks.ts`, `src/lib/dashboard-types.ts`, `src/lib/perf-data.ts`, `src/components/dashboard/{search-box,listing-row,listings-manager,virtual-list,analytics-panel}.tsx`, `src/components/admin/users-table.tsx`, `src/app/dashboard/shop/lazy-verification-form.tsx`, two `loading.tsx`.
Changed: `src/app/dashboard/page.tsx`, `src/app/dashboard/shop/page.tsx`, `src/app/admin/users/page.tsx`, `next.config.ts` (opt-in `LOW_MEM_BUILD`), `package.json` (+`@tanstack/react-virtual`).
