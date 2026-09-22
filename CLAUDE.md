# CLAUDE.md

Guidance for Claude Code (and future contributors) working in this repository.

## What this project is today

A **multi-tenant invitation platform**: one Laravel API + one React frontend serve unlimited invitations across 10 event types (wedding, birthday, baby naming, house warming, anniversary, reunion, retirement, religious/festival, business opening, visiting card — the registry is `App\Support\EventTypes::ALL`), each reachable at `/i/{slug}`, fully manageable through an admin dashboard — no per-event redeploy, no per-event domain purchase.

- **[`backend/`](backend/)** — Laravel 13 (PHP 8.4) JSON API. Owns all invitation data (people, schedule, story milestones, gallery, RSVPs, guestbook wishes) in MySQL, plus Sanctum bearer-token admin auth and image/audio storage on the `UPLOADS_DISK` (local `public` disk in dev, Cloudflare R2 in production).
- **[`frontend/`](frontend/)** — Vite + React 18 + Tailwind + Framer Motion. Renders any invitation at `/i/:slug` by fetching its config from the API (same shape the old static `wedding.config.js` used), and hosts the `/admin/*` dashboard for managing invitations.

## Local dev setup

Two servers, run independently:

```bash
# Backend (Laravel) — uses the php84 binary, NOT the php on PATH (that's XAMPP's older 8.0).
# PHP_INI_SCAN_DIR loads php-dev/uploads.ini (20M uploads) — php84's default
# upload_max_filesize=2M rejects most phone photos; `artisan serve` ignores
# public/.user.ini, which only covers PHP-FPM hosts like Railway.
cd backend
PHP_INI_SCAN_DIR="$(cygpath -w "$PWD/php-dev")" "/c/Users/Syam/php84/php.exe" artisan serve --port=8001

# Frontend (Vite) — locked to port 5174 in vite.config.js
cd frontend
npm run dev
```

**Why port 8001 / 5174, not the defaults 8000/5173:** another, unrelated project on this machine runs its own Laravel/Vite dev servers on the default ports. This project is pinned to 8001/5174 everywhere (`backend/.env` → `FRONTEND_URLS`; `frontend/vite.config.js` → `server.port` + `strictPort: true`; `frontend/.env.local` → `VITE_API_URL`) specifically to avoid colliding with it. Before killing anything on 8000/5173/8001/5174 to "free the port," run `netstat -ano | grep ":<port>"` then `tasklist //FI "PID eq <pid>"` and confirm it's actually this project's process — do not assume.

**Auth is a bearer token, not a cookie session.** `POST /api/admin/login` returns a Sanctum personal access token; `lib/api.js` keeps it in `localStorage` and sends `Authorization: Bearer …`. There is no `statefulApi()`, no session and no CSRF on `api/*` (header auth can't be forged cross-site), which is what lets the Vercel frontend and Railway backend live on unrelated domains. Tokens expire after `SANCTUM_TOKEN_EXPIRATION` minutes (default 7 days) and are pruned daily by the scheduler; any 401 on an admin call logs the user out (`UNAUTHORIZED_EVENT` → `AdminAuthContext`). `FRONTEND_URLS` (CORS, and the first entry is the canonical site ShareController redirects to) must match the frontend's origin exactly.

Database: MySQL via XAMPP, database name `wedding_invites`, default `root` user with no password (matches XAMPP's default). Migrate + seed:

```bash
cd backend
"/c/Users/Syam/php84/php.exe" artisan migrate:fresh --seed
```

This seeds one admin user (username `admin`) and one demo client (username `syam-swathi`). Passwords come from `ADMIN_PASSWORD` / `DEMO_CLIENT_PASSWORD`; **only when `APP_ENV=local`** do they fall back to the known dev passwords in the seeders — anywhere else a random password is generated and printed once, so a guessable admin login can't ship to production. Seeded two demo invitations: `syam-and-swathi` (wedding, owned by the demo client) and `priyas-30th` (birthday, unowned — admin-only). See "Roles & ownership" below before touching auth/invitation-scoping code.

## Data model (backend/database/migrations)

- **invitations** — `slug` (unique, drives the public URL), `type` (any key of `EventTypes::ALL`, a plain string column), `is_published`, `theme` (JSON color overrides — see Theme presets below), `story_layout` (`constellation`|`timeline`|`horizontal`|`stacked`|`mosaic`, default `constellation`), `animation_intensity` (`subtle`|`balanced`|`playful`, default `balanced`), `meta_title`/`meta_description`.
- **invitation_details** — 1:1, all the "flat" per-invitation fields: event date/display strings, hero image/copy, envelope copy (+ `envelope_animation`, one of 12 opening-cover styles — see `App\Support\EnvelopeAnimations::ALL`), music, contact info, floating decor settings, wedding-only `connector`/`show_bride`/`show_groom`, birthday-only `celebrant_age`/`celebrant_turning_text`, and `extra` (JSON, per-type fields validated by `EventTypes::extraValidationRules`). **`event_date` is stored as UTC** — the editor converts the admin's local `datetime-local` value with `toISOString()` before saving, and converts back for display. Never save a naive local time into it (that's what the `2026_09_22_120100_convert_event_dates_to_utc` data migration had to repair).
- **invitation_people** — one row per role from the type's registry (`bride`/`groom`, `celebrant`, `host`, ...): name (may be `''` — a hidden side or not-yet-known name), parents text, photo.
- **schedule_events**, **milestones**, **gallery_images** — repeatable per-invitation content, each with a `sort_order`. Milestones still carry `x`/`y` columns for the Constellation story layout, but the admin editor no longer exposes them for manual editing — the other 4 layouts ignore them and use array order instead (see Story layouts below).
- **rsvps** — guest name, accept/decline, guest count, meal preference, note, plus a hidden `edit_token`: the public endpoint returns `{id, edit_token}` and the guest's browser stores it, so "Change my response" updates the same row instead of creating a duplicate. The token is `$hidden` and never appears in admin listings/exports.
- **wishes** — guestbook entries. Public listing is paginated newest-first, 30 per page (`?before={id}`).

### Bride/groom visibility toggle

`invitation_details.show_bride`/`show_groom` (booleans, default `true`) let an admin hide one side entirely for wedding invitations (e.g. only a groom's family is hosting). `InvitationConfigResource` nulls out `couple.bride` or `couple.groom` in the public API response when hidden — every frontend component that reads `couple.bride`/`couple.groom` (`Hero.jsx`, `Footer.jsx`, `NavBar.jsx`, and `wedding-template-50`'s `CoverContent.jsx` for the envelope) must null-check both independently and only render the connector when *both* are present. If you add a new component that displays the couple's names, follow this pattern — don't assume both sides exist.

### Theme presets

`invitations.theme` is a JSON blob of the same RGB-triplet keys `ThemeProvider.jsx` has always read (`bg`, `surface`, `fg`, `fgSoft`, `ink`, `muted`, `accent`, `gold`, `rose`). There is **no color picker or raw RGB entry in the admin UI** — the Theme & Motion tab only offers curated presets from `frontend/src/admin/themePresets.js` (`THEME_PRESETS`, 8 named palettes). The API validates `theme` keys and `R G B` values (`UpdateInvitationRequest::THEME_KEYS`), and a new invitation's default preset is sent *with* the create request (`Dashboard.jsx`), not as a second call. Add new presets there, not by exposing color inputs — the whole point is admins don't need to know color theory.

### Animation intensity vs. envelope animation — two separate concerns

Don't conflate these:
- **`animation_intensity`** (this session's addition) is a *global* multiplier — how many floating hearts/petals render and how fast transitions feel overall. Defined in `frontend/src/lib/animationPresets.js` (`ANIMATION_PRESETS`), consumed by `FloatingHearts.jsx` and `Hero.jsx`'s petal count via `getAnimationPreset(config.animationIntensity)`. Lives in the admin's "Theme & Motion" tab.
- **`envelope_animation`** (a parallel change, same session) is *which specific effect* plays when the cover opens — one of 12 named variants (`App\Support\EnvelopeAnimations::ALL`), rendered by a dispatcher registry under `frontend/src/components/envelope/`. Lives in the admin's "Date & Venue" tab, next to `envelope_cta`.

They can both apply at once (e.g. a "Playful" intensity page using the "Confetti Pop" envelope effect) — don't try to merge them into one setting.

### Story layouts (5 selectable, admin-picked)

`config.storyLayout` drives which component `frontend/src/sections/Story.jsx` renders, from `frontend/src/sections/story-layouts/`: `ConstellationLayout` (original starfield; auto-spaces milestones along a zigzag curve if `x`/`y` are missing, so it works even without the old manual coordinates), `TimelineLayout` (alternating left/right, vertical line), `HorizontalScrollLayout` (swipeable card strip), `StackedLayout` (simple top-to-bottom cards), `MosaicLayout` (photo-forward grid, caption on hover). All 5 consume the exact same milestone shape (`date`, `title`, `description`, `image`) — adding a 6th layout means adding one component here plus one entry in `Story.jsx`'s `LAYOUTS` map and `frontend/src/lib/storyLayouts.js` (shared by the editor and dashboard), plus adding the key to the relevant types' `storyLayouts` in `EventTypes::ALL` (the API validates against it).

### Map picker (Schedule tab)

`frontend/src/admin/MapPicker.jsx` replaces a raw "Map URL" text field with a search box + live Google Maps `output=embed` iframe preview (no API key). "Use this" commits `https://maps.google.com/?q={query}` as `map_url` — the same URL shape the seeded demo data already uses, so the public Schedule page's QR code (`qrcode.react`) and "Directions" link needed zero changes.

`App\Http\Resources\InvitationConfigResource` (`backend/app/Http/Resources/`) is the piece that shapes all of the above into one JSON object matching the frontend's expected config shape — if you add a field the frontend needs, it goes here, not just in a migration.

## API surface (backend/routes/api.php)

- **Public** (no auth): `GET /api/event-types`, `GET /api/invitations/{slug}`, `POST /api/invitations/{slug}/rsvp`, `GET|POST /api/invitations/{slug}/wishes`, plus the web route `GET /share/{slug}` (server-rendered Open Graph page for link previews; 404s for drafts). The two POSTs are rate-limited (`throttle:guest-submissions`, 6/min per IP+slug, 60/hour per IP — see `AppServiceProvider`) and carry a `website` honeypot field that must stay empty.
- **Admin** (`auth:sanctum` bearer token): `POST /api/admin/login` (`throttle:login`, 5/min per username+IP), CRUD on `/api/admin/invitations` and nested `people`/`schedule-events`/`milestones`/`gallery-images`, `POST .../upload` (multipart to `invitations/{slug}/images|audio/` on the uploads disk; returns `{path, url}`), `GET .../rsvps` (+ `/export` CSV, formula-escaped), `DELETE .../rsvps/{id}`, `GET|DELETE .../wishes`, `GET|POST|PUT|DELETE /api/admin/clients`.
- The admin `InvitationResource` adds a resolved `*_url` next to every stored file path (`hero_image_url`, `photo_url`, `image_url`, ...) — the editor uses those for previews; never build storage URLs in the frontend (it breaks on R2).
- Rate limits need a persistent cache store (`database`/`redis`); with `CACHE_STORE=array` they reset every request.

### Public response caching (Redis)

`GET /api/invitations/{slug}` and the first page of `GET .../wishes` are served through `App\Support\InvitationCache` (default cache store — `CACHE_STORE=redis` with `REDIS_CLIENT=predis` in production; local dev/tests use `database`/`array`, no Redis server needed). Invalidation is automatic via `App\Observers\InvitationCacheObserver` (`#[ObservedBy]` on Invitation + all content models, runs after commit, handles slug renames). **Query-builder writes (`Model::whereKey(...)->update()`, `$relation->delete()`) skip model events** — if you add one that changes public content and isn't followed by a normal model save, call `InvitationCache::forget($invitation)` yourself (see `GalleryImageController::reorder`). Unpublished/unknown slugs are never cached.

## Roles & ownership — admin vs. client

The `admin/*` API is shared by two roles, both authenticating through the same `POST /api/admin/login` and the same `auth:sanctum` bearer-token auth — they are **not** separate route trees.

- **`admin`** (`users.role = 'admin'`, e.g. the seeded `syamdasks14@gmail.com`) — the platform owner. Full CRUD on every invitation, regardless of who owns it. This is the only role that can create invitations (`InvitationController::store` explicitly checks `$request->user()->isAdmin()`) or reassign an invitation's `owner_id`.
- **`client`** (`users.role = 'client'`, e.g. the seeded `client-demo@example.com`) — a couple/host the admin builds an invitation for. Scoped to only the invitation(s) where `invitations.owner_id === $user->id`. **View + RSVP/guestbook only** — no editor access, by product decision (content edits stay with the admin for now). This is a deliberate scope cut, not a data-model limitation: `owner_id` already models one-to-many (a client can own multiple invitations), so self-serve editing or self-signup later are additive features, not a rework.

**The enforcement point is `AuthorizesInvitationAccess`** (`backend/app/Http/Controllers/Admin/Concerns/AuthorizesInvitationAccess.php`) — a trait with two levels, one of which must be the first line of every Admin controller method that resolves an `{invitation}` route param:
- `authorizeInvitation()` — **view + guest-response moderation**: admin, or the client who owns it. Used by `InvitationController@show`, `RsvpController` (index/export/destroy), `WishController`.
- `authorizeInvitationEdit()` — **content edits, admin only**: `InvitationController@update/destroy`, `PersonController`, `ScheduleEventController`, `MilestoneController`, `GalleryImageController`, `UploadController`. The "clients are view-only" product rule is enforced *here*, server-side — hiding the editor in the UI is not the security boundary (before 2026-09-22 it was only UI-level, and a client's token could delete their own invitation).

**If you add a new Admin controller method that takes an `Invitation` route param, call the right one first, or ownership scoping silently doesn't apply.** Nested resources must also be scoped to the invitation (`$invitation->milestones()->findOrFail($id)`), not resolved globally — `NestedInvitationResourceOwnershipTest` covers both. `InvitationController::index` is the other enforcement point — it filters `Invitation::query()` by `owner_id` for clients instead of using the trait, since there's no single invitation to check yet at that point.

**Frontend role branching:**
- `context/AdminAuthContext.jsx`'s `user` object now carries `role` (from `GET /api/admin/me`) — this is what every role check reads.
- `admin/HomeRouter.jsx` is the `/admin` index route: renders `Dashboard.jsx` (admin, full CRUD) or `client/ClientHome.jsx` (client, view-only) based on `user.role`.
- `client/ClientHome.jsx` skips straight to `/admin/invitations/{id}/rsvps` if the client owns exactly one invitation (the common case — no reason to make them click through a list screen to see their own RSVPs) and falls back to `client/ClientDashboard.jsx` (a card list, same visual language as the admin `Dashboard.jsx` but no "New invitation" button and no "Edit" link) when they own zero or multiple.
- `InvitationEditor.jsx` checks `user.role === 'client'` **before** firing its data-fetch `useEffect` (not after) and redirects to that invitation's `/rsvps` — checking after the fetch caused clients to get stuck on a permanent "Loading…" screen behind a 403, since the failed fetch never populated `invitation` state for the post-fetch check to even run. If you add another admin-only screen a client shouldn't reach, put the role check ahead of any data fetching, not after it.
- `RsvpList.jsx`/`WishList.jsx` are reused as-is for both roles (they already scope by the `:id` route param and inherit ownership enforcement for free from the backend) but now catch a `403`/`404` from the list fetch and render "You don't have access to..." instead of leaving an unhandled promise rejection and a silently-empty table — replicate this `.catch()` pattern in any other component that fetches invitation-scoped data.
- `WishList.jsx`'s delete button is hidden for `role === 'client'` (UI-level only — the backend permits a client to delete wishes on their own invitation, which is fine to allow, but the current product decision is not to expose that control yet). `RsvpList.jsx` *does* let the owning client delete RSVPs (duplicates/spam), since they own the headcount.

## Frontend architecture (frontend/src)

```
context/ConfigContext.jsx      → useConfig() hook every section calls instead of a static import
context/AdminAuthContext.jsx   → tracks admin login state via GET /api/admin/me; logs out on any 401
lib/api.js                    → all fetch calls (public + admin), the one API_BASE, errorMessage(),
                                  bearer token + 401 handling, client-side upload size limits
lib/invitationText.js         → displayName / eventDate (null-safe — never new Date(null)) / pageTitle,
                                  plus per-event-type footer quotes & guestbook blessings
lib/storyLayouts.js           → the 5 story layout names/descriptions (editor + dashboard)
lib/calendar.js               → .ics export (UTC times, RFC 5545 escaping, all-day fallback)
shells/                       → per-type page composition (StandardShell wraps each section in an
                                  ErrorBoundary so one bad section can't white-screen the page)
lib/animationPresets.js       → subtle/balanced/playful multiplier tables (see Animation intensity above)
pages/InvitationPage.jsx       → fetches one invitation by slug, wraps sections in <ConfigProvider>;
                                  404 ("not found") vs other errors ("try again") are shown differently
pages/Landing.jsx              → "/" marketing stub, links to /admin/login
admin/
  AdminLayout.jsx              → auth-gated shell for all /admin/* routes, both roles
  HomeRouter.jsx                → /admin index route: Dashboard (admin) vs ClientHome (client)
  Login.jsx, Dashboard.jsx     → admin: list/create invitations (all of them)
  InvitationEditor.jsx         → admin-only: tabbed editor: Basics, People, Date & Venue, Schedule, Story,
                                  Gallery, Theme & Motion, Contact. Active tab lives in the URL (?tab=...) —
                                  do not go back to plain useState for it, that's what caused saves to
                                  appear to "reset" the tab before. Every save goes through useAction()
                                  (pending state + toast with the API's real error); form tabs report
                                  unsaved changes (useReportDirty) and tab switches/page unload confirm.
                                  "Add event/milestone" makes a local draft row — nothing is created
                                  server-side (or shown publicly) until Save.
  themePresets.js              → curated palette list for the Theme tab (see Theme presets above)
  MapPicker.jsx                → search + embed + "use this" location picker for Schedule events
  RsvpList.jsx, WishList.jsx   → shared by both roles — read-only views + CSV export / delete (delete
                                  hidden for clients); ownership-scoped for free by the backend
client/
  ClientHome.jsx                → client's /admin landing: straight to their one invitation's RSVPs,
                                  or ClientDashboard.jsx if they own zero/multiple
  ClientDashboard.jsx           → client: card list of only their own invitation(s), view-only
App.jsx                        → react-router-dom routes: "/", "/i/:slug", "/admin/*" (admin routes are
                                  React.lazy chunks — guests never download the editor), wrapped in
                                  <MotionConfig reducedMotion="user"> and a page-level ErrorBoundary
sections/story-layouts/        → 5 layout components (see Story layouts above), dispatched by Story.jsx
components/, sections/         → mostly UNCHANGED from the original static site — every one calls
                                  `const config = useConfig();` instead of importing wedding.config.js;
                                  Hero.jsx/Footer.jsx/NavBar.jsx additionally null-check couple.bride/
                                  couple.groom independently (see Bride/groom visibility toggle above)
config/wedding.config.js       → kept only as a shape reference; no longer imported anywhere live
```

### Config-driven rendering pattern (unchanged)

Every section calls `useConfig()` and self-guards with an `enabled` flag. **Hooks must run before any early return** — this bit us twice during the migration (`Story.jsx` originally, then `Schedule.jsx`'s `useState` was also found after a conditional `return null`; both are fixed). If you add a new section, call every hook unconditionally first, then check `enabled` and `return null` after.

### Type-aware sections

`config.couple` is populated for weddings, `config.celebrant` for birthdays, and `config.people` (role → `{firstName, parents, photo}`) for every type — use `displayName(config)` from `lib/invitationText.js` rather than re-deriving names. **Never hardcode wedding wording in a shared section**: per-type copy comes from `EventTypes::ALL[type]['copy']` via `InvitationConfigResource` (`countdown.subtitle/eventLabel/todayMessage/pastMessage`, `hero.dateRevealLabel`, section titles, RSVP labels), plus `decorSymbols` and `mealOptions` (`[]` hides the meal question). Use `eventDateISO` (UTC) — `weddingDateISO` and `contact.bridePhone/groomPhone` are legacy aliases kept for back-compat. `countdown.enabled` is false until an event date exists. The NavBar only lists sections whose `enabled` is true.

### RSVP + Guestbook persistence

Both go through `frontend/src/lib/api.js` → the Laravel API, scoped to the current invitation's slug — the backend must be running. The only browser storage is the guest's own `rsvp:{slug}` record (id + edit token) so they can see/change their answer.

## Known issues / not yet built

1. **No "duplicate invitation" admin action** — creating a new invitation always starts blank.
2. **Landing page (`/`) is a bare stub** — not a real marketing page, just links to admin login.
3. **No wish moderation queue** — wishes go live immediately (rate limit + honeypot keep bots out; the admin can delete). An approve-first mode would need an `approved_at` column.
4. **Changing a slug breaks already-shared links** — the editor warns, but there's no old-slug redirect table.
5. **No frontend lint/test tooling** (no ESLint, no Vitest) — backend has PHPUnit feature tests only.
6. **Housekeeping needs the scheduler** — `sanctum:prune-expired` (daily) and `app:prune-orphan-uploads` (weekly, deletes unreferenced uploads older than 24h; `--dry-run` first) only run if production runs `php artisan schedule:run` on a cron.

### Already fixed (do not reintroduce)

- ~~Admin editor text contrast~~ — labels/secondary text on the editor's dark page background used `text-muted` (tuned for text-on-cream-card), reading as nearly invisible. Fixed by switching to `text-fg-soft` throughout `InvitationEditor.jsx`. If you add a new admin tab, use `text-fg-soft` for labels on the page background; only use `text-muted`/`text-ink` for text sitting inside an actual `bg-white`/`bg-surface` card.
- ~~Story milestone x/y sliders~~ — replaced by the 5-layout picker (see Story layouts above); the admin never manually positions a star again.
- ~~Editor "kicks back to Basics tab" on save~~ — root cause wasn't conclusively reproduced, but the active tab now lives in the URL (`?tab=`) rather than component state, so it survives any remount regardless of cause.
- ~~No way back to the dashboard from the editor~~ — `InvitationEditor.jsx` now has an explicit "Back to dashboard" link above the invitation slug heading.
- ~~2026-09-22 audit~~ (branch `fix/audit`): client writes enforced server-side; login + guest-submission rate limits; `users.role` defaults to `client`; CSV formula escaping; UTC event dates; schedule dates serialize as `Y-m-d` (`date:Y-m-d` cast — the default `date` cast emits a full ISO string that `<input type="date">` shows as blank); NOT NULL columns (`connector`, ...) fall back to defaults instead of 500ing; column lengths match validation; seeded people get blank names instead of "Bride"/"Groom" placeholders; files are deleted with their invitation; `UPLOADS_DISK=` (empty) falls back to `public`; `document.title` never reads "null"; error boundaries; reduced-motion support; code-split admin bundle.

## Concurrent multi-session note

This project has been worked on by **multiple Claude sessions running in parallel** on the same machine (visible via the `ListAgents`/`SendMessage` tools). If you're picking this repo up fresh: check for other active sessions before making sweeping changes to shared files (`InvitationConfigResource.php`, `UpdateInvitationRequest.php`, `InvitationDetail.php`, `InvitationEditor.jsx` in particular have all had overlapping work from different sessions in the same day) — message peers to divide ownership before editing rather than assuming you're the only one touching the codebase.

## Conventions to follow when editing this repo

- Keep sections **config-driven** — add new fields through `InvitationConfigResource` (backend shape) and the corresponding migration/admin editor tab, never hardcode content into a component.
- Preserve the `enabled` flag convention; hooks always before the enabled check.
- Match the existing comment style: short "why"-focused header comments, not exhaustive inline noise.
- Animations go through Framer Motion or the existing CSS keyframes in `index.css` — no second animation library.
- Theme colors always go through the `--color-*` CSS variables and, in the admin, through curated presets only (`themePresets.js`) — never add a raw color-code input back into the UI.
- File uploads go through `adminUploadFile(invitationId, file, kind)` in `lib/api.js` (`kind` is `'image'` or `'audio'`, routed server-side to `invitations/{slug}/images|audio/` on the uploads disk; returns `{path, url}` — save `path`, preview with `url`). In the editor, use the `FileField` component (upload + preview + remove + error toast). `adminUploadImage` still exists as a back-compat alias.
- Admin UI errors: show `errorMessage(err)` from `lib/api.js` (first validation message), never swallow a rejected promise.
- Backend: follow Laravel Boost's guidelines in this same `backend/CLAUDE.md`/`AGENTS.md` (curly braces always, typed params/returns, `make:` commands with `--no-interaction`, PHPDoc over inline comments) — Boost rewrote that file with framework-version-accurate rules; don't hand-edit around them.
- Frontend and backend are independent: `npm install`/`npm run dev` in `frontend/`; composer/`artisan` commands in `backend/`. Don't mix dependency files across the boundary.
