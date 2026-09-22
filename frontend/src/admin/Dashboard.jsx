// ADMIN DASHBOARD — CMS-style control center: headline stats, a filterable/
// searchable/paginated grid of every invitation, and quick actions per card
// (edit, RSVPs, wishes, share, view, plus theme/story-layout at a glance so
// admins can tell invitations apart by design, not just by slug).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ExternalLink, LayoutGrid, MessageSquare,
  Plus, Search, Share2, Sparkles, Users, X,
} from 'lucide-react';
import {
  adminCreateInvitation, adminGetDashboardStats, adminListInvitations, adminUpdateInvitation,
} from '../lib/api.js';
import { loadEventTypes } from '../lib/eventTypes.js';
import { getEventTypeIcon } from '../lib/eventTypeIcons.js';
import { whatsappShareUrl } from '../lib/share.js';
import DashboardStats from './DashboardStats.jsx';
import { findThemePreset, THEME_PRESETS } from './themePresets.js';

const STORY_LAYOUT_LABELS = {
  constellation: 'Constellation',
  timeline: 'Timeline',
  horizontal: 'Horizontal scroll',
  stacked: 'Stacked',
  mosaic: 'Mosaic',
};

function ThemeSwatch({ theme }) {
  if (!theme) return null;
  const keys = ['accent', 'gold', 'rose', 'bg'];
  return (
    <div className="flex overflow-hidden rounded-full ring-1 ring-ink/10">
      {keys.map((key) => (
        <span
          key={key}
          className="h-4 w-4"
          style={{ backgroundColor: theme[key] ? `rgb(${theme[key].replaceAll(' ', ',')})` : 'transparent' }}
        />
      ))}
    </div>
  );
}

const PER_PAGE = 12;

export default function Dashboard() {
  const [invitations, setInvitations] = useState(null);
  const [meta, setMeta] = useState(null);
  const [eventTypes, setEventTypes] = useState(null);
  const [stats, setStats] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('wedding');
  const [error, setError] = useState(null);
  const [listError, setListError] = useState(null);

  // Filters — searchInput is debounced into `search` so we don't refetch on
  // every keystroke; everything else refetches immediately.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadEventTypes().then(setEventTypes);
    adminGetDashboardStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const fetchInvitations = useCallback(() => {
    setListError(null);
    adminListInvitations({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
      page,
      per_page: PER_PAGE,
    })
      .then(({ data, meta: pageMeta }) => {
        setInvitations(data);
        setMeta(pageMeta);
      })
      .catch((err) => setListError(err.message));
  }, [typeFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const hasActiveFilters = typeFilter || statusFilter || search;

  function resetFilters() {
    setTypeFilter('');
    setStatusFilter('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const invitation = await adminCreateInvitation({ slug: newSlug.trim(), type: newType });

      // Seed the invitation's theme from its event type's registry-declared
      // default preset (e.g. a business_opening starts bold/bright, not
      // whatever wedding's default is) — the backend intentionally doesn't
      // resolve theme presets itself (the actual RGB values only live here,
      // in THEME_PRESETS, to avoid duplicating the palette on both sides).
      const presetKey = eventTypes?.[newType]?.defaultThemePreset;
      const preset = presetKey && THEME_PRESETS.find((p) => p.key === presetKey);
      if (preset) {
        await adminUpdateInvitation(invitation.id, { theme: preset.theme });
      }

      setNewSlug('');
      setCreating(false);

      // Jump to a clean, unfiltered first page so the invitation just
      // created is guaranteed to be visible (it may not match the admin's
      // current type/status/search filters), then force a refetch — the
      // filter-watching effect alone won't refire when filters were already
      // empty, since resetFilters() wouldn't actually change any state.
      resetFilters();
      fetchInvitations();

      adminGetDashboardStats().then(setStats).catch(() => {});
    } catch (err) {
      setError(err.errors?.slug?.[0] || err.message);
    }
  }

  const lastPage = meta?.last_page ?? 1;

  const typeOptions = useMemo(
    () => (eventTypes ? Object.entries(eventTypes).map(([key, cfg]) => ({ key, label: cfg.label })) : []),
    [eventTypes]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold"
        >
          <Plus size={16} /> New invitation
        </button>
      </div>

      <DashboardStats stats={stats} eventTypes={eventTypes} />

      {creating && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleCreate}
          className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-accent/20 bg-surface p-6 text-ink"
        >
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Type</span>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="mt-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 outline-none"
            >
              {eventTypes
                ? Object.entries(eventTypes).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))
                : (
                    <>
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday</option>
                    </>
                  )}
            </select>
          </label>
          <label className="block flex-1 min-w-[200px]">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug (URL)</span>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="aisha-and-rahul"
              required
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold"
          >
            Create
          </button>
          {error && <p className="w-full text-sm text-rose">{error}</p>}
        </motion.form>
      )}

      {/* Filter bar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-soft" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by slug or title…"
            className="w-full rounded-full border border-accent/20 bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-accent/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-full border border-accent/20 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/50"
        >
          <option value="">All types</option>
          {typeOptions.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-full border border-accent/20 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/50"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-full border border-accent/20 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {listError && <p className="mt-4 text-sm text-rose">{listError}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invitations === null && !listError && <p className="text-fg-soft">Loading…</p>}
        {invitations?.length === 0 && (
          <p className="col-span-full flex items-center gap-2 text-fg-soft">
            <LayoutGrid size={16} />
            {hasActiveFilters ? 'No invitations match these filters.' : 'No invitations yet — create your first one above.'}
          </p>
        )}
        {invitations?.map((inv) => {
          const Icon = getEventTypeIcon(eventTypes?.[inv.type]?.icon);
          const preset = findThemePreset(inv.theme);
          const layoutLabel = STORY_LAYOUT_LABELS[inv.story_layout];
          return (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_10px_30px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 text-accent">
                <Icon size={16} />
                <span className="text-xs uppercase tracking-[0.2em]">{eventTypes?.[inv.type]?.label || inv.type}</span>
                {!inv.is_published && (
                  <span className="ml-auto rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">Draft</span>
                )}
              </div>
              <p className="mt-3 font-display text-2xl">{inv.slug}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-fg-soft">
                <span className="inline-flex items-center gap-1.5">
                  <ThemeSwatch theme={inv.theme} />
                  {preset?.name || 'Custom theme'}
                </span>
                {layoutLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={11} /> {layoutLabel}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={`/admin/invitations/${inv.id}`}
                  className="rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
                >
                  Edit
                </Link>
                <Link
                  to={`/admin/invitations/${inv.id}/rsvps`}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
                >
                  <Users size={12} /> RSVPs
                </Link>
                <Link
                  to={`/admin/invitations/${inv.id}/wishes`}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
                >
                  <MessageSquare size={12} /> Wishes
                </Link>
                <a
                  href={whatsappShareUrl(inv.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
                >
                  <Share2 size={12} /> Share
                </a>
                <a
                  href={`/i/${inv.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-accent"
                >
                  <ExternalLink size={12} /> View
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {meta && lastPage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs uppercase tracking-[0.15em] text-fg-soft">
            Page {meta.current_page} of {lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="inline-flex items-center gap-1 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
