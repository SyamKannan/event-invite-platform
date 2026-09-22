// GUESTBOOK — visitors leave wishes that show up below the form.
//
//   • "Inspire me" button — fills the message with a blessing suited to the
//     event type (no "happily ever after" on a retirement page)
//   • Character counter on the textarea
//   • "Load more" — the API pages wishes newest-first, 30 at a time
//   • Hidden honeypot field to keep bots out
//
// Storage: the Laravel API, scoped to this invitation's slug.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Send, Sparkles } from 'lucide-react';
import { Section } from '../components/ui/Section.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { errorMessage, getWishes, postWish } from '../lib/api.js';
import { guestbookBlessings } from '../lib/invitationText.js';

const MAX_MSG = 500;
const PAGE_SIZE = 30; // must match Public\WishController::PAGE_SIZE

export function Guestbook() {
  const config = useConfig();
  const { guestbook, slug } = config;
  const [wishes, setWishes] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!guestbook.enabled) return;
    getWishes(slug)
      .then((page) => {
        setWishes(page);
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch(() => setLoadFailed(true));
  }, [guestbook.enabled, slug]);

  if (!guestbook.enabled) return null;

  function insertBlessing() {
    const blessings = guestbookBlessings(config.type);
    setMessage(blessings[Math.floor(Math.random() * blessings.length)]);
  }

  async function loadMore() {
    const oldest = wishes[wishes.length - 1];
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const page = await getWishes(slug, oldest.id);
      setWishes((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await postWish(slug, { name: name.trim(), message: message.trim(), website });
      setWishes((prev) => [saved, ...prev]);
      setName(''); setMessage('');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your wish. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section id="guestbook" title={guestbook.title} subtitle={guestbook.subtitle}>
      {/* Write a wish */}
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto max-w-xl rounded-3xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8"
      >
        {/* Honeypot — visually hidden, skipped by keyboard and screen readers. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />

        <div className="grid gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-muted">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required maxLength={60} placeholder="Aisha" autoComplete="name"
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted">
              <span>Your wish</span>
              <span className={message.length > MAX_MSG * 0.85 ? 'text-rose' : ''}>{message.length}/{MAX_MSG}</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required rows={4} maxLength={MAX_MSG}
              placeholder="Wishing you all the very best…"
              className="mt-2 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>

          <button
            type="button" onClick={insertBlessing}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-accent/40 px-4 py-1.5 text-xs text-accent transition hover:bg-accent/10"
          >
            <Sparkles size={12} /> Inspire me
          </button>

          {error && <p role="alert" className="text-sm text-rose">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Wishes are saved and visible to everyone.
            </p>
            <Button type="submit" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Sending…' : 'Send wish'}
            </Button>
          </div>
        </div>
      </form>

      {/* Wall of wishes */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {wishes.map((w) => (
            <motion.div
              key={w.id}
              layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-accent/15 bg-surface p-5 text-ink shadow-[0_8px_30px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 text-accent">
                <Heart size={14} fill="currentColor" />
                <span className="font-display text-lg text-ink">{w.name}</span>
              </div>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted">{w.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {wishes.length === 0 && !loadFailed && (
          <p className="col-span-full text-center text-sm italic text-fg-soft">Be the first to leave a wish ✨</p>
        )}
        {loadFailed && (
          <p className="col-span-full text-center text-sm italic text-fg-soft">Couldn't load wishes right now.</p>
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-accent/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-fg-soft transition hover:bg-accent/10 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more wishes'}
          </button>
        </div>
      )}
    </Section>
  );
}
