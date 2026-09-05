# Invitations Platform

A multi-tenant wedding & birthday invitation platform. One deployment serves every invitation — each gets its own link (`/i/{slug}`) and is fully manageable through an admin dashboard (names, photos, dates, schedule, theme, RSVPs, guestbook) with no code edits and no per-event domain purchase.

- **[`backend/`](backend/)** — Laravel 13 JSON API (PHP 8.4, MySQL). Owns all invitation data and admin auth.
- **[`frontend/`](frontend/)** — Vite + React 18 + Tailwind CSS + Framer Motion. Renders any invitation by slug and hosts the `/admin` dashboard.

See [`CLAUDE.md`](CLAUDE.md) for the full architecture, data model, and known gotchas (in particular the Sanctum CSRF setup and the fixed port numbers below).

## Quick start

### 1. Database

Requires MySQL (e.g. via XAMPP) running locally. Create the database once:

```sql
CREATE DATABASE wedding_invites CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env   # then set DB_* and FRONTEND_URLS/SANCTUM_STATEFUL_DOMAINS — see CLAUDE.md
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8001
```

Runs at **http://localhost:8001**. The seeder creates one admin user and two demo invitations (`syam-and-swathi` a wedding, `priyas-30th` a birthday) — check `database/seeders/AdminUserSeeder.php` for current login credentials.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5174** (locked in `vite.config.js` to match the backend's CORS config). Visit:

- `http://localhost:5174/i/syam-and-swathi` — a live invitation
- `http://localhost:5174/admin/login` — the admin dashboard

> Both ports (8001/5174) are chosen to avoid colliding with an unrelated project's dev servers on this machine, which use the Laravel/Vite defaults (8000/5173). If you're setting this up fresh elsewhere, the defaults work fine — just update `FRONTEND_URLS`/`SANCTUM_STATEFUL_DOMAINS` in `backend/.env`, `VITE_API_URL` in `frontend/.env.local`, and `server.port` in `frontend/vite.config.js` to match whatever you pick.

## Creating a new invitation

No code changes, no redeploy:

1. Log into `/admin`.
2. Click **New invitation**, choose **Wedding** or **Birthday**, pick a slug.
3. Use the editor's tabs (Basics, People, Date & Venue, Schedule, Story, Gallery, Theme, Contact) to fill in content and upload photos.
4. Toggle **Published** in the Basics tab.
5. Share `https://yourdomain.com/i/{slug}`.

## Project structure

```
backend/
├── app/Models/                     Invitation, InvitationDetail, InvitationPerson,
│                                    ScheduleEvent, Milestone, GalleryImage, Rsvp, Wish, User
├── app/Http/Controllers/
│   ├── Public/                     unauthenticated: show invitation, submit RSVP/wish
│   └── Admin/                      Sanctum-authenticated: full CRUD + image upload + CSV export
├── app/Http/Resources/
│   └── InvitationConfigResource.php  shapes DB rows into the frontend's config JSON
├── database/migrations/            one table per model above
├── database/seeders/               AdminUserSeeder, InvitationSeeder (demo wedding + birthday)
└── routes/api.php

frontend/
├── src/context/ConfigContext.jsx   useConfig() — every section's data source
├── src/context/AdminAuthContext.jsx
├── src/lib/api.js                  all API calls (public + admin), CSRF handling
├── src/pages/InvitationPage.jsx    fetches one invitation by slug, renders the full site
├── src/admin/                      Login, Dashboard, InvitationEditor, RsvpList, WishList
├── src/components/, src/sections/  the actual invitation UI — unchanged from the original
│                                    single-wedding template, now config-driven via API
└── src/config/wedding.config.js    kept only as a reference for the config shape
```

## Deploy

**Backend** deploys like any Laravel app (Forge, Vapor, a VPS). Set `DB_*`, `APP_URL`, `FRONTEND_URLS`, and `SANCTUM_STATEFUL_DOMAINS` for your production domain(s); run `php artisan storage:link` on the server for uploaded images to be servable.

**Frontend** is static — deploy `frontend/dist/` (after `npm run build`) to Vercel, Netlify, Cloudflare Pages, or any static host, with `VITE_API_URL` pointed at your deployed backend.

## License

MIT — fork it for every wedding (or birthday) in your family.
