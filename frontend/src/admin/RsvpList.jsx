// RSVP LIST — read-only table of everyone who responded, with a CSV export
// button for the admin to hand off to caterers/venues.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { adminExportRsvps, adminListRsvps } from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function RsvpList() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [rsvps, setRsvps] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    setRsvps(null);
    setForbidden(false);
    adminListRsvps(id)
      .then(setRsvps)
      .catch((err) => {
        if (err.status === 403 || err.status === 404) setForbidden(true);
      });
  }, [id]);

  const accepted = rsvps?.filter((r) => r.choice === 'accept') ?? [];
  const totalGuests = accepted.reduce((sum, r) => sum + r.guest_count, 0);

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent">
        <ArrowLeft size={14} /> {user.role === 'client' ? 'Back' : 'Back to dashboard'}
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-3xl">RSVPs</h1>
        {!forbidden && (
          <button
            type="button"
            onClick={() => adminExportRsvps(id)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-accent/10"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {forbidden && (
        <p className="mt-6 text-sm text-rose">
          You don't have access to this invitation's RSVPs.
        </p>
      )}

      {!forbidden && rsvps && (
        <p className="mt-2 text-sm text-fg-soft">
          {accepted.length} accepted ({totalGuests} guests) · {rsvps.length - accepted.length} declined
        </p>
      )}

      {!forbidden && (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-accent/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-ink">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Response</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Meal</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rsvps?.map((r) => (
              <tr key={r.id} className="border-t border-accent/10">
                <td className="px-4 py-3">{r.guest_name}</td>
                <td className="px-4 py-3 capitalize">{r.choice}</td>
                <td className="px-4 py-3">{r.guest_count}</td>
                <td className="px-4 py-3">{r.meal_preference || '—'}</td>
                <td className="px-4 py-3">{r.note || '—'}</td>
                <td className="px-4 py-3 text-fg-soft">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rsvps?.length === 0 && <p className="p-6 text-center text-fg-soft">No RSVPs yet.</p>}
      </div>
      )}
    </div>
  );
}
