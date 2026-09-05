// ADMIN DASHBOARD — list every invitation, create a new one (wedding or
// birthday), and jump to its editor / public link / RSVP & wish lists.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cake, Check, Copy, ExternalLink, Heart, MessageSquare, Plus, Users } from 'lucide-react';
import { adminCreateInvitation, adminListInvitations } from '../lib/api.js';

export default function Dashboard() {
  const [invitations, setInvitations] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('wedding');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Copies a link to this invitation's RSVP dashboard (who responded, guest
  // counts, etc.) — not the public guest-facing page, which "View" already
  // covers. Useful for handing the client a direct link to their responses.
  function copyRsvpLink(inv) {
    const url = `${window.location.origin}/admin/invitations/${inv.id}/rsvps`;
    navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId((id) => (id === inv.id ? null : id)), 2000);
  }

  useEffect(() => {
    adminListInvitations().then(setInvitations);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const invitation = await adminCreateInvitation({ slug: newSlug.trim(), type: newType });
      setInvitations((prev) => [invitation, ...(prev || [])]);
      setNewSlug('');
      setCreating(false);
    } catch (err) {
      setError(err.errors?.slug?.[0] || err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Invitations</h1>
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-gold"
        >
          <Plus size={16} /> New invitation
        </button>
      </div>

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
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invitations === null && <p className="text-fg-soft">Loading…</p>}
        {invitations?.length === 0 && <p className="text-fg-soft">No invitations yet — create your first one above.</p>}
        {invitations?.map((inv) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_10px_30px_-20px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2 text-accent">
              {inv.type === 'wedding' ? <Heart size={16} fill="currentColor" /> : <Cake size={16} />}
              <span className="text-xs uppercase tracking-[0.2em]">{inv.type}</span>
              {!inv.is_published && (
                <span className="ml-auto rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">Draft</span>
              )}
            </div>
            <p className="mt-3 font-display text-2xl">{inv.slug}</p>

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
              <button
                type="button"
                onClick={() => copyRsvpLink(inv)}
                title="Copy a link to this invitation's RSVP dashboard"
                className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-accent"
              >
                {copiedId === inv.id ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy RSVP Link
                  </>
                )}
              </button>
              <a
                href={`/i/${inv.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-accent"
              >
                <ExternalLink size={12} /> View
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
