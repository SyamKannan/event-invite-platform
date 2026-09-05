# CLAUDE.md

Guidance for Claude Code (and future contributors) working in this repository.

## What this project is today

A **multi-tenant invitation platform**: one Laravel API + one React frontend serve unlimited weddings and birthdays, each reachable at `/i/{slug}`, fully manageable through an admin dashboard — no per-event redeploy, no per-event domain purchase.

- **[`backend/`](backend/)** — Laravel 13 (PHP 8.4) JSON API. Owns all invitation data (people, schedule, story milestones, gallery, RSVPs, guestbook wishes) in MySQL, plus Sanctum-based admin auth and local-disk image storage.
- **[`frontend/`](frontend/)** — Vite + React 18 + Tailwind + Framer Motion. Renders any invitation at `/i/:slug` by fetching its config from the API (same shape the old static `wedding.config.js` used), and hosts the `/admin/*` dashboard for managing invitations.

## Local dev setup

Two servers, run independently:

```bash
# Backend (Laravel) — uses the php84 binary, NOT the php on PATH (that's XAMPP's older 8.0)
cd backend
"/c/Users/Syam/php84/php.exe" artisan serve --port=8001

# Frontend (Vite) — locked to port 5174 in vite.config.js
cd frontend
npm run dev
```

**Why port 8001 / 5174, not the defaults 8000/5173:** another, unrelated project on this machine runs its own Laravel/Vite dev servers on the default ports. This project is pinned to 8001/5174 everywhere (`backend/.env` → `FRONTEND_URLS`, `SANCTUM_STATEFUL_DOMAINS`; `frontend/vite.config.js` → `server.port` + `strictPort: true`; `frontend/.env.local` → `VITE_API_URL`) specifically to avoid colliding with it. Before killing anything on 8000/5173/8001/5174 to "free the port," run `netstat -ano | grep ":<port>"` then `tasklist //FI "PID eq <pid>"` and confirm it's actually this project's process — do not assume.

**Why `localhost`, not `127.0.0.1`:** Sanctum's SPA cookie auth is domain-scoped (`SESSION_DOMAIN=localhost` in `backend/.env`). The frontend's `VITE_API_URL` must use `http://localhost:8001`, not `127.0.0.1`, or the browser won't send the session cookie back and admin login will silently fail with 401s.

Database: MySQL via XAMPP, database name `wedding_invites`, default `root` user with no password (matches XAMPP's default). Migrate + seed:

```bash
cd backend
"/c/Users/Syam/php84/php.exe" artisan migrate:fresh --seed
```

This seeds one admin user (email `syamdasks14@gmail.com` — **check `database/seeders/AdminUserSeeder.php` for the current password**, it has been changed at least once outside of any assistant edit), one demo client user (`client-demo@example.com` / see `database/seeders/ClientUserSeeder.php` for the password), and two demo invitations: `syam-and-swathi` (wedding, owned by the demo client) and `priyas-30th` (birthday, unowned — admin-only). See "Roles & ownership" below before touching auth/invitation-scoping code.

## Data model (backend/database/migrations)

- **invitations** — `slug` (unique, drives the public URL), `type` (`wedding`|`birthday`), `is_published`, `theme` (JSON color overrides — see Theme presets below), `story_layout` (`constellation`|`timeline`|`horizontal`|`stacked`|`mosaic`, default `constellation`), `animation_intensity` (`subtle`|`balanced`|`playful`, default `balanced`), `meta_title`/`meta_description`.
- **invitation_details** — 1:1, all the "flat" per-invitation fields: event date/display strings, hero image/copy, envelope copy (+ `envelope_animation`, one of 11 opening-cover styles — see `App\Support\EnvelopeAnimations::ALL`), music, contact info, floating decor settings, wedding-only `connector`/`show_bride`/`show_groom`, birthday-only `celebrant_age`/`celebrant_turning_text`.
- **invitation_people** — bride/groom (wedding) or celebrant (birthday) rows: name, parents text, photo.
- **schedule_events**, **milestones**, **gallery_images** — repeatable per-invitation content, each with a `sort_order`. Milestones still carry `x`/`y` columns for the Constellation story layout, but the admin editor no longer exposes them for manual editing — the other 4 layouts ignore them and use array order instead (see Story layouts below).
- **rsvps** — guest name, accept/decline, guest count, meal preference, note. **This is new** — the old static site never persisted RSVPs at all.
- **wishes** — guestbook entries (replaces the old Supabase table).

### Bride/groom visibility toggle

`invitation_details.show_bride`/`show_groom` (booleans, default `true`) let an admin hide one side entirely for wedding invitations (e.g. only a groom's family is hosting). `InvitationConfigResource` nulls out `couple.bride` or `couple.groom` in the public API response when hidden — every frontend component that reads `couple.bride`/`couple.groom` (`Hero.jsx`, `Footer.jsx`, `NavBar.jsx`, and `wedding-template-50`'s `CoverContent.jsx` for the envelope) must null-check both independently and only render the connector when *both* are present. If you add a new component that displays the couple's names, follow this pattern — don't assume both sides exist.

### Theme presets

`invitations.theme` is a JSON blob of the same RGB-triplet keys `ThemeProvider.jsx` has always read (`bg`, `surface`, `fg`, `fgSoft`, `ink`, `muted`, `accent`, `gold`, `rose`). There is **no color picker or raw RGB entry in the admin UI** — the Theme & Motion tab only offers curated presets from `frontend/src/admin/themePresets.js` (`THEME_PRESETS`, 8 named palettes). Add new presets there, not by exposing color inputs — the whole point is admins don't need to know color theory.

### Animation intensity vs. envelope animation — two separate concerns

Don't conflate these:
- **`animation_intensity`** (this session's addition) is a *global* multiplier — how many floating hearts/petals render and how fast transitions feel overall. Defined in `frontend/src/lib/animationPresets.js` (`ANIMATION_PRESETS`), consumed by `FloatingHearts.jsx` and `Hero.jsx`'s petal count via `getAnimationPreset(config.animationIntensity)`. Lives in the admin's "Theme & Motion" tab.
- **`envelope_animation`** (a parallel change, same session) is *which specific effect* plays when the cover opens — one of 11 named variants (`App\Support\EnvelopeAnimations::ALL`), rendered by a dispatcher registry under `frontend/src/components/envelope/`. Lives in the admin's "Date & Venue" tab, next to `envelope_cta`.

They can both apply at once (e.g. a "Playful" intensity page using the "Confetti Pop" envelope effect) — don't try to merge them into one setting.

### Story layouts (5 selectable, admin-picked)

`config.storyLayout` drives which component `frontend/src/sections/Story.jsx` renders, from `frontend/src/sections/story-layouts/`: `ConstellationLayout` (original starfield; auto-spaces milestones along a zigzag curve if `x`/`y` are missing, so it works even without the old manual coordinates), `TimelineLayout` (alternating left/right, vertical line), `HorizontalScrollLayout` (swipeable card strip), `StackedLayout` (simple top-to-bottom cards), `MosaicLayout` (photo-forward grid, caption on hover). All 5 consume the exact same milestone shape (`date`, `title`, `description`, `image`) — adding a 6th layout means adding one component here plus one entry in `Story.jsx`'s `LAYOUTS` map and the admin's `STORY_LAYOUTS` array (`frontend/src/admin/InvitationEditor.jsx`), no backend/API change needed.

### Map picker (Schedule tab)

`frontend/src/admin/MapPicker.jsx` replaces a raw "Map URL" text field with a search box + live Google Maps `output=embed` iframe preview (no API key). "Use this" commits `https://maps.google.com/?q={query}` as `map_url` — the same URL shape the seeded demo data already uses, so the public Schedule page's QR code (`qrcode.react`) and "Directions" link needed zero changes.

`App\Http\Resources\InvitationConfigResource` (`backend/app/Http/Resources/`) is the piece that shapes all of the above into one JSON object matching the frontend's expected config shape — if you add a field the frontend needs, it goes here, not just in a migration.

## API surface (backend/routes/api.php)

- **Public** (no auth, CSRF-exempt via `bootstrap/app.php`'s `validateCsrfTokens(except: ['api/invitations/*'])`): `GET /api/invitations/{slug}`, `POST /api/invitations/{slug}/rsvp`, `GET|POST /api/invitations/{slug}/wishes`.
- **Admin** (`auth:sanctum`, cookie-based SPA session): `POST /api/admin/login`, full CRUD on `/api/admin/invitations` and nested `people`/`schedule-events`/`milestones`/`gallery-images`, `POST .../upload` (multipart image upload to `storage/app/public/invitations/{slug}/`), `GET .../rsvps` (+ `/export` CSV), `GET|DELETE .../wishes`.

**Important CSRF/Sanctum gotcha already solved once — don't re-break it:** `bootstrap/app.php` calls `$middleware->statefulApi()`, which routes *every* `api/*` request through Sanctum's `EnsureFrontendRequestsAreStateful` middleware, including the public unauthenticated endpoints. Without the `validateCsrfTokens(except: [...])` exemption for `api/invitations/*`, anonymous RSVP/wish submissions get rejected with `419 CSRF token mismatch`, since they correctly don't send an `X-XSRF-TOKEN` header. If you add another public endpoint, add its path to that `except` array too.

## Roles & ownership — admin vs. client

The `admin/*` API is shared by two roles, both authenticating through the same `POST /api/admin/login` and the same `auth:sanctum` cookie session — they are **not** separate route trees.

- **`admin`** (`users.role = 'admin'`, e.g. the seeded `syamdasks14@gmail.com`) — the platform owner. Full CRUD on every invitation, regardless of who owns it. This is the only role that can create invitations (`InvitationController::store` explicitly checks `$request->user()->isAdmin()`) or reassign an invitation's `owner_id`.
- **`client`** (`users.role = 'client'`, e.g. the seeded `client-demo@example.com`) — a couple/host the admin builds an invitation for. Scoped to only the invitation(s) where `invitations.owner_id === $user->id`. **View + RSVP/guestbook only** — no editor access, by product decision (content edits stay with the admin for now). This is a deliberate scope cut, not a data-model limitation: `owner_id` already models one-to-many (a client can own multiple invitations), so self-serve editing or self-signup later are additive features, not a rework.

**The enforcement point is `AuthorizesInvitationAccess`** (`backend/app/Http/Controllers/Admin/Concerns/AuthorizesInvitationAccess.php`) — a trait with one method, `authorizeInvitation(Invitation $invitation, User $user)`, called as the first line of every Admin controller method that resolves an `{invitation}` route param (all of `InvitationController@show/update/destroy`, `PersonController`, `ScheduleEventController`, `MilestoneController`, `GalleryImageController`, `UploadController`, `RsvpController`, `WishController`). It throws a `403` unless the user is an admin or owns that specific invitation. **If you add a new nested Admin controller method that takes an `Invitation` route param, you must call `$this->authorizeInvitation($invitation, $request->user())` as its first line, or ownership scoping silently doesn't apply to it.** `InvitationController::index` is the other enforcement point — it filters `Invitation::query()` by `owner_id` for clients instead of using the trait, since there's no single invitation to check yet at that point.

**Frontend role branching:**
- `context/AdminAuthContext.jsx`'s `user` object now carries `role` (from `GET /api/admin/me`) — this is what every role check reads.
- `admin/HomeRouter.jsx` is the `/admin` index route: renders `Dashboard.jsx` (admin, full CRUD) or `client/ClientHome.jsx` (client, view-only) based on `user.role`.
- `client/ClientHome.jsx` skips straight to `/admin/invitations/{id}/rsvps` if the client owns exactly one invitation (the common case — no reason to make them click through a list screen to see their own RSVPs) and falls back to `client/ClientDashboard.jsx` (a card list, same visual language as the admin `Dashboard.jsx` but no "New invitation" button and no "Edit" link) when they own zero or multiple.
- `InvitationEditor.jsx` checks `user.role === 'client'` **before** firing its data-fetch `useEffect` (not after) and redirects to that invitation's `/rsvps` — checking after the fetch caused clients to get stuck on a permanent "Loading…" screen behind a 403, since the failed fetch never populated `invitation` state for the post-fetch check to even run. If you add another admin-only screen a client shouldn't reach, put the role check ahead of any data fetching, not after it.
- `RsvpList.jsx`/`WishList.jsx` are reused as-is for both roles (they already scope by the `:id` route param and inherit ownership enforcement for free from the backend) but now catch a `403`/`404` from the list fetch and render "You don't have access to..." instead of leaving an unhandled promise rejection and a silently-empty table — replicate this `.catch()` pattern in any other component that fetches invitation-scoped data.
- `WishList.jsx`'s delete button is hidden for `role === 'client'` (UI-level only — the backend technically permits a client to delete wishes on their own invitation, which is fine to allow, but the current product decision is not to expose that control yet).

## Frontend architecture (frontend/src)

```
context/ConfigContext.jsx      → useConfig() hook every section calls instead of a static import
context/AdminAuthContext.jsx   → tracks admin login state via GET /api/admin/me
lib/api.js                    → all fetch calls (public + admin), CSRF cookie handling
lib/animationPresets.js       → subtle/balanced/playful multiplier tables (see Animation intensity above)
pages/InvitationPage.jsx       → fetches one invitation by slug, wraps sections in <ConfigProvider>
pages/Landing.jsx              → "/" marketing stub, links to /admin/login
admin/
  AdminLayout.jsx              → auth-gated shell for all /admin/* routes, both roles
  HomeRouter.jsx                → /admin index route: Dashboard (admin) vs ClientHome (client)
  Login.jsx, Dashboard.jsx     → admin: list/create invitations (all of them)
  InvitationEditor.jsx         → admin-only: tabbed editor: Basics, People, Date & Venue, Schedule, Story,
                                  Gallery, Theme & Motion, Contact. Active tab lives in the URL (?tab=...) —
                                  do not go back to plain useState for it, that's what caused saves to
                                  appear to "reset" the tab before.
  themePresets.js              → curated palette list for the Theme tab (see Theme presets above)
  MapPicker.jsx                → search + embed + "use this" location picker for Schedule events
  RsvpList.jsx, WishList.jsx   → shared by both roles — read-only views + CSV export / delete (delete
                                  hidden for clients); ownership-scoped for free by the backend
client/
  ClientHome.jsx                → client's /admin landing: straight to their one invitation's RSVPs,
                                  or ClientDashboard.jsx if they own zero/multiple
  ClientDashboard.jsx           → client: card list of only their own invitation(s), view-only
App.jsx                        → react-router-dom routes: "/", "/i/:slug", "/admin/*"
sections/story-layouts/        → 5 layout components (see Story layouts above), dispatched by Story.jsx
components/, sections/         → mostly UNCHANGED from the original static site — every one calls
                                  `const config = useConfig();` instead of importing wedding.config.js;
                                  Hero.jsx/Footer.jsx/NavBar.jsx additionally null-check couple.bride/
                                  couple.groom independently (see Bride/groom visibility toggle above)
config/wedding.config.js       → kept only as a shape reference; no longer imported anywhere live
```

### Config-driven rendering pattern (unchanged)

Every section calls `useConfig()` and self-guards with an `enabled` flag. **Hooks must run before any early return** — this bit us twice during the migration (`Story.jsx` originally, then `Schedule.jsx`'s `useState` was also found after a conditional `return null`; both are fixed). If you add a new section, call every hook unconditionally first, then check `enabled` and `return null` after.

### Type-aware sections (wedding vs birthday)

`config.type` is `'wedding'` or `'birthday'`. `config.couple` is populated (and `config.celebrant` is `null`) for weddings; the reverse for birthdays. `Hero.jsx`, `Envelope.jsx`, `Footer.jsx`, and `NavBar.jsx` all branch on `config.type` to show bride/groom vs. a single celebrant name. `Schedule.jsx`/`Gallery.jsx`/`RSVP.jsx`/`Guestbook.jsx`/`Countdown.jsx` are type-agnostic — they only read `schedule.events`, `gallery.images`, etc., which are already shaped identically by `InvitationConfigResource` regardless of type.

### RSVP + Guestbook persistence

Both now go through `frontend/src/lib/api.js` → the Laravel API, scoped to the current invitation's slug. There is no more Supabase or localStorage fallback (`src/lib/supabase.js` was deleted) — the guestbook/RSVP always require the backend to be running.

## Known issues / not yet built

1. **No error boundary** on the frontend — a malformed API response could still white-screen a section.
2. **No image reordering/drag-and-drop** in the Gallery admin tab — images append in upload order only; `sort_order` exists in the schema but isn't editable from the UI yet.
3. **No "duplicate invitation" admin action** — creating a new invitation always starts blank; there's no "use this wedding as a template for the next one" shortcut yet.
4. **Landing page (`/`) is a bare stub** — not a real marketing page, just links to admin login.
5. **`@supabase/supabase-js` dependency and `.env.example`** in `frontend/` are now unused leftovers from before the Laravel migration — harmless but could be removed in a cleanup pass.

### Already fixed (do not reintroduce)

- ~~Admin editor text contrast~~ — labels/secondary text on the editor's dark page background used `text-muted` (tuned for text-on-cream-card), reading as nearly invisible. Fixed by switching to `text-fg-soft` throughout `InvitationEditor.jsx`. If you add a new admin tab, use `text-fg-soft` for labels on the page background; only use `text-muted`/`text-ink` for text sitting inside an actual `bg-white`/`bg-surface` card.
- ~~Story milestone x/y sliders~~ — replaced by the 5-layout picker (see Story layouts above); the admin never manually positions a star again.
- ~~Editor "kicks back to Basics tab" on save~~ — root cause wasn't conclusively reproduced, but the active tab now lives in the URL (`?tab=`) rather than component state, so it survives any remount regardless of cause.
- ~~No way back to the dashboard from the editor~~ — `InvitationEditor.jsx` now has an explicit "Back to dashboard" link above the invitation slug heading.

## Concurrent multi-session note

This project has been worked on by **multiple Claude sessions running in parallel** on the same machine (visible via the `ListAgents`/`SendMessage` tools). If you're picking this repo up fresh: check for other active sessions before making sweeping changes to shared files (`InvitationConfigResource.php`, `UpdateInvitationRequest.php`, `InvitationDetail.php`, `InvitationEditor.jsx` in particular have all had overlapping work from different sessions in the same day) — message peers to divide ownership before editing rather than assuming you're the only one touching the codebase.

## Conventions to follow when editing this repo

- Keep sections **config-driven** — add new fields through `InvitationConfigResource` (backend shape) and the corresponding migration/admin editor tab, never hardcode content into a component.
- Preserve the `enabled` flag convention; hooks always before the enabled check.
- Match the existing comment style: short "why"-focused header comments, not exhaustive inline noise.
- Animations go through Framer Motion or the existing CSS keyframes in `index.css` — no second animation library.
- Theme colors always go through the `--color-*` CSS variables and, in the admin, through curated presets only (`themePresets.js`) — never add a raw color-code input back into the UI.
- File uploads go through `adminUploadFile(invitationId, file, kind)` in `lib/api.js` (`kind` is `'image'` or `'audio'`, routed server-side to `storage/app/public/invitations/{slug}/images|audio/`). `adminUploadImage` still exists as a back-compat alias for `kind: 'image'` call sites.
- Backend: follow Laravel Boost's guidelines in this same `backend/CLAUDE.md`/`AGENTS.md` (curly braces always, typed params/returns, `make:` commands with `--no-interaction`, PHPDoc over inline comments) — Boost rewrote that file with framework-version-accurate rules; don't hand-edit around them.
- Frontend and backend are independent: `npm install`/`npm run dev` in `frontend/`; composer/`artisan` commands in `backend/`. Don't mix dependency files across the boundary.
