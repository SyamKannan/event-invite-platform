// WISH LIST — guestbook wishes, with the ability to delete anything
// inappropriate so it no longer shows on the public page. Deleting is
// admin-only in the UI (a product decision — the backend would allow the
// owning client too).

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { adminDeleteWish, adminListWishes, errorMessage } from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { InvitationNav } from './InvitationNav.jsx';

export default function WishList() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [wishes, setWishes] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setWishes(null);
    setForbidden(false);
    setError(null);
    adminListWishes(id)
      .then(setWishes)
      .catch((err) => {
        if (err.status === 403 || err.status === 404) setForbidden(true);
        else setError(errorMessage(err, 'Could not load wishes.'));
      });
  }, [id]);

  async function handleDelete(wish) {
    if (!window.confirm(`Delete the wish from "${wish.name}"? It will disappear from the public page.`)) return;
    setError(null);
    try {
      await adminDeleteWish(id, wish.id);
      setWishes((ws) => ws.filter((w) => w.id !== wish.id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that wish.'));
    }
  }

  return (
    <div>
      <InvitationNav invitationId={id} />

      <h1 className="mt-6 font-display text-3xl">Guestbook Wishes</h1>

      {forbidden && (
        <p className="mt-6 text-sm text-rose">
          You don't have access to this invitation's guestbook.
        </p>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}

      {!forbidden && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {wishes === null && !error && <p className="text-fg-soft">Loading…</p>}
          {wishes?.map((w) => (
            <div key={w.id} className="rounded-2xl border border-accent/15 bg-surface p-5 text-ink">
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-lg">{w.name}</span>
                {user.role === 'admin' && (
                  <button onClick={() => handleDelete(w)} className="text-rose" aria-label={`Delete wish from ${w.name}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-muted">{w.message}</p>
              <p className="mt-2 text-xs text-muted">{new Date(w.created_at).toLocaleString()}</p>
            </div>
          ))}
          {wishes?.length === 0 && <p className="text-fg-soft">No wishes yet.</p>}
        </div>
      )}
    </div>
  );
}
