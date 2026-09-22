// RSVP LIST — table of everyone who responded, with a CSV export for the
// caterer/venue and a delete action (admin and owning client) to remove
// duplicate, test, or spam responses so the headcount stays accurate.
//
// Share buttons use the /share/{slug} link (Open Graph preview for
// WhatsApp etc.), and only appear once the invitation is published — the
// share page 404s for drafts.

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Download, ExternalLink, MessageCircle, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { adminDeleteRsvp, adminExportRsvps, adminGetInvitation, adminListRsvps, errorMessage } from '../lib/api.js';
import { shareUrl as buildShareUrl, whatsappShareUrl } from '../lib/share.js';
import { InvitationNav } from './InvitationNav.jsx';

export default function RsvpList() {
  const { id } = useParams();
  const [rsvps, setRsvps] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    adminListRsvps(id)
      .then(setRsvps)
      .catch((err) => {
        if (err.status === 403 || err.status === 404) setForbidden(true);
        else setError(errorMessage(err, 'Could not load RSVPs.'));
      });
  }, [id]);

  useEffect(() => {
    setRsvps(null);
    setForbidden(false);
    load();
    adminGetInvitation(id).then(setInvitation).catch(() => {});
  }, [id, load]);

  const accepted = rsvps?.filter((r) => r.choice === 'accept') ?? [];
  const totalGuests = accepted.reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0);
  const published = invitation?.is_published;
  const publicUrl = invitation ? `${window.location.origin}/i/${invitation.slug}` : null;
  const linkToShare = invitation ? buildShareUrl(invitation.slug) : null;
  const shareText = 'You are invited! Please open the invitation:';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(linkToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', linkToShare);
    }
  }

  function shareToWhatsapp() {
    window.open(whatsappShareUrl(invitation.slug, shareText), '_blank', 'noopener,noreferrer');
  }

  // Opens the device's native share sheet (Instagram, Messages, Telegram,
  // etc. all register as targets on mobile) when available; falls back to
  // WhatsApp on desktop browsers that don't support the Web Share API.
  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: 'Invitation', text: shareText, url: linkToShare }).catch(() => {});
    } else {
      shareToWhatsapp();
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await adminExportRsvps(id);
    } catch (err) {
      setError(errorMessage(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(rsvp) {
    if (!window.confirm(`Delete the RSVP from "${rsvp.guest_name}"? This can't be undone.`)) return;
    try {
      await adminDeleteRsvp(id, rsvp.id);
      setRsvps((list) => list.filter((r) => r.id !== rsvp.id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that RSVP.'));
    }
  }

  return (
    <div>
      <InvitationNav invitationId={id} invitation={invitation} />

      {!forbidden && invitation && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/20 bg-surface px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Your invitation link</p>
            <p className="mt-1 truncate text-sm text-ink">{publicUrl}</p>
            {!published && (
              <p className="mt-1 text-xs text-rose">
                Not published yet — guests can't open this link until it is.
              </p>
            )}
          </div>
          {published && (
            <>
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
            </>
          )}
          {published ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
            >
              <ExternalLink size={14} /> Open
            </a>
          ) : (
            <Link
              to={`/admin/preview/${id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-ink transition hover:bg-accent/10"
            >
              <ExternalLink size={14} /> Preview draft
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">RSVPs</h1>
        {!forbidden && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !rsvps?.length}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 hover:text-accent disabled:opacity-40"
            >
              <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>

      {forbidden && (
        <p className="mt-6 text-sm text-rose">
          You don't have access to this invitation's RSVPs.
        </p>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-rose">{error}</p>}

      {!forbidden && rsvps && (
        <p className="mt-2 text-sm text-fg-soft">
          {accepted.length} accepted ({totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}) · {rsvps.length - accepted.length} declined
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
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rsvps === null && !error && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-fg-soft">Loading…</td></tr>
              )}
              {rsvps?.map((r) => (
                <tr key={r.id} className="border-t border-accent/10">
                  <td className="px-4 py-3">{r.guest_name}</td>
                  <td className="px-4 py-3 capitalize">{r.choice}</td>
                  <td className="px-4 py-3">{r.choice === 'accept' ? r.guest_count : '—'}</td>
                  <td className="px-4 py-3">{r.meal_preference || '—'}</td>
                  <td className="max-w-xs whitespace-pre-line break-words px-4 py-3">{r.note || '—'}</td>
                  <td className="px-4 py-3 text-fg-soft">
                    {new Date(r.updated_at || r.created_at).toLocaleString()}
                    {r.updated_at && r.updated_at !== r.created_at && <span className="block text-[11px]">(changed)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="text-rose transition hover:opacity-70"
                      aria-label={`Delete RSVP from ${r.guest_name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
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
