// RSVP LIST — read-only table of everyone who responded, with a CSV export
// button for the admin to hand off to caterers/venues.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import { adminExportRsvps, adminGetInvitation, adminListRsvps } from '../lib/api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function RsvpList() {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [rsvps, setRsvps] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRsvps(null);
    setForbidden(false);
    adminListRsvps(id)
      .then(setRsvps)
      .catch((err) => {
        if (err.status === 403 || err.status === 404) setForbidden(true);
      });
    adminGetInvitation(id).then(setInvitation).catch(() => {});
  }, [id]);

  const accepted = rsvps?.filter((r) => r.choice === 'accept') ?? [];
  const totalGuests = accepted.reduce((sum, r) => sum + r.guest_count, 0);
  const shareUrl = invitation ? `${window.location.origin}/i/${invitation.slug}` : null;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = 'You are invited! Please open the invitation:';

  function shareToWhatsapp() {
    const text = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  // Opens the device's native share sheet (Instagram, Messages, Telegram,
  // etc. all register as targets on mobile) when available; falls back to
  // WhatsApp on desktop browsers that don't support the Web Share API.
  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: 'Invitation', text: shareText, url: shareUrl }).catch(() => {});
    } else {
      shareToWhatsapp();
    }
  }

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:text-accent">
        <ArrowLeft size={14} /> {user.role === 'client' ? 'Back' : 'Back to dashboard'}
      </Link>

      {!forbidden && shareUrl && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/20 bg-surface px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-fg-soft">Your invitation link</p>
            <p className="mt-1 truncate text-sm text-ink">{shareUrl}</p>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={shareToWhatsapp}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs uppercase tracking-[0.15em] text-white transition hover:brightness-95"
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={shareNative}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-gold"
          >
            <Share2 size={14} /> Share
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
          >
            <ExternalLink size={14} /> Preview
          </a>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">RSVPs</h1>
        {!forbidden && (
          <button
            type="button"
            onClick={() => adminExportRsvps(id)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
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
