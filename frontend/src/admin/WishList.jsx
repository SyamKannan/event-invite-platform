// WISH LIST — read-only view of guestbook wishes, with the ability to
// delete anything inappropriate before it stays up on the public page.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { adminDeleteWish, adminListWishes } from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function WishList() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [wishes, setWishes] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    setWishes(null);
    setForbidden(false);
    adminListWishes(id)
      .then(setWishes)
      .catch((err) => {
        if (err.status === 403 || err.status === 404) setForbidden(true);
      });
  }, [id]);

  async function handleDelete(wishId) {
    await adminDeleteWish(id, wishId);
    setWishes((ws) => ws.filter((w) => w.id !== wishId));
  }

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent">
        <ArrowLeft size={14} /> {user.role === 'client' ? 'Back' : 'Back to dashboard'}
      </Link>

      <h1 className="mt-3 font-display text-3xl">Guestbook Wishes</h1>

      {forbidden && (
        <p className="mt-6 text-sm text-rose">
          You don't have access to this invitation's guestbook.
        </p>
      )}

      {!forbidden && (
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {wishes?.map((w) => (
          <div key={w.id} className="rounded-2xl border border-accent/15 bg-surface p-5 text-ink">
            <div className="flex items-start justify-between">
              <span className="font-display text-lg">{w.name}</span>
              {user.role === 'admin' && (
                <button onClick={() => handleDelete(w.id)} className="text-rose" aria-label="Delete wish">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">{w.message}</p>
            <p className="mt-2 text-xs text-fg-soft">{new Date(w.created_at).toLocaleString()}</p>
          </div>
        ))}
        {wishes?.length === 0 && <p className="text-fg-soft">No wishes yet.</p>}
      </div>
      )}
    </div>
  );
}
