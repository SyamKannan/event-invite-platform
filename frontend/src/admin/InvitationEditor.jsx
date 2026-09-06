// INVITATION EDITOR — tabbed editor for every module of one invitation:
// Basics, People, Date & Venue, Schedule, Story, Gallery, Theme & Motion,
// Contact. Each tab saves independently against its own nested API endpoint,
// except Basics/Date & Venue/Theme/Contact which all go through one PUT
// (they all live on the Invitation + InvitationDetail rows).
//
// The active tab lives in the URL (?tab=...) rather than plain component
// state, so it survives any remount (e.g. after a save triggers a refetch)
// instead of silently resetting back to the first tab.

import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, MapPin, Plus, Trash2, Upload } from 'lucide-react';
import {
  adminGetInvitation, adminUpdateInvitation,
  adminCreateScheduleEvent, adminUpdateScheduleEvent, adminDeleteScheduleEvent,
  adminCreateMilestone, adminUpdateMilestone, adminDeleteMilestone,
  adminCreateGalleryImage, adminUpdateGalleryImage, adminDeleteGalleryImage,
  adminUploadFile, adminListClients, adminCreateClient,
} from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { THEME_PRESETS } from './themePresets.js';
import { ANIMATION_PRESETS } from '../lib/animationPresets.js';
import { MapPicker } from './MapPicker.jsx';
import { ENVELOPE_ANIMATION_LABELS } from '../components/envelope/registry.js';

const TABS = ['Basics', 'People', 'Date & Venue', 'Schedule', 'Story', 'Gallery', 'Theme & Motion', 'Contact'];

export default function InvitationEditor() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const tab = searchParams.get('tab') || 'Basics';
  function setTab(next) {
    setSearchParams({ tab: next });
  }

  // Editing stays with the platform admin — a client who navigates here
  // directly (or types the URL) never fetches the editor payload at all
  // (skipping straight to the redirect below), so a client can't get stuck
  // on a permanent "Loading…" screen behind a 403. The real security
  // boundary is server-side (every write endpoint checks ownership); this
  // is just about landing them somewhere useful without an extra failed
  // request. `loadFailed` covers any other case the backend rejects (e.g.
  // an invitation that no longer exists) so this never hangs indefinitely.
  useEffect(() => {
    if (user.role === 'client') return;
    adminGetInvitation(id).then(setInvitation).catch(() => setLoadFailed(true));
  }, [id, user.role]);

  if (user.role === 'client') {
    return <Navigate to={`/admin/invitations/${id}/rsvps`} replace />;
  }

  if (loadFailed) {
    return <Navigate to="/admin" replace />;
  }

  function flash() {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2000);
  }

  async function refresh() {
    setInvitation(await adminGetInvitation(id));
  }

  if (!invitation) return <p className="text-fg-soft">Loading…</p>;

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <h1 className="mt-3 font-display text-3xl">{invitation.slug}</h1>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-accent/15 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
              tab === t ? 'bg-accent text-white' : 'text-fg-soft hover:bg-accent/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'Basics' && <BasicsTab invitation={invitation} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
        {tab === 'People' && <PeopleTab invitation={invitation} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
        {tab === 'Date & Venue' && <DateVenueTab invitation={invitation} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
        {tab === 'Schedule' && <ScheduleTab invitation={invitation} onChange={refresh} onSaved={flash} />}
        {tab === 'Story' && <StoryTab invitation={invitation} onChange={refresh} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
        {tab === 'Gallery' && <GalleryTab invitation={invitation} onChange={refresh} onSaved={flash} />}
        {tab === 'Theme & Motion' && <ThemeMotionTab invitation={invitation} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
        {tab === 'Contact' && <ContactTab invitation={invitation} onSaved={(inv) => { setInvitation(inv); flash(); }} />}
      </div>

      <SavedToast visible={!!savedAt} />
    </div>
  );
}

// ---- floating "Saved" toast --------------------------------------------------
//
// Fixed to the viewport (not inline in the page flow) so it's visible no
// matter how far down a long form (Schedule/Story with many rows, Date &
// Venue's many fields) the admin has scrolled when they click Save.

function SavedToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
        >
          <Check size={16} strokeWidth={3} /> Saved
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
// inside an actual bg-white/bg-surface card (e.g. gallery thumbnails) should
// use text-muted/text-ink.

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.2em] text-fg-soft">{label}</span>
      <div className="mt-2 min-w-0">{children}</div>
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30';

function SaveButton({ children = 'Save' }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold"
    >
      {children}
    </button>
  );
}

function PhotoField({ label = 'Photo', path, onUpload }) {
  return (
    <Field label={label}>
      <div className="flex min-w-0 items-center gap-3">
        {path && <span className="min-w-0 flex-1 truncate text-xs text-fg-soft" title={path}>{path}</span>}
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10 hover:text-accent">
          <Upload size={12} /> Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
        </label>
      </div>
    </Field>
  );
}

function AudioField({ label = 'Audio file', path, onUpload }) {
  return (
    <Field label={label}>
      <div className="flex min-w-0 items-center gap-3">
        {path && <span className="min-w-0 flex-1 truncate text-xs text-fg-soft" title={path}>{path}</span>}
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10 hover:text-accent">
          <Upload size={12} /> Upload MP3
          <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
        </label>
      </div>
    </Field>
  );
}

// ---- Basics ------------------------------------------------------------------

function BasicsTab({ invitation, onSaved }) {
  const { user } = useAdminAuth();
  const [slug, setSlug] = useState(invitation.slug);
  const [isPublished, setIsPublished] = useState(invitation.is_published);
  const [metaTitle, setMetaTitle] = useState(invitation.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(invitation.meta_description || '');

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = await adminUpdateInvitation(invitation.id, {
      slug, is_published: isPublished, meta_title: metaTitle, meta_description: metaDescription,
    });
    onSaved({ ...invitation, ...updated });
  }

  return (
    <div className="grid max-w-xl gap-8">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label="Slug (URL)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
        </Field>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm text-fg-soft">Published (visible at the public link)</span>
        </label>
        <Field label="Page title">
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Page description">
          <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} className={inputClass} />
        </Field>
        <SaveButton />
      </form>

      {user.role === 'admin' && <OwnerSection invitation={invitation} onSaved={onSaved} />}
    </div>
  );
}

// ---- Owner (admin-only: which client account this invitation belongs to) ----
//
// A client logs in separately from the super-admin (their own email/password,
// same /admin/login form) and only ever sees invitations where owner_id
// matches their user id — this is where that assignment happens. Without an
// owner, only the admin can see/manage the invitation; a client has no way
// to reach it at all.

function OwnerSection({ invitation, onSaved }) {
  const [clients, setClients] = useState(null);
  const [selectedId, setSelectedId] = useState(invitation.owner_id || '');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminListClients().then(setClients);
  }, []);

  async function assignOwner(ownerId) {
    setError(null);
    try {
      const updated = await adminUpdateInvitation(invitation.id, { owner_id: ownerId || null });
      onSaved({ ...invitation, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update owner.');
    }
  }

  function handleSelectChange(e) {
    const value = e.target.value;
    setSelectedId(value);
    assignOwner(value || null);
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    setError(null);
    try {
      const client = await adminCreateClient(newClient);
      setClients((list) => [...(list || []), client]);
      setSelectedId(client.id);
      setCreatingNew(false);
      setNewClient({ name: '', username: '', email: '', password: '' });
      await assignOwner(client.id);
    } catch (err) {
      setError(err.errors?.username?.[0] || err.errors?.email?.[0] || err.message || 'Failed to create client.');
    }
  }

  return (
    <div className="rounded-2xl border border-accent/15 p-5">
      <h3 className="text-sm uppercase tracking-[0.2em] text-fg-soft">Client owner</h3>
      <p className="mt-1 text-xs text-fg-soft">
        The client account that can log in and view this invitation's RSVPs and wishes.
      </p>

      {clients === null ? (
        <p className="mt-4 text-sm text-fg-soft">Loading…</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select value={selectedId} onChange={handleSelectChange} className={inputClass}>
            <option value="">— No owner (admin-only) —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>
            ))}
          </select>
          {saved && <span className="text-sm text-accent">Saved ✓</span>}
          <button
            type="button"
            onClick={() => setCreatingNew((v) => !v)}
            className="ml-auto rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
          >
            {creatingNew ? 'Cancel' : '+ New client'}
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
          <Field label="Temporary password">
            <input
              type="text"
              value={newClient.password}
              onChange={(e) => setNewClient((c) => ({ ...c, password: e.target.value }))}
              required
              minLength={8}
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            className="justify-self-start rounded-full bg-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold"
          >
            Create &amp; assign
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
    </div>
  );
}

// ---- People (bride/groom or celebrant, with a show/hide toggle per side) -----

function PeopleTab({ invitation, onSaved }) {
  const isWedding = invitation.type === 'wedding';
  const bride = invitation.people?.find((p) => p.role === 'bride') || {};
  const groom = invitation.people?.find((p) => p.role === 'groom') || {};
  const celebrant = invitation.people?.find((p) => p.role === 'celebrant') || {};

  const [form, setForm] = useState(isWedding
    ? { brideName: bride.first_name || '', brideParents: bride.parents_text || '', bridePhoto: bride.photo || '',
        groomName: groom.first_name || '', groomParents: groom.parents_text || '', groomPhoto: groom.photo || '',
        connector: invitation.detail?.connector || '&',
        showBride: invitation.detail?.show_bride ?? true,
        showGroom: invitation.detail?.show_groom ?? true }
    : { celebrantName: celebrant.first_name || '', celebrantPhoto: celebrant.photo || '',
        celebrantAge: invitation.detail?.celebrant_age || '', turningText: invitation.detail?.celebrant_turning_text || '' });

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleUpload(key, file) {
    const { path } = await adminUploadFile(invitation.id, file, 'image');
    setForm((f) => ({ ...f, [key]: path }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const people = isWedding
      ? [
          { role: 'bride', first_name: form.brideName, parents_text: form.brideParents, photo: form.bridePhoto },
          { role: 'groom', first_name: form.groomName, parents_text: form.groomParents, photo: form.groomPhoto },
        ]
      : [{ role: 'celebrant', first_name: form.celebrantName, photo: form.celebrantPhoto }];

    const detail = isWedding
      ? { connector: form.connector, show_bride: form.showBride, show_groom: form.showGroom }
      : { celebrant_age: form.celebrantAge || null, celebrant_turning_text: form.turningText };

    const updated = await adminUpdateInvitation(invitation.id, { people, detail });
    onSaved({ ...invitation, ...updated });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-6">
      {isWedding ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className={`grid min-w-0 gap-3 rounded-2xl border border-accent/15 p-4 transition-opacity ${form.showBride ? '' : 'opacity-50'}`}>
            <legend className="flex items-center gap-2 px-1 text-xs uppercase tracking-[0.2em] text-accent">
              <label className="flex items-center gap-1.5 normal-case tracking-normal text-fg-soft">
                <input type="checkbox" checked={form.showBride} onChange={(e) => setForm((f) => ({ ...f, showBride: e.target.checked }))} className="h-3.5 w-3.5" />
                Show
              </label>
              Bride
            </legend>
            <Field label="First name"><input value={form.brideName} onChange={set('brideName')} className={inputClass} /></Field>
            <Field label="Parents text"><input value={form.brideParents} onChange={set('brideParents')} className={inputClass} /></Field>
            <PhotoField path={form.bridePhoto} onUpload={(f) => handleUpload('bridePhoto', f)} />
          </fieldset>
          <fieldset className={`grid min-w-0 gap-3 rounded-2xl border border-accent/15 p-4 transition-opacity ${form.showGroom ? '' : 'opacity-50'}`}>
            <legend className="flex items-center gap-2 px-1 text-xs uppercase tracking-[0.2em] text-accent">
              <label className="flex items-center gap-1.5 normal-case tracking-normal text-fg-soft">
                <input type="checkbox" checked={form.showGroom} onChange={(e) => setForm((f) => ({ ...f, showGroom: e.target.checked }))} className="h-3.5 w-3.5" />
                Show
              </label>
              Groom
            </legend>
            <Field label="First name"><input value={form.groomName} onChange={set('groomName')} className={inputClass} /></Field>
            <Field label="Parents text"><input value={form.groomParents} onChange={set('groomParents')} className={inputClass} /></Field>
            <PhotoField path={form.groomPhoto} onUpload={(f) => handleUpload('groomPhoto', f)} />
          </fieldset>
          {form.showBride && form.showGroom && (
            <Field label="Connector (e.g. &)">
              <input value={form.connector} onChange={set('connector')} className={inputClass} style={{ maxWidth: 100 }} />
            </Field>
          )}
          {!form.showBride && !form.showGroom && (
            <p className="text-sm text-rose sm:col-span-2">
              Both sides are hidden — the public page will show no couple name. Enable at least one.
            </p>
          )}
        </div>
      ) : (
        <fieldset className="grid gap-3 rounded-2xl border border-accent/15 p-4">
          <legend className="px-1 text-xs uppercase tracking-[0.2em] text-accent">Celebrant</legend>
          <Field label="First name"><input value={form.celebrantName} onChange={set('celebrantName')} className={inputClass} /></Field>
          <Field label="Age"><input type="number" value={form.celebrantAge} onChange={set('celebrantAge')} className={inputClass} /></Field>
          <Field label="Turning text (e.g. Turning 30)"><input value={form.turningText} onChange={set('turningText')} className={inputClass} /></Field>
          <PhotoField path={form.celebrantPhoto} onUpload={(f) => handleUpload('celebrantPhoto', f)} />
        </fieldset>
      )}
      <SaveButton />
    </form>
  );
}

// ---- Date & Venue --------------------------------------------------------------

function DateVenueTab({ invitation, onSaved }) {
  const d = invitation.detail || {};
  const [form, setForm] = useState({
    event_date: d.event_date ? d.event_date.slice(0, 16) : '',
    display_date: d.display_date || '',
    display_time: d.display_time || '',
    display_location: d.display_location || '',
    hero_image: d.hero_image || '',
    hero_overline: d.hero_overline || '',
    hero_tagline: d.hero_tagline || '',
    envelope_overline: d.envelope_overline || '',
    envelope_cta: d.envelope_cta || '',
    envelope_animation: d.envelope_animation || 'swing-doors',
  });

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleUpload(file) {
    const { path } = await adminUploadFile(invitation.id, file, 'image');
    setForm((f) => ({ ...f, hero_image: path }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = await adminUpdateInvitation(invitation.id, { detail: form });
    onSaved({ ...invitation, ...updated });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
      <Field label="Event date & time"><input type="datetime-local" value={form.event_date} onChange={set('event_date')} className={inputClass} /></Field>
      <Field label="Display date (e.g. Saturday, 14th June 2026)"><input value={form.display_date} onChange={set('display_date')} className={inputClass} /></Field>
      <Field label="Display time (e.g. 4:00 PM onwards)"><input value={form.display_time} onChange={set('display_time')} className={inputClass} /></Field>
      <Field label="Location"><input value={form.display_location} onChange={set('display_location')} className={inputClass} /></Field>
      <PhotoField label="Hero background image" path={form.hero_image} onUpload={handleUpload} />
      <Field label="Hero overline"><input value={form.hero_overline} onChange={set('hero_overline')} className={inputClass} /></Field>
      <Field label="Hero tagline"><input value={form.hero_tagline} onChange={set('hero_tagline')} className={inputClass} /></Field>
      <Field label="Envelope overline"><input value={form.envelope_overline} onChange={set('envelope_overline')} className={inputClass} /></Field>
      <Field label="Envelope button text"><input value={form.envelope_cta} onChange={set('envelope_cta')} className={inputClass} /></Field>
      <Field label="Opening style">
        <select value={form.envelope_animation} onChange={set('envelope_animation')} className={inputClass}>
          {Object.entries(ENVELOPE_ANIMATION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </Field>
      <SaveButton />
    </form>
  );
}

// ---- Schedule (repeatable events, with a map/location picker) ------------------

function ScheduleTab({ invitation, onChange, onSaved }) {
  const [events, setEvents] = useState(invitation.schedule_events || []);

  function update(index, key, value) {
    setEvents((es) => es.map((e, i) => (i === index ? { ...e, [key]: value } : e)));
  }

  async function handleAdd() {
    const created = await adminCreateScheduleEvent(invitation.id, {
      title: 'New Event', event_date: new Date().toISOString().slice(0, 10), event_time: '5:00 PM', venue: 'Venue',
    });
    setEvents((es) => [...es, created]);
  }

  async function handleSave(index) {
    const ev = events[index];
    await adminUpdateScheduleEvent(invitation.id, ev.id, ev);
    onChange();
    onSaved?.();
  }

  async function handleDelete(index) {
    await adminDeleteScheduleEvent(invitation.id, events[index].id);
    setEvents((es) => es.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-4">
      {events.map((ev, i) => (
        <div key={ev.id} className="grid gap-3 rounded-2xl border border-accent/15 p-5 sm:grid-cols-2">
          <Field label="Title"><input value={ev.title} onChange={(e) => update(i, 'title', e.target.value)} className={inputClass} /></Field>
          <Field label="Team (groom/bride, optional)"><input value={ev.team || ''} onChange={(e) => update(i, 'team', e.target.value)} className={inputClass} /></Field>
          <Field label="Date"><input type="date" value={ev.event_date} onChange={(e) => update(i, 'event_date', e.target.value)} className={inputClass} /></Field>
          <Field label="Time"><input value={ev.event_time} onChange={(e) => update(i, 'event_time', e.target.value)} className={inputClass} /></Field>
          <Field label="Venue"><input value={ev.venue} onChange={(e) => update(i, 'venue', e.target.value)} className={inputClass} /></Field>
          <Field label="Address"><input value={ev.address || ''} onChange={(e) => update(i, 'address', e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Location (for map + QR code)">
              <MapPicker value={ev.map_url} onChange={(url) => update(i, 'map_url', url)} />
            </Field>
          </div>
          <Field label="Dresscode"><input value={ev.dresscode || ''} onChange={(e) => update(i, 'dresscode', e.target.value)} className={inputClass} /></Field>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={() => handleSave(i)} className="rounded-full bg-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold">Save</button>
            <button type="button" onClick={() => handleDelete(i)} className="inline-flex items-center gap-1 rounded-full border border-rose/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-rose transition hover:bg-rose/10">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={handleAdd} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent">
        <Plus size={14} /> Add event
      </button>
    </div>
  );
}

// ---- Story (layout picker + milestone list, no manual x/y) --------------------

const STORY_LAYOUTS = [
  { key: 'constellation', name: 'Constellation', description: 'Glowing stars on a starfield, auto-positioned' },
  { key: 'timeline', name: 'Vertical Timeline', description: 'Alternating left/right cards down a line' },
  { key: 'horizontal', name: 'Horizontal Scroll', description: 'Swipeable strip of cards' },
  { key: 'stacked', name: 'Stacked Cards', description: 'Simple top-to-bottom cards' },
  { key: 'mosaic', name: 'Photo Mosaic', description: 'Image-forward grid, captions on hover' },
];

function StoryTab({ invitation, onChange, onSaved }) {
  const [milestones, setMilestones] = useState(invitation.milestones || []);
  const [layout, setLayout] = useState(invitation.story_layout || 'constellation');

  function update(index, key, value) {
    setMilestones((ms) => ms.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }

  async function selectLayout(key) {
    setLayout(key);
    const updated = await adminUpdateInvitation(invitation.id, { story_layout: key });
    onSaved({ ...invitation, ...updated });
  }

  async function handleAdd() {
    const created = await adminCreateMilestone(invitation.id, {
      x: 50, y: 50, date_label: 'Date', title: 'New milestone',
    });
    setMilestones((ms) => [...ms, created]);
  }

  async function handleSave(index) {
    const m = milestones[index];
    await adminUpdateMilestone(invitation.id, m.id, m);
    onChange();
    onSaved?.(invitation);
  }

  async function handleDelete(index) {
    await adminDeleteMilestone(invitation.id, milestones[index].id);
    setMilestones((ms) => ms.filter((_, i) => i !== index));
  }

  async function handleUpload(index, file) {
    const { path } = await adminUploadFile(invitation.id, file, 'image');
    update(index, 'image', path);
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Layout</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORY_LAYOUTS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => selectLayout(l.key)}
              className={`rounded-2xl border p-4 text-left transition ${
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
        {milestones.map((m, i) => (
          <div key={m.id} className="grid gap-3 rounded-2xl border border-accent/15 p-5 sm:grid-cols-2">
            <Field label="Date label"><input value={m.date_label} onChange={(e) => update(i, 'date_label', e.target.value)} className={inputClass} /></Field>
            <Field label="Title"><input value={m.title} onChange={(e) => update(i, 'title', e.target.value)} className={inputClass} /></Field>
            <Field label="Description">
              <textarea value={m.description || ''} onChange={(e) => update(i, 'description', e.target.value)} rows={2} className={`${inputClass} sm:col-span-2`} />
            </Field>
            <PhotoField path={m.image} onUpload={(f) => handleUpload(i, f)} />
            <div className="flex gap-2 sm:col-span-2">
              <button type="button" onClick={() => handleSave(i)} className="rounded-full bg-accent px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold">Save</button>
              <button type="button" onClick={() => handleDelete(i)} className="inline-flex items-center gap-1 rounded-full border border-rose/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-rose transition hover:bg-rose/10">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={handleAdd} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent">
          <Plus size={14} /> Add milestone
        </button>
      </div>
    </div>
  );
}

// ---- Gallery (multi-image upload) ----------------------------------------------

function GalleryTab({ invitation, onChange, onSaved }) {
  const [images, setImages] = useState(invitation.gallery_images || []);

  async function handleUpload(file) {
    const { path } = await adminUploadFile(invitation.id, file, 'image');
    const created = await adminCreateGalleryImage(invitation.id, { image: path, alt: file.name });
    setImages((imgs) => [...imgs, created]);
    onSaved?.();
  }

  async function updateAlt(index, alt) {
    const img = images[index];
    setImages((imgs) => imgs.map((im, i) => (i === index ? { ...im, alt } : im)));
    await adminUpdateGalleryImage(invitation.id, img.id, { ...img, alt });
  }

  async function handleDelete(index) {
    await adminDeleteGalleryImage(invitation.id, images[index].id);
    setImages((imgs) => imgs.filter((_, i) => i !== index));
    onChange();
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent">
        <Upload size={14} /> Upload photo
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
      </label>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="rounded-xl border border-accent/15 p-2">
            <img src={img.image.startsWith('http') ? img.image : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}/storage/${img.image}`} alt={img.alt} className="h-28 w-full rounded-lg object-cover" />
            <input
              value={img.alt || ''}
              onChange={(e) => updateAlt(i, e.target.value)}
              placeholder="Caption"
              className="mt-2 w-full rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink outline-none focus:border-accent"
            />
            <button type="button" onClick={() => handleDelete(i)} className="mt-2 inline-flex items-center gap-1 text-xs text-rose">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Theme & Motion (curated presets + animation intensity) --------------------

function ThemeMotionTab({ invitation, onSaved }) {
  const [themeKey, setThemeKey] = useState(null);
  const [intensity, setIntensity] = useState(invitation.animation_intensity || 'balanced');

  async function selectTheme(preset) {
    setThemeKey(preset.key);
    // NOTE: deliberately not touching document.documentElement here. The
    // admin dashboard is a different page from the public invitation, and
    // CSS variables on <html> are global DOM state — writing them from here
    // used to leak this invitation's colors into whatever page (including a
    // DIFFERENT invitation) loaded next. The swatch cards below already show
    // the palette; "Saved ✓" confirms persistence. Preview happens only on
    // the actual public page, via ThemeProvider, which is scoped per-slug.
    const updated = await adminUpdateInvitation(invitation.id, { theme: preset.theme });
    onSaved({ ...invitation, ...updated });
  }

  async function selectIntensity(key) {
    setIntensity(key);
    const updated = await adminUpdateInvitation(invitation.id, { animation_intensity: key });
    onSaved({ ...invitation, ...updated });
  }

  return (
    <div className="grid gap-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Color theme</p>
        <p className="mt-1 text-sm text-fg-soft">Pick a palette — no color codes needed.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => selectTheme(preset)}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                themeKey === preset.key ? 'border-accent ring-2 ring-accent/40' : 'border-accent/15 hover:border-accent/40'
              }`}
            >
              <div
                className="h-16 w-full"
                style={{
                  background: `linear-gradient(135deg, rgb(${preset.theme.bg}) 0%, rgb(${preset.theme.accent}) 55%, rgb(${preset.theme.rose}) 100%)`,
                }}
              />
              <p className="px-3 py-2 text-sm text-fg">{preset.name}</p>
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
              onClick={() => selectIntensity(key)}
              className={`rounded-2xl border p-4 text-left transition ${
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
  const d = invitation.detail || {};
  const [form, setForm] = useState({
    contact_phone_primary: d.contact_phone_primary || '',
    contact_phone_secondary: d.contact_phone_secondary || '',
    contact_email: d.contact_email || '',
    contact_instagram: d.contact_instagram || '',
    music_enabled: d.music_enabled || false,
    music_src: d.music_src || '',
  });

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleMusicUpload(file) {
    const { path } = await adminUploadFile(invitation.id, file, 'audio');
    setForm((f) => ({ ...f, music_src: path }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const updated = await adminUpdateInvitation(invitation.id, { detail: form });
    onSaved({ ...invitation, ...updated });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
      <Field label="Primary phone"><input value={form.contact_phone_primary} onChange={set('contact_phone_primary')} className={inputClass} /></Field>
      <Field label="Secondary phone"><input value={form.contact_phone_secondary} onChange={set('contact_phone_secondary')} className={inputClass} /></Field>
      <Field label="Email"><input value={form.contact_email} onChange={set('contact_email')} className={inputClass} /></Field>
      <Field label="Instagram handle"><input value={form.contact_instagram} onChange={set('contact_instagram')} className={inputClass} /></Field>
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={form.music_enabled} onChange={(e) => setForm((f) => ({ ...f, music_enabled: e.target.checked }))} className="h-4 w-4" />
        <span className="text-sm text-fg-soft">Background music enabled</span>
      </label>
      <AudioField path={form.music_src} onUpload={handleMusicUpload} />
      <SaveButton />
    </form>
  );
}
