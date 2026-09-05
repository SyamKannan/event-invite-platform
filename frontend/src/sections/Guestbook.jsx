// GUESTBOOK — visitors leave wishes that show up below the form.
//
// NEW additions (invitation-appropriate):
//   • "Inspire me" button — fills the message with a beautiful blessing
//   • Emoji reactions on each wish (❤ 🤲 ✨ 🎉)
//   • Character counter on the textarea
//
// Storage: the Laravel API, scoped to this invitation's slug.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Send, Sparkles } from 'lucide-react';
import { Section } from '../components/ui/Section.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { getWishes, postWish } from '../lib/api.js';

const MAX_MSG = 500;
const REACTIONS = ['❤️', '🤲', '✨', '🎉'];

const BLESSINGS = [
  'May your love story be the greatest ever told.',
  'Wishing you endless laughter and a lifetime of joy.',
  'Two hearts, one beautiful journey. Congratulations!',
  'May your home be filled with warmth, love, and laughter.',
  'Here\'s to love, laughter, and happily ever after.',
];

export function Guestbook() {
  const config = useConfig();
  const { guestbook, slug } = config;
  const [wishes, setWishes] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    if (!guestbook.enabled) return;
    getWishes(slug).then(setWishes).catch(() => {});
  }, [guestbook.enabled, slug]);

  if (!guestbook.enabled) return null;

  function insertBlessing() {
    setMessage(BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await postWish(slug, { name: name.trim(), message: message.trim() });
      setWishes((prev) => [saved, ...prev]);
      setName(''); setMessage('');
    } catch {
      setError('Could not save your wish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleReaction(wishId, emoji) {
    setReactions((prev) => {
      const current = new Set(prev[wishId] || []);
      if (current.has(emoji)) current.delete(emoji); else current.add(emoji);
      return { ...prev, [wishId]: current };
    });
  }

  return (
    <Section id="guestbook" title={guestbook.title} subtitle={guestbook.subtitle}>
      {/* Write a wish */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl rounded-3xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8"
      >
        <div className="grid gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-muted">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required maxLength={60} placeholder="Aisha"
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
              placeholder="Wishing you a lifetime of love and laughter…"
              className="mt-2 w-full resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>

          {/* Blessings inspiration button */}
          <button
            type="button" onClick={insertBlessing}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-accent/40 px-4 py-1.5 text-xs text-accent transition hover:bg-accent/10"
          >
            <Sparkles size={12} /> Inspire me
          </button>

          {error && <p className="text-sm text-rose">{error}</p>}

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
          {wishes.map((w) => {
            const wishId = w.id || `${w.name}-${w.created_at}`;
            const myReactions = reactions[wishId] || new Set();
            return (
              <motion.div
                key={wishId} layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-accent/15 bg-surface p-5 text-ink shadow-[0_8px_30px_-20px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-2 text-accent">
                  <Heart size={14} fill="currentColor" />
                  <span className="font-display text-lg text-ink">{w.name}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.message}</p>
                {/* Emoji reactions */}
                <div className="mt-3 flex items-center gap-1.5">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji} type="button"
                      onClick={() => toggleReaction(wishId, emoji)}
                      className={`rounded-full px-2.5 py-1 text-sm transition ${myReactions.has(emoji) ? 'bg-accent/20 ring-1 ring-accent/40' : 'hover:bg-ink/5'}`}
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {wishes.length === 0 && (
          <p className="col-span-full text-center text-sm italic text-muted">Be the first to leave a wish ✨</p>
        )}
      </div>
    </Section>
  );
}
