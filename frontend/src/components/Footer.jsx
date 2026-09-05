// FOOTER — couple names, date, contact info, back-to-top, and Instagram.
//
// NEW FEATURES:
//   1. Rotating blessing quotes — a new quote appears every 5 seconds
//   2. Gold animated sparkle ornaments flanking the names
//   3. Subtle animated shimmer on the couple's names

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Heart, Instagram, Mail, Phone, Sparkles } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';

// Beautiful blessings that rotate in the footer.
const BLESSINGS = [
  '"May your love be modern enough to survive the times, and old-fashioned enough to last forever."',
  '"A successful marriage requires falling in love many times, always with the same person."',
  '"The best thing to hold onto in life is each other."',
  '"Where there is great love, there are always wishes."',
  '"You are my today and all of my tomorrows."',
];

export function Footer() {
  const config = useConfig();
  const c = config.contact || {};
  const displayName = config.type === 'birthday'
    ? config.celebrant?.firstName
    : [config.couple?.bride?.firstName, config.couple?.groom?.firstName]
        .filter(Boolean)
        .join(` ${config.couple?.connector ?? '&'} `);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Rotate the blessing quote every 5 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % BLESSINGS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="relative border-t border-accent/15 py-16">
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Sparkle ornaments + couple names */}
        <div className="flex items-center justify-center gap-3">
          <motion.span
            animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-accent text-xl"
          >
            ✦
          </motion.span>

          <p className="shimmer-text font-script text-4xl">
            {displayName}
          </p>

          <motion.span
            animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="text-accent text-xl"
          >
            ✦
          </motion.span>
        </div>

        <p className="mt-3 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.3em] text-fg-soft">
          <span>{config.display.date}</span>
          {config.display.location && (
            <>
              <Heart size={12} className="text-accent" fill="currentColor" />
              <span>{config.display.location}</span>
            </>
          )}
        </p>

        {/* Rotating blessing quote */}
        <div className="mt-8 mx-auto max-w-md min-h-[3.5rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6 }}
              className="font-display italic text-base text-fg-soft/80 leading-relaxed"
            >
              {BLESSINGS[quoteIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Back-to-top button */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="mx-auto mt-8 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 text-accent transition hover:bg-accent/10 hover:-translate-y-0.5"
        >
          <ChevronUp size={20} />
        </button>

        <span
          aria-hidden
          className="mx-auto mt-8 block h-px w-32 bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        />

        {/* Contact */}
        {(c.bridePhone || c.groomPhone || c.email) && (
          <ul className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-fg-soft sm:flex-row sm:gap-8">
            {c.bridePhone && (
              <ContactItem icon={<Phone size={14} />} href={`tel:${c.bridePhone}`}>{c.bridePhone}</ContactItem>
            )}
            {c.groomPhone && (
              <ContactItem icon={<Phone size={14} />} href={`tel:${c.groomPhone}`}>{c.groomPhone}</ContactItem>
            )}
            {c.email && (
              <ContactItem icon={<Mail size={14} />} href={`mailto:${c.email}`}>{c.email}</ContactItem>
            )}
          </ul>
        )}

        {c.instagram && (
          <a
            href={`https://instagram.com/${c.instagram.replace('@', '')}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-accent/40 px-5 py-2 text-xs uppercase tracking-[0.25em] text-fg-soft transition hover:bg-accent/10 hover:text-accent"
          >
            <Instagram size={14} />
            Follow our story
          </a>
        )}

        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-fg-soft/80">
          Made with
          <Heart size={12} className="text-rose" fill="currentColor" />
          for our families and friends
        </p>
      </div>
    </footer>
  );
}

function ContactItem({ icon, href, children }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-accent">{icon}</span>
      <a href={href} className="hover:text-accent">{children}</a>
    </li>
  );
}
