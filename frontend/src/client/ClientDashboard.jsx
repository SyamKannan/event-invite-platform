// CLIENT DASHBOARD — a client's own invitation(s), view-only. No "New
// invitation" button (clients don't create invitations — that's the
// platform admin's job) and no "Edit" link (content edits stay with the
// admin for now, per product decision). Clients can view their public
// link and drill into RSVPs/wishes for each invitation they own.
//
// If the client owns exactly one invitation, we skip this list screen
// entirely and route straight to its detail view (see App.jsx) — nicer
// "log in and immediately see your RSVPs" experience for the common case.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cake, ExternalLink, Heart, MessageSquare, Users } from 'lucide-react';
import { adminListInvitations } from '../lib/api.js';

export default function ClientDashboard() {
  const [invitations, setInvitations] = useState(null);

  useEffect(() => {
    adminListInvitations().then(setInvitations);
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Your Invitations</h1>
      <p className="mt-2 text-sm text-fg-soft">
        Watch RSVPs and guestbook wishes arrive in real time.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {invitations === null && <p className="text-fg-soft">Loading…</p>}
        {invitations?.length === 0 && (
          <p className="text-fg-soft">
            No invitations linked to your account yet — reach out if that doesn't look right.
          </p>
        )}
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
                href={`/i/${inv.slug}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-accent"
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
