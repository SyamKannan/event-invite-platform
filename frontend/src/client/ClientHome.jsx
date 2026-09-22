// CLIENT HOME — entry point for a logged-in client. Fetches their
// invitation(s) once: if there's exactly one, skip the list screen and go
// straight to its RSVPs (the common case — most clients only have one
// event, and jumping straight to "who said yes" is the whole point of
// logging in). With zero or multiple invitations, show the list instead
// (handed the already-fetched list, so it doesn't fetch twice).

import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminListInvitations, errorMessage } from '../lib/api.js';
import ClientDashboard from './ClientDashboard.jsx';

export default function ClientHome() {
  const [invitations, setInvitations] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    // per_page: 100 — a client will only ever own a handful of invitations,
    // so one page is always enough to answer "do they have exactly one?".
    adminListInvitations({ per_page: 100 })
      .then(({ data }) => setInvitations(data))
      .catch((err) => setError(errorMessage(err, 'Could not load your invitations.')));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <div>
        <p className="text-sm text-rose">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10"
        >
          Try again
        </button>
      </div>
    );
  }

  if (invitations === null) {
    return <p className="text-fg-soft">Loading…</p>;
  }

  if (invitations.length === 1) {
    return <Navigate to={`/admin/invitations/${invitations[0].id}/rsvps`} replace />;
  }

  return <ClientDashboard invitations={invitations} />;
}
