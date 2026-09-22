// NAVBAR — a sticky floating nav that appears after scrolling past the hero.
//
// Features:
//   • Fades in after the visitor scrolls 80px
//   • Highlights the active section using IntersectionObserver
//   • Collapses to a hamburger menu on mobile
//   • Only lists sections this invitation actually renders (a type without
//     RSVP, or a story with no milestones, gets no dead link), labelled with
//     that section's own title so the wording fits the event type

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';
import { displayName } from '../lib/invitationText.js';

// `id` must match the `id="..."` of each section in the page.
function navLinks(config) {
  return [
    { id: 'countdown', label: 'Countdown', enabled: config.countdown?.enabled },
    { id: 'story', label: config.story?.title || 'Story', enabled: config.story?.enabled },
    { id: 'schedule', label: config.schedule?.title || 'Schedule', enabled: config.schedule?.enabled },
    { id: 'rsvp', label: 'RSVP', enabled: config.rsvp?.enabled },
    { id: 'gallery', label: config.gallery?.title || 'Gallery', enabled: config.gallery?.enabled },
    { id: 'guestbook', label: 'Guestbook', enabled: config.guestbook?.enabled },
  ].filter((link) => link.enabled);
}

export function NavBar() {
  const config = useConfig();
  const name = displayName(config);
  const links = useMemo(() => navLinks(config), [config]);

  // Whether we've scrolled enough to show the nav
  const [visible, setVisible] = useState(false);
  // Which section is currently in the viewport
  const [activeId, setActiveId] = useState('');
  // Mobile menu open/closed
  const [menuOpen, setMenuOpen] = useState(false);

  // Show/hide nav on scroll
  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track which section is active using IntersectionObserver.
  useEffect(() => {
    const observers = [];

    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { threshold: 0.3 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [links]);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4 }}
          className="fixed top-4 inset-x-4 z-50 mx-auto max-w-3xl"
          aria-label="Main navigation"
        >
          <div className="nav-blur flex items-center justify-between rounded-full border border-accent/20 bg-bg/70 px-5 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="font-script text-xl text-accent leading-none"
              aria-label="Back to top"
            >
              {name}
            </button>

            {links.length > 0 && (
              <>
                {/* Desktop links */}
                <ul className="hidden sm:flex items-center gap-1">
                  {links.map(({ id, label }) => (
                    <li key={id}>
                      <button
                        onClick={() => scrollTo(id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition ${
                          activeId === id
                            ? 'bg-accent/15 text-accent'
                            : 'text-fg-soft hover:text-fg'
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Mobile hamburger */}
                <button
                  className="sm:hidden text-fg-soft hover:text-fg transition p-1"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="mt-2 rounded-2xl border border-accent/20 bg-bg/90 nav-blur p-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]"
              >
                {links.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`block w-full rounded-xl px-4 py-3 text-left text-sm uppercase tracking-[0.2em] transition ${
                      activeId === id
                        ? 'bg-accent/15 text-accent'
                        : 'text-fg-soft hover:bg-fg/5 hover:text-fg'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
