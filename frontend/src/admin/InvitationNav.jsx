// INVITATION NAV — the row of links shared by the RSVP and Wishes screens
// so you can move between an invitation's views directly instead of going
// back through the dashboard every time.
//
// This is also the only way a client reaches their guestbook: a client who
// owns exactly one invitation is redirected straight to its RSVPs (see
// ClientHome), so without these links the Wishes screen was unreachable.
// "Back" carries ?all=1 so that redirect doesn't just bounce them here again.

import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, MessageSquare, Pencil, Users } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

const linkClass = 'inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition hover:bg-accent/10';

export function InvitationNav({ invitationId, invitation }) {
  const { user } = useAdminAuth();
  const { pathname } = useLocation();
  const isAdmin = user.role === 'admin';
  const isRsvps = pathname.endsWith('/rsvps');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={isAdmin ? '/admin' : '/admin?all=1'}
        className="inline-flex items-center gap-1.5 pr-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent"
      >
        <ArrowLeft size={14} /> {isAdmin ? 'Dashboard' : 'My invitations'}
      </Link>

      <Link
        to={`/admin/invitations/${invitationId}/rsvps`}
        aria-current={isRsvps ? 'page' : undefined}
        className={`${linkClass} ${isRsvps ? 'bg-accent/15 text-accent' : 'text-fg-soft'}`}
      >
        <Users size={12} /> RSVPs
      </Link>

      <Link
        to={`/admin/invitations/${invitationId}/wishes`}
        aria-current={!isRsvps ? 'page' : undefined}
        className={`${linkClass} ${!isRsvps ? 'bg-accent/15 text-accent' : 'text-fg-soft'}`}
      >
        <MessageSquare size={12} /> Wishes
      </Link>

      {isAdmin && (
        <>
          <Link to={`/admin/invitations/${invitationId}`} className={`${linkClass} text-fg-soft`}>
            <Pencil size={12} /> Edit
          </Link>
          <Link to={`/admin/preview/${invitationId}`} className={`${linkClass} text-fg-soft`}>
            <Eye size={12} /> Preview
          </Link>
        </>
      )}

      {invitation && !invitation.is_published && (
        <span className="rounded-full bg-fg/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-soft">Draft</span>
      )}
    </div>
  );
}
