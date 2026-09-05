// CLIENT HOME — entry point for a logged-in client. Fetches their
// invitation(s) once: if there's exactly one, skip the list screen and go
// straight to its RSVPs (the common case — most clients only have one
// event, and jumping straight to "who said yes" is the whole point of
// logging in). With zero or multiple invitations, show the list instead.

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminListInvitations } from '../lib/api.js';
import ClientDashboard from './ClientDashboard.jsx';

export default function ClientHome() {
  const [invitations, setInvitations] = useState(null);

  useEffect(() => {
    adminListInvitations().then(setInvitations);
  }, []);

  if (invitations === null) {
    return <p className="text-fg-soft">Loading…</p>;
  }

  if (invitations.length === 1) {
    return <Navigate to={`/admin/invitations/${invitations[0].id}/rsvps`} replace />;
  }

  return <ClientDashboard />;
}
