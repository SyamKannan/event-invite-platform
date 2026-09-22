// INVITATION EDITOR — tabbed editor for every module of one invitation:
// Basics, People, Date & Venue, Schedule, Story, Gallery, Theme & Motion,
// Contact. Each tab saves independently against its own nested API endpoint,
// except Basics/People/Date & Venue/Theme/Contact which all go through one
// PUT (they all live on the Invitation + InvitationDetail rows).
//
// The active tab lives in the URL (?tab=...) rather than plain component
// state, so it survives any remount (e.g. after a save triggers a refetch)
// instead of silently resetting back to the first tab.
//
// Every save/upload reports through the editor toast (EditorContext): a
// green "Saved", or the API's actual validation message in red — nothing
// fails silently. Tabs with a form report whether they have unsaved edits,
// and switching tab / leaving the page asks first.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Check, ExternalLink, GripVertical, Plus, Trash2, Upload, X } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  adminGetInvitation, adminUpdateInvitation,
  adminCreateScheduleEvent, adminUpdateScheduleEvent, adminDeleteScheduleEvent,
  adminCreateMilestone, adminUpdateMilestone, adminDeleteMilestone,
  adminCreateGalleryImage, adminUpdateGalleryImage, adminDeleteGalleryImage, adminReorderGalleryImages,
  adminUploadFile, adminListClients, adminCreateClient, adminUpdateClient, adminDeleteClient,
  errorMessage, UPLOAD_LIMITS_MB,
} from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { findThemePreset, THEME_PRESETS } from './themePresets.js';
import { ANIMATION_PRESETS } from '../lib/animationPresets.js';
import { MapPicker } from './MapPicker.jsx';
import { ENVELOPE_ANIMATION_LABELS } from '../components/envelope/registry.js';
import { loadEventTypes } from '../lib/eventTypes.js';
import { STORY_LAYOUTS } from '../lib/storyLayouts.js';

// Tabs that always apply regardless of event type, plus the module each
// content tab requires — a tab is hidden unless the invitation's event type
// registry entry declares that module. Basics/People/Theme & Motion/Contact
// are structural (every type has people to configure and a theme), so they
// have no module requirement.
const ALL_TABS = [
  { name: 'Basics' },
  { name: 'People' },
  { name: 'Date & Venue' },
  { name: 'Schedule', module: 'schedule' },
  { name: 'Story', module: 'story' },
  { name: 'Gallery', module: 'gallery' },
  { name: 'Theme & Motion' },
  { name: 'Contact' },
];

// ---- editor-wide context: toast + unsaved-changes tracking -----------------

const EditorContext = createContext(null);

function useEditor() {
  return useContext(EditorContext);
}

// Report this tab's unsaved state to the editor shell.
function useReportDirty(dirty) {
  const { setDirty } = useEditor();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}

// Wraps an async action: tracks pending state and routes success/failure to
// the toast. Returns [pending, run]; run(fn, { silent }) resolves to fn's
// result, or undefined if it threw.
function useAction() {
  const { notify } = useEditor();
  const [pending, setPending] = useState(false);
  const run = useCallback(async (fn, { silent = false } = {}) => {
    setPending(true);
    try {
      const result = await fn();
      if (!silent) notify.saved();
      return result;
    } catch (err) {
      notify.failed(err);
      return undefined;
    } finally {
      setPending(false);
    }
  }, [notify]);
  return [pending, run];
}

// ---- date helpers ---------------------------------------------------------
//
// The API stores event_date as a UTC instant. <input type="datetime-local">
// works in the admin's own local time, so convert both ways — the admin
// types "4:00 PM" and every guest's countdown hits that same moment.

function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function todayLocal() {
  return isoToLocalInput(new Date().toISOString()).slice(0, 10);
}

let draftCounter = 0;
function draftId() {
  draftCounter += 1;
  return `draft-${draftCounter}`;
}
const isDraft = (row) => typeof row.id === 'string' && row.id.startsWith('draft-');

// Strip client-only fields before sending a row to the API.
function payloadOf(row) {
  const { id, invitation_id, created_at, updated_at, _dirty, image_url, ...rest } = row;
  return rest;
}

// ---- the editor shell ------------------------------------------------------

export default function InvitationEditor() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  const [toast, setToast] = useState(null); // { kind: 'saved'|'error', message }
  const [loadFailed, setLoadFailed] = useState(false);
  const [eventTypes, setEventTypes] = useState(null);
  const dirtyRef = useRef(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    loadEventTypes().then(setEventTypes).catch(() => {});
  }, []);

  const tab = searchParams.get('tab') || 'Basics';

  // Editing stays with the platform admin — a client who navigates here
  // directly (or types the URL) never fetches the editor payload at all
  // (skipping straight to the redirect below), so a client can't get stuck
  // on a permanent "Loading…" screen behind a 403. The real security
  // boundary is server-side (every write endpoint is admin-only); this is
  // just about landing them somewhere useful without an extra failed
  // request. `loadFailed` covers any other case the backend rejects (e.g.
  // an invitation that no longer exists) so this never hangs indefinitely.
  useEffect(() => {
    if (user.role === 'client') return;
    adminGetInvitation(id).then(setInvitation).catch(() => setLoadFailed(true));
  }, [id, user.role]);

  // Warn before closing/reloading the page with unsaved edits.
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const showToast = useCallback((next) => {
    clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), next.kind === 'error' ? 6000 : 2000);
  }, []);

  const context = useMemo(() => ({
    notify: {
      saved: () => showToast({ kind: 'saved', message: 'Saved' }),
      failed: (err) => showToast({ kind: 'error', message: errorMessage(err) }),
    },
    setDirty: (dirty) => { dirtyRef.current = dirty; },
  }), [showToast]);

  if (user.role === 'client') {
    return <Navigate to={`/admin/invitations/${id}/rsvps`} replace />;
  }

  if (loadFailed) {
    return <Navigate to="/admin" replace />;
  }

  if (!invitation) return <p className="text-fg-soft">Loading…</p>;

  function setTab(next) {
    if (next === tab) return;
    if (dirtyRef.current && !window.confirm('You have unsaved changes on this tab. Leave without saving?')) return;
    dirtyRef.current = false;
    setSearchParams({ tab: next });
  }

  async function refresh() {
    try {
      setInvitation(await adminGetInvitation(id));
    } catch (err) {
      context.notify.failed(err);
    }
  }

  // Merge a PUT response (which carries detail + people) into local state.
  function merge(updated) {
    setInvitation((inv) => ({ ...inv, ...updated }));
  }

  // Modules this invitation's event type doesn't declare stay hidden — not
  // just cosmetically: their fields would either save data that never
  // renders publicly (Schedule/Gallery for a type without that module) or,
  // for Story, submit a story_layout value against a per-type allow-list
  // that's empty for types with no story module (validation would reject
  // it). Falls back to showing every tab until eventTypes has loaded, so the
  // editor never flashes an incomplete tab bar before the fetch resolves.
  const modules = eventTypes?.[invitation.type]?.modules;
  const visibleTabs = ALL_TABS.filter((t) => !t.module || !modules || modules.includes(t.module));
  const effectiveTab = visibleTabs.some((t) => t.name === tab) ? tab : 'Basics';

  return (
    <EditorContext.Provider value={context}>
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{invitation.slug}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${invitation.is_published ? 'bg-accent/20 text-accent' : 'bg-fg/10 text-fg-soft'}`}>
            {invitation.is_published ? 'Published' : 'Draft'}
          </span>
          <a
            href={`/i/${invitation.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-accent"
          >
            <ExternalLink size={12} /> {invitation.is_published ? 'View live' : 'Preview (publish to share)'}
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-1 border-b border-accent/15 pb-2" role="tablist">
          {visibleTabs.map(({ name: t }) => (
            <button
              key={t}
              role="tab"
              aria-selected={effectiveTab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                effectiveTab === t ? 'bg-accent text-white' : 'text-fg-soft hover:bg-accent/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {effectiveTab === 'Basics' && <BasicsTab invitation={invitation} onSaved={merge} />}
          {effectiveTab === 'People' && <PeopleTab invitation={invitation} eventTypes={eventTypes} onSaved={merge} />}
          {effectiveTab === 'Date & Venue' && <DateVenueTab invitation={invitation} onSaved={merge} />}
          {effectiveTab === 'Schedule' && <ScheduleTab invitation={invitation} onChange={refresh} />}
          {effectiveTab === 'Story' && <StoryTab invitation={invitation} eventTypes={eventTypes} onChange={refresh} onSaved={merge} />}
          {effectiveTab === 'Gallery' && <GalleryTab invitation={invitation} onChange={refresh} />}
          {effectiveTab === 'Theme & Motion' && <ThemeMotionTab invitation={invitation} onSaved={merge} />}
          {effectiveTab === 'Contact' && <ContactTab invitation={invitation} onSaved={merge} />}
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </EditorContext.Provider>
  );
}

// ---- floating toast --------------------------------------------------------
//
// Fixed to the viewport (not inline in the page flow) so it's visible no
// matter how far down a long form the admin has scrolled when they save.

function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          role={toast.kind === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] ${
            toast.kind === 'error' ? 'bg-rose' : 'bg-accent'
          }`}
        >
          {toast.kind === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" />}
          <span>{toast.message}</span>
          {toast.kind === 'error' && (
            <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-2 shrink-0 opacity-80 hover:opacity-100">
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- shared field primitives ------------------------------------------------
//
// This editor's page background is the dark theme (bg-bg), not a cream
// card — so labels/secondary text here must use the ivory-on-dark tokens
// (text-fg-soft), not text-muted (which is tuned for text-on-cream-card and
// reads as nearly invisible on a dark background). Only text that sits
// inside an actual bg-white/bg-surface card should use text-muted/text-ink.

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.2em] text-fg-soft">{label}</span>
      <div className="mt-2 min-w-0">{children}</div>
      {hint && <span className="mt-1 block text-xs text-fg-soft/80">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';

function SaveButton({ pending, dirty = true, children = 'Save' }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start rounded-full bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold disabled:opacity-50"
    >
      {pending ? 'Saving…' : children}
      {!pending && dirty && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-white align-middle" aria-label="unsaved changes" />}
    </button>
  );
}

// Upload button + preview + remove, for one stored file. `kind` is 'image'
// or 'audio'. The parent owns the path; this owns the upload itself (so
// every upload shows progress and reports errors the same way).
function FileField({ label, kind = 'image', path, url, invitationId, onChange }) {
  const { notify } = useEditor();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await adminUploadFile(invitationId, file, kind);
      onChange(uploaded.path, uploaded.url);
    } catch (err) {
      notify.failed(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Field label={label} hint={`Max ${UPLOAD_LIMITS_MB[kind]} MB. Remember to save after uploading.`}>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {path && kind === 'image' && url && (
          <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-accent/20" />
        )}
        {path && kind === 'audio' && url && (
          <audio src={url} controls preload="none" className="h-9 max-w-[220px]" />
        )}
        {path && !url && <span className="min-w-0 flex-1 truncate text-xs text-fg-soft" title={path}>{path}</span>}
        <label className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10 hover:text-accent ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
          <Upload size={12} /> {uploading ? 'Uploading…' : path ? 'Replace' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            accept={kind === 'audio' ? 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.m4a,.ogg,.wav' : 'image/*'}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </label>
        {path && !uploading && (
          <button
            type="button"
            onClick={() => onChange('', null)}
            className="inline-flex shrink-0 items-center gap-1 text-xs uppercase tracking-[0.15em] text-rose transition hover:opacity-70"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>
    </Field>
  );
}

// JSON-compare a form against its initial snapshot.
function useFormDirty(form, initial) {
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useReportDirty(dirty);
  return dirty;
}

// ---- Basics ------------------------------------------------------------------

function BasicsTab({ invitation, onSaved }) {
  const { user } = useAdminAuth();
  const initial = useMemo(() => ({
    slug: invitation.slug,
    is_published: invitation.is_published,
    meta_title: invitation.meta_title || '',
    meta_description: invitation.meta_description || '',
  }), [invitation]);
  const [form, setForm] = useState(initial);
  const dirty = useFormDirty(form, initial);
  const [pending, run] = useAction();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.slug !== invitation.slug && invitation.is_published && !window.confirm(
      `Change the link from /i/${invitation.slug} to /i/${form.slug}?\n\nEvery link you've already shared will stop working.`,
    )) return;

    const updated = await run(() => adminUpdateInvitation(invitation.id, form));
    if (updated) {
      setForm({
        slug: updated.slug,
        is_published: updated.is_published,
        meta_title: updated.meta_title || '',
        meta_description: updated.meta_description || '',
      });
      onSaved(updated);
    }
  }

  return (
    <div className="grid max-w-xl gap-8">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label="Slug (URL)" hint="Letters, numbers, dashes and underscores. Changing it breaks links already shared.">
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            pattern="[A-Za-z0-9_-]+"
            maxLength={80}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
            className="h-4 w-4"
          />
          <span className="text-sm text-fg-soft">Published (visible at the public link)</span>
        </label>
        <Field label="Page title" hint="Shown in the browser tab and link previews. Leave blank to use the names.">
          <input value={form.meta_title} onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))} maxLength={255} className={inputClass} />
        </Field>
        <Field label="Page description" hint={`${form.meta_description.length}/500`}>
          <textarea value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} rows={3} maxLength={500} className={inputClass} />
        </Field>
        <SaveButton pending={pending} dirty={dirty} />
      </form>

      {user.role === 'admin' && <OwnerSection invitation={invitation} onSaved={onSaved} />}
    </div>
  );
}

// ---- Owner (admin-only: which client account this invitation belongs to) ----
//
// A client logs in separately from the super-admin (their own
// username/password, same /admin/login form) and only ever sees invitations
// where owner_id matches their user id — this is where that assignment
// happens, plus password resets / removal for that client account.

function OwnerSection({ invitation, onSaved }) {
  const { notify } = useEditor();
  const [clients, setClients] = useState(null);
  const [selectedId, setSelectedId] = useState(invitation.owner_id ? String(invitation.owner_id) : '');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', username: '', email: '', password: '' });
  const [pending, run] = useAction();

  useEffect(() => {
    adminListClients().then(setClients).catch((err) => {
      setClients([]);
      notify.failed(err);
    });
  }, [notify]);

  const selectedClient = clients?.find((c) => String(c.id) === selectedId);

  async function assignOwner(ownerId) {
    const updated = await run(() => adminUpdateInvitation(invitation.id, { owner_id: ownerId ? Number(ownerId) : null }));
    if (updated) onSaved(updated);
    else setSelectedId(invitation.owner_id ? String(invitation.owner_id) : '');
  }

  function handleSelectChange(e) {
    setSelectedId(e.target.value);
    assignOwner(e.target.value);
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    const client = await run(() => adminCreateClient({ ...newClient, email: newClient.email || null }), { silent: true });
    if (!client) return;
    setClients((list) => [...(list || []), client]);
    setSelectedId(String(client.id));
    setCreatingNew(false);
    setNewClient({ name: '', username: '', email: '', password: '' });
    await assignOwner(client.id);
  }

  async function handleResetPassword() {
    const password = window.prompt(`New password for @${selectedClient.username} (min 8 characters).\nThey'll be signed out of every device.`);
    if (password === null) return;
    if (password.length < 8) {
      notify.failed({ message: 'Password must be at least 8 characters.' });
      return;
    }
    await run(() => adminUpdateClient(selectedClient.id, { password }));
  }

  async function handleDeleteClient() {
    if (!window.confirm(`Delete the client account @${selectedClient.username}?\n\nThey won't be able to log in, and every invitation they own becomes admin-only. The invitations themselves are kept.`)) return;
    const done = await run(async () => { await adminDeleteClient(selectedClient.id); return true; });
    if (done) {
      setClients((list) => list.filter((c) => c.id !== selectedClient.id));
      setSelectedId('');
      onSaved({ owner_id: null });
    }
  }

  return (
    <div className="rounded-2xl border border-accent/15 p-5">
      <h3 className="text-sm uppercase tracking-[0.2em] text-fg-soft">Client owner</h3>
      <p className="mt-1 text-xs text-fg-soft">
        The client account that can log in and view this invitation's RSVPs and wishes (view-only).
      </p>

      {clients === null ? (
        <p className="mt-4 text-sm text-fg-soft">Loading…</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select value={selectedId} onChange={handleSelectChange} disabled={pending} className={`${inputClass} sm:max-w-xs`}>
            <option value="">— No owner (admin-only) —</option>
            {clients.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name} (@{c.username})</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setCreatingNew((v) => !v)}
            className="rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
          >
            {creatingNew ? 'Cancel' : '+ New client'}
          </button>
        </div>
      )}

      {selectedClient && !creatingNew && (
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={handleResetPassword} disabled={pending} className="text-xs uppercase tracking-[0.15em] text-fg-soft underline-offset-4 hover:text-accent hover:underline">
            Reset password
          </button>
          <button type="button" onClick={handleDeleteClient} disabled={pending} className="text-xs uppercase tracking-[0.15em] text-rose underline-offset-4 hover:underline">
            Delete client account
          </button>
        </div>
      )}

      {creatingNew && (
        <form onSubmit={handleCreateClient} className="mt-4 grid gap-3 rounded-xl border border-accent/10 p-4">
          <Field label="Client name">
            <input
              value={newClient.name}
              onChange={(e) => setNewClient((c) => ({ ...c, name: e.target.value }))}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Username (used to log in)">
            <input
              type="text"
              value={newClient.username}
              onChange={(e) => setNewClient((c) => ({ ...c, username: e.target.value }))}
              required
              pattern="[A-Za-z0-9_-]+"
              autoCapitalize="none"
              autoCorrect="off"
              className={inputClass}
            />
          </Field>
          <Field label="Email (optional, for your own reference)">
            <input
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Share it with the client privately.">
            <input
              type="text"
              value={newClient.password}
              onChange={(e) => setNewClient((c) => ({ ...c, password: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <SaveButton pending={pending} dirty={false}>Create &amp; assign</SaveButton>
        </form>
      )}
    </div>
  );
}

// ---- People (roles driven by the invitation's event type registry entry) -----
//
// Wedding gets a bride/groom show-hide fieldset pair + connector; birthday
// gets a single celebrant fieldset + age/turning-text. Any other type
// renders one fieldset per registry-declared role, generically. Names may
// be left blank (e.g. a hidden side) — the API stores them as empty.

function PeopleTab({ invitation, eventTypes, onSaved }) {
  const isWedding = invitation.type === 'wedding';
  const isBirthday = invitation.type === 'birthday';
  const roles = eventTypes ? eventTypes[invitation.type]?.roles || {} : null;

  const initial = useMemo(() => {
    const byRole = {};
    for (const p of invitation.people || []) {
      byRole[p.role] = { firstName: p.first_name || '', parentsText: p.parents_text || '', photo: p.photo || '', photoUrl: p.photo_url || null };
    }
    const d = invitation.detail || {};
    return {
      people: byRole,
      connector: d.connector || '&',
      showBride: d.show_bride ?? true,
      showGroom: d.show_groom ?? true,
      celebrantAge: d.celebrant_age ?? '',
      turningText: d.celebrant_turning_text || '',
    };
  }, [invitation]);

  const [form, setForm] = useState(initial);
  const dirty = useFormDirty(form, initial);
  const [pending, run] = useAction();

  const roleKeys = isWedding ? ['bride', 'groom'] : isBirthday ? ['celebrant'] : Object.keys(roles || {});
  const roleLabel = (role) => roles?.[role] || role.charAt(0).toUpperCase() + role.slice(1);

  function setPerson(role, field, value) {
    setForm((f) => ({ ...f, people: { ...f.people, [role]: { ...(f.people[role] || {}), [field]: value } } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const people = roleKeys.map((role) => ({
      role,
      first_name: form.people[role]?.firstName?.trim() || '',
      parents_text: isBirthday ? null : form.people[role]?.parentsText || null,
      photo: form.people[role]?.photo || null,
    }));

    let detail;
    if (isWedding) detail = { connector: form.connector || '&', show_bride: form.showBride, show_groom: form.showGroom };
    if (isBirthday) detail = { celebrant_age: form.celebrantAge === '' ? null : Number(form.celebrantAge), celebrant_turning_text: form.turningText || null };

    const updated = await run(() => adminUpdateInvitation(invitation.id, { people, ...(detail ? { detail } : {}) }));
    if (updated) onSaved(updated);
  }

  function personFieldset(role, { hidden = false, toggle = null, showParents = true } = {}) {
    const person = form.people[role] || {};
    return (
      <fieldset key={role} className={`grid min-w-0 gap-3 rounded-2xl border border-accent/15 p-4 transition-opacity ${hidden ? 'opacity-50' : ''}`}>
        <legend className="flex items-center gap-2 px-1 text-xs uppercase tracking-[0.2em] text-accent">
          {toggle}
          {roleLabel(role)}
        </legend>
        <Field label="First name">
          <input value={person.firstName || ''} onChange={(e) => setPerson(role, 'firstName', e.target.value)} maxLength={60} className={inputClass} />
        </Field>
        {showParents && (
          <Field label="Parents text" hint="e.g. Daughter of Mr. & Mrs. Nair">
            <input value={person.parentsText || ''} onChange={(e) => setPerson(role, 'parentsText', e.target.value)} maxLength={255} className={inputClass} />
          </Field>
        )}
        <FileField
          label="Photo"
          path={person.photo}
          url={person.photoUrl}
          invitationId={invitation.id}
          onChange={(path, url) => setForm((f) => ({
            ...f,
            people: { ...f.people, [role]: { ...(f.people[role] || {}), photo: path, photoUrl: url } },
          }))}
        />
      </fieldset>
    );
  }

  function showToggle(key) {
    return (
      <label className="flex items-center gap-1.5 normal-case tracking-normal text-fg-soft">
        <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} className="h-3.5 w-3.5" />
        Show
      </label>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      {isWedding && (
        <div className="grid gap-6 sm:grid-cols-2">
          {personFieldset('bride', { hidden: !form.showBride, toggle: showToggle('showBride') })}
          {personFieldset('groom', { hidden: !form.showGroom, toggle: showToggle('showGroom') })}
          {form.showBride && form.showGroom && (
            <Field label="Connector (e.g. &)">
              <input value={form.connector} onChange={(e) => setForm((f) => ({ ...f, connector: e.target.value }))} maxLength={10} className={inputClass} style={{ maxWidth: 100 }} />
            </Field>
          )}
          {!form.showBride && !form.showGroom && (
            <p className="text-sm text-rose sm:col-span-2">
              Both sides are hidden — the public page will show no couple name. Enable at least one.
            </p>
          )}
        </div>
      )}

      {isBirthday && (
        <div className="grid gap-4">
          {personFieldset('celebrant', { showParents: false })}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <input type="number" min={0} max={150} value={form.celebrantAge} onChange={(e) => setForm((f) => ({ ...f, celebrantAge: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Turning text (e.g. Turning 30)">
              <input value={form.turningText} onChange={(e) => setForm((f) => ({ ...f, turningText: e.target.value }))} maxLength={60} className={inputClass} />
            </Field>
          </div>
        </div>
      )}

      {!isWedding && !isBirthday && (
        roles === null ? (
          <p className="text-sm text-fg-soft">Loading…</p>
        ) : roleKeys.length === 0 ? (
          <p className="text-sm text-fg-soft">This event type has no people to configure.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {roleKeys.map((role) => personFieldset(role))}
          </div>
        )
      )}

      {(isWedding || isBirthday || roleKeys.length > 0) && <SaveButton pending={pending} dirty={dirty} />}
    </form>
  );
}

// ---- Date & Venue --------------------------------------------------------------

function DateVenueTab({ invitation, onSaved }) {
  const initial = useMemo(() => {
    const d = invitation.detail || {};
    return {
      event_date: isoToLocalInput(d.event_date),
      display_date: d.display_date || '',
      display_time: d.display_time || '',
      display_location: d.display_location || '',
      hero_image: d.hero_image || '',
      hero_image_url: d.hero_image_url || null,
      hero_overline: d.hero_overline || '',
      hero_tagline: d.hero_tagline || '',
      envelope_overline: d.envelope_overline || '',
      envelope_cta: d.envelope_cta || '',
      envelope_animation: d.envelope_animation || 'swing-doors',
    };
  }, [invitation]);
  const [form, setForm] = useState(initial);
  const dirty = useFormDirty(form, initial);
  const [pending, run] = useAction();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { hero_image_url, ...detail } = form;
    const updated = await run(() => adminUpdateInvitation(invitation.id, {
      detail: { ...detail, event_date: localInputToIso(form.event_date) },
    }));
    if (updated) onSaved(updated);
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
      <Field label="Event date & time" hint={`In your timezone (${tz}). Drives the countdown and the date reveal; leave empty to hide both.`}>
        <input type="datetime-local" value={form.event_date} onChange={set('event_date')} className={inputClass} />
      </Field>
      <Field label="Display date (e.g. Saturday, 14th June 2026)"><input value={form.display_date} onChange={set('display_date')} maxLength={120} className={inputClass} /></Field>
      <Field label="Display time (e.g. 4:00 PM onwards)"><input value={form.display_time} onChange={set('display_time')} maxLength={60} className={inputClass} /></Field>
      <Field label="Location"><input value={form.display_location} onChange={set('display_location')} maxLength={120} className={inputClass} /></Field>
      <FileField
        label="Hero background image"
        path={form.hero_image}
        url={form.hero_image_url}
        invitationId={invitation.id}
        onChange={(path, url) => setForm((f) => ({ ...f, hero_image: path, hero_image_url: url }))}
      />
      <Field label="Hero overline"><input value={form.hero_overline} onChange={set('hero_overline')} maxLength={120} className={inputClass} /></Field>
      <Field label="Hero tagline" hint="A short line shown under the names."><input value={form.hero_tagline} onChange={set('hero_tagline')} maxLength={120} className={inputClass} /></Field>
      <Field label="Envelope overline"><input value={form.envelope_overline} onChange={set('envelope_overline')} maxLength={120} className={inputClass} /></Field>
      <Field label="Envelope button text"><input value={form.envelope_cta} onChange={set('envelope_cta')} maxLength={60} className={inputClass} /></Field>
      <Field label="Opening style">
        <select value={form.envelope_animation} onChange={set('envelope_animation')} className={inputClass}>
          {Object.entries(ENVELOPE_ANIMATION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </Field>
      <SaveButton pending={pending} dirty={dirty} />
    </form>
  );
}

// ---- repeatable rows (schedule events, milestones) --------------------------
//
// "Add" creates a local draft row only — nothing reaches the API (or the
// live public page) until the admin fills it in and clicks Save.

function useRows(initialRows) {
  const [rows, setRows] = useState(initialRows);
  useReportDirty(rows.some((r) => r._dirty || isDraft(r)));

  function update(id, key, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value, _dirty: true } : r)));
  }
  function replace(id, next) {
    setRows((rs) => rs.map((r) => (r.id === id ? next : r)));
  }
  function remove(id) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function add(row) {
    setRows((rs) => [...rs, { ...row, id: draftId() }]);
  }
  return { rows, update, replace, remove, add };
}

function RowActions({ row, pending, onSave, onDelete }) {
  return (
    <div className="flex items-center gap-2 sm:col-span-2">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold disabled:opacity-50"
      >
        {pending ? 'Saving…' : isDraft(row) ? 'Save new' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full border border-rose/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-rose transition hover:bg-rose/10 disabled:opacity-50"
      >
        <Trash2 size={14} /> {isDraft(row) ? 'Discard' : 'Delete'}
      </button>
      {(row._dirty || isDraft(row)) && <span className="text-xs text-fg-soft">Unsaved</span>}
    </div>
  );
}

// ---- Schedule (repeatable events, with a map/location picker) ------------------

const TEAM_OPTIONS = [
  { value: '', label: 'Both sides / shared' },
  { value: 'groom', label: 'Groom side' },
  { value: 'bride', label: 'Bride side' },
];

function ScheduleTab({ invitation, onChange }) {
  const isWedding = invitation.type === 'wedding';
  const { rows: events, update, replace, remove, add } = useRows(invitation.schedule_events || []);
  const [pendingId, setPendingId] = useState(null);
  const [, run] = useAction();

  async function handleSave(ev) {
    setPendingId(ev.id);
    const saved = await run(() => (isDraft(ev)
      ? adminCreateScheduleEvent(invitation.id, payloadOf(ev))
      : adminUpdateScheduleEvent(invitation.id, ev.id, payloadOf(ev))));
    setPendingId(null);
    if (saved) {
      replace(ev.id, saved);
      onChange();
    }
  }

  async function handleDelete(ev) {
    if (isDraft(ev)) {
      remove(ev.id);
      return;
    }
    if (!window.confirm(`Delete "${ev.title}"?`)) return;
    setPendingId(ev.id);
    const done = await run(async () => { await adminDeleteScheduleEvent(invitation.id, ev.id); return true; });
    setPendingId(null);
    if (done) {
      remove(ev.id);
      onChange();
    }
  }

  return (
    <div className="grid gap-4">
      {events.length === 0 && <p className="text-sm text-fg-soft">No events yet. The schedule section stays hidden until you add one.</p>}
      {events.map((ev) => (
        <div key={ev.id} className="grid gap-3 rounded-2xl border border-accent/15 p-5 sm:grid-cols-2">
          <Field label="Title"><input value={ev.title} onChange={(e) => update(ev.id, 'title', e.target.value)} maxLength={80} required className={inputClass} /></Field>
          {isWedding ? (
            <Field label="Side">
              <select value={ev.team || ''} onChange={(e) => update(ev.id, 'team', e.target.value || null)} className={inputClass}>
                {TEAM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                {ev.team && !TEAM_OPTIONS.some((o) => o.value === ev.team?.toLowerCase()) && (
                  <option value={ev.team}>{ev.team} (shown on both sides)</option>
                )}
              </select>
            </Field>
          ) : <div className="hidden sm:block" />}
          <Field label="Date"><input type="date" value={ev.event_date || ''} onChange={(e) => update(ev.id, 'event_date', e.target.value)} required className={inputClass} /></Field>
          <Field label="Time" hint='e.g. "4:00 PM" — used for "Add to calendar"'><input value={ev.event_time || ''} onChange={(e) => update(ev.id, 'event_time', e.target.value)} maxLength={60} className={inputClass} /></Field>
          <Field label="Venue"><input value={ev.venue || ''} onChange={(e) => update(ev.id, 'venue', e.target.value)} maxLength={120} className={inputClass} /></Field>
          <Field label="Address"><input value={ev.address || ''} onChange={(e) => update(ev.id, 'address', e.target.value)} maxLength={255} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Location (for map + QR code)">
              <MapPicker value={ev.map_url} onChange={(url) => update(ev.id, 'map_url', url)} />
            </Field>
          </div>
          <Field label="Dresscode"><input value={ev.dresscode || ''} onChange={(e) => update(ev.id, 'dresscode', e.target.value)} maxLength={80} className={inputClass} /></Field>
          <RowActions row={ev} pending={pendingId === ev.id} onSave={() => handleSave(ev)} onDelete={() => handleDelete(ev)} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => add({ title: '', event_date: todayLocal(), event_time: '', venue: '', address: '', map_url: null, dresscode: '', team: null, sort_order: events.length })}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
      >
        <Plus size={14} /> Add event
      </button>
    </div>
  );
}

// ---- Story (layout picker + milestone list, no manual x/y) --------------------

function StoryTab({ invitation, eventTypes, onChange, onSaved }) {
  const { rows: milestones, update, replace, remove, add } = useRows(invitation.milestones || []);
  const [layout, setLayout] = useState(invitation.story_layout || 'constellation');
  const [pendingId, setPendingId] = useState(null);
  const [layoutPending, run] = useAction();

  // Restricted to the layouts this event type's registry entry actually
  // allows — UpdateInvitationRequest validates story_layout against the same
  // per-type list, so offering a layout outside it would just 422 on save.
  const allowedLayouts = eventTypes?.[invitation.type]?.storyLayouts;
  const availableLayouts = allowedLayouts
    ? STORY_LAYOUTS.filter((l) => allowedLayouts.includes(l.key))
    : STORY_LAYOUTS;

  async function selectLayout(key) {
    const previous = layout;
    setLayout(key);
    const updated = await run(() => adminUpdateInvitation(invitation.id, { story_layout: key }));
    if (updated) onSaved(updated);
    else setLayout(previous);
  }

  async function handleSave(m) {
    setPendingId(m.id);
    const saved = await run(() => (isDraft(m)
      ? adminCreateMilestone(invitation.id, { ...payloadOf(m), sort_order: milestones.indexOf(m) })
      : adminUpdateMilestone(invitation.id, m.id, payloadOf(m))));
    setPendingId(null);
    if (saved) {
      replace(m.id, { ...saved, image_url: m.image_url });
      onChange();
    }
  }

  async function handleDelete(m) {
    if (isDraft(m)) {
      remove(m.id);
      return;
    }
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    setPendingId(m.id);
    const done = await run(async () => { await adminDeleteMilestone(invitation.id, m.id); return true; });
    setPendingId(null);
    if (done) {
      remove(m.id);
      onChange();
    }
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Layout</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableLayouts.map((l) => (
            <button
              key={l.key}
              type="button"
              disabled={layoutPending}
              onClick={() => selectLayout(l.key)}
              aria-pressed={layout === l.key}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                layout === l.key ? 'border-accent bg-accent/10' : 'border-accent/15 hover:border-accent/40'
              }`}
            >
              <p className="font-display text-lg text-fg">{l.name}</p>
              <p className="mt-1 text-xs text-fg-soft">{l.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {milestones.length === 0 && <p className="text-sm text-fg-soft">No milestones yet. The story section stays hidden until you add one.</p>}
        {milestones.map((m) => (
          <div key={m.id} className="grid gap-3 rounded-2xl border border-accent/15 p-5 sm:grid-cols-2">
            <Field label="Date label" hint='e.g. "June 2019"'><input value={m.date_label || ''} onChange={(e) => update(m.id, 'date_label', e.target.value)} maxLength={60} className={inputClass} /></Field>
            <Field label="Title"><input value={m.title || ''} onChange={(e) => update(m.id, 'title', e.target.value)} maxLength={80} className={inputClass} /></Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea value={m.description || ''} onChange={(e) => update(m.id, 'description', e.target.value)} rows={2} maxLength={1000} className={inputClass} />
              </Field>
            </div>
            <FileField
              label="Photo"
              path={m.image}
              url={m.image_url}
              invitationId={invitation.id}
              onChange={(path, url) => {
                update(m.id, 'image', path);
                update(m.id, 'image_url', url);
              }}
            />
            <RowActions row={m} pending={pendingId === m.id} onSave={() => handleSave(m)} onDelete={() => handleDelete(m)} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => add({ date_label: '', title: '', description: '', image: null, image_url: null })}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
        >
          <Plus size={14} /> Add milestone
        </button>
      </div>
    </div>
  );
}

// ---- Gallery (multi-image upload, drag-to-reorder) ------------------------------
//
// Images upload in whatever order the admin picks them, but sort_order is
// what the public Gallery.jsx actually renders by — so reordering here has to
// persist, not just rearrange the local list. Drag state is optimistic (the
// grid reorders instantly); a failed PUT reverts to the last known-good order
// rather than leaving the UI silently out of sync with the database.

function GalleryTab({ invitation, onChange }) {
  const { notify } = useEditor();
  const [images, setImages] = useState(invitation.gallery_images || []);
  const [progress, setProgress] = useState(null); // { done, total } while uploading
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setProgress({ done: 0, total: files.length });
    let failures = 0;

    // Sequential, so images land in the order they were picked.
    for (const file of files) {
      try {
        const { path, url } = await adminUploadFile(invitation.id, file, 'image');
        // Default alt text stays generic rather than the raw filename (e.g.
        // "WhatsApp Image 2026-...jpeg") — the admin can personalize it.
        const created = await adminCreateGalleryImage(invitation.id, { image: path, alt: 'Gallery photo', sort_order: images.length });
        setImages((imgs) => [...imgs, { ...created, image_url: url }]);
      } catch (err) {
        failures += 1;
        notify.failed(err);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setProgress(null);
    if (failures === 0) notify.saved();
    onChange();
  }

  async function saveAlt(image, alt) {
    if ((image.alt || '') === alt) return;
    try {
      await adminUpdateGalleryImage(invitation.id, image.id, { image: image.image, alt, span: image.span ?? null });
      notify.saved();
    } catch (err) {
      notify.failed(err);
    }
  }

  async function handleDelete(image) {
    if (!window.confirm('Delete this photo from the gallery?')) return;
    try {
      await adminDeleteGalleryImage(invitation.id, image.id);
      setImages((imgs) => imgs.filter((im) => im.id !== image.id));
      onChange();
    } catch (err) {
      notify.failed(err);
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);
    const previous = images;

    setImages(reordered);
    try {
      await adminReorderGalleryImages(invitation.id, reordered.map((img) => img.id));
      notify.saved();
    } catch (err) {
      setImages(previous);
      notify.failed(err);
    }
  }

  return (
    <div>
      <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent ${progress ? 'pointer-events-none opacity-60' : ''}`}>
        <Upload size={14} /> {progress ? `Uploading ${progress.done}/${progress.total}…` : 'Upload photos'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      </label>
      <p className="mt-2 text-xs text-fg-soft">You can select several photos at once (max {UPLOAD_LIMITS_MB.image} MB each).</p>

      {images.length > 1 && (
        <p className="mt-3 text-xs text-fg-soft">Drag a photo by its handle to reorder the gallery. Captions save when you click away.</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {images.map((img) => (
              <SortableGalleryImage
                key={img.id}
                image={img}
                onAltSave={(alt) => {
                  setImages((imgs) => imgs.map((im) => (im.id === img.id ? { ...im, alt } : im)));
                  saveAlt(img, alt);
                }}
                onDelete={() => handleDelete(img)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableGalleryImage({ image, onAltSave, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const [alt, setAlt] = useState(image.alt || '');
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-accent/15 p-2">
      <div className="relative">
        {image.image_url ? (
          <img src={image.image_url} alt={image.alt || ''} className="h-28 w-full rounded-lg object-cover" loading="lazy" />
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-lg bg-fg/5 text-xs text-fg-soft">No preview</div>
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 flex cursor-grab items-center justify-center rounded-full bg-black/50 p-1 text-white active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </div>
      <input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => onAltSave(alt.trim())}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        maxLength={120}
        placeholder="Caption"
        aria-label="Caption"
        className="mt-2 w-full rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink outline-none focus:border-accent"
      />
      <button type="button" onClick={onDelete} className="mt-2 inline-flex items-center gap-1 text-xs text-rose">
        <Trash2 size={12} /> Delete
      </button>
    </div>
  );
}

// ---- Theme & Motion (curated presets + animation intensity) --------------------

function ThemeMotionTab({ invitation, onSaved }) {
  const [themeKey, setThemeKey] = useState(() => findThemePreset(invitation.theme)?.key ?? null);
  const [intensity, setIntensity] = useState(invitation.animation_intensity || 'balanced');
  const [pending, run] = useAction();

  async function selectTheme(preset) {
    const previous = themeKey;
    setThemeKey(preset.key);
    // NOTE: deliberately not touching document.documentElement here. CSS
    // variables on <html> are global DOM state — writing them from the
    // admin used to leak this invitation's colors into whatever page loaded
    // next. The swatch cards show the palette; the public page (scoped per
    // slug by ThemeProvider) is the real preview.
    const updated = await run(() => adminUpdateInvitation(invitation.id, { theme: preset.theme }));
    if (updated) onSaved(updated);
    else setThemeKey(previous);
  }

  async function selectIntensity(key) {
    const previous = intensity;
    setIntensity(key);
    const updated = await run(() => adminUpdateInvitation(invitation.id, { animation_intensity: key }));
    if (updated) onSaved(updated);
    else setIntensity(previous);
  }

  return (
    <div className="grid gap-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Color theme</p>
        <p className="mt-1 text-sm text-fg-soft">
          Pick a palette — no color codes needed.
          {!themeKey && invitation.theme && ' (Current: a custom palette.)'}
          {!invitation.theme && ' (Current: the default palette.)'}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={pending}
              onClick={() => selectTheme(preset)}
              aria-pressed={themeKey === preset.key}
              className={`overflow-hidden rounded-2xl border text-left transition disabled:opacity-60 ${
                themeKey === preset.key ? 'border-accent ring-2 ring-accent/40' : 'border-accent/15 hover:border-accent/40'
              }`}
            >
              <div
                className="h-16 w-full"
                style={{
                  background: `linear-gradient(135deg, rgb(${preset.theme.bg}) 0%, rgb(${preset.theme.accent}) 55%, rgb(${preset.theme.rose}) 100%)`,
                }}
              />
              <p className="flex items-center justify-between px-3 py-2 text-sm text-fg">
                {preset.name}
                {themeKey === preset.key && <Check size={14} className="text-accent" />}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Animation intensity</p>
        <p className="mt-1 text-sm text-fg-soft">How lively should the page feel overall?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(ANIMATION_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => selectIntensity(key)}
              aria-pressed={intensity === key}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                intensity === key ? 'border-accent bg-accent/10' : 'border-accent/15 hover:border-accent/40'
              }`}
            >
              <p className="font-display text-lg text-fg">{preset.label}</p>
              <p className="mt-1 text-xs text-fg-soft">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Contact (with music upload) -----------------------------------------------

function ContactTab({ invitation, onSaved }) {
  const initial = useMemo(() => {
    const d = invitation.detail || {};
    return {
      contact_phone_primary: d.contact_phone_primary || '',
      contact_phone_secondary: d.contact_phone_secondary || '',
      contact_email: d.contact_email || '',
      contact_instagram: d.contact_instagram || '',
      music_enabled: d.music_enabled || false,
      music_src: d.music_src || '',
      music_src_url: d.music_src_url || null,
    };
  }, [invitation]);
  const [form, setForm] = useState(initial);
  const dirty = useFormDirty(form, initial);
  const [pending, run] = useAction();

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { music_src_url, ...detail } = form;
    const updated = await run(() => adminUpdateInvitation(invitation.id, {
      detail: { ...detail, music_enabled: detail.music_enabled && !!detail.music_src },
    }));
    if (updated) onSaved(updated);
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
      <Field label="Primary phone"><input type="tel" value={form.contact_phone_primary} onChange={set('contact_phone_primary')} maxLength={30} className={inputClass} /></Field>
      <Field label="Secondary phone"><input type="tel" value={form.contact_phone_secondary} onChange={set('contact_phone_secondary')} maxLength={30} className={inputClass} /></Field>
      <Field label="Email"><input type="email" value={form.contact_email} onChange={set('contact_email')} maxLength={120} className={inputClass} /></Field>
      <Field label="Instagram handle" hint="Without the @"><input value={form.contact_instagram} onChange={set('contact_instagram')} maxLength={60} className={inputClass} /></Field>
      <FileField
        label="Background music"
        kind="audio"
        path={form.music_src}
        url={form.music_src_url}
        invitationId={invitation.id}
        onChange={(path, url) => setForm((f) => ({ ...f, music_src: path, music_src_url: url, music_enabled: !!path }))}
      />
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.music_enabled}
          disabled={!form.music_src}
          onChange={(e) => setForm((f) => ({ ...f, music_enabled: e.target.checked }))}
          className="h-4 w-4"
        />
        <span className="text-sm text-fg-soft">
          Background music enabled{!form.music_src && ' (upload a track first)'}
        </span>
      </label>
      <SaveButton pending={pending} dirty={dirty} />
    </form>
  );
}
