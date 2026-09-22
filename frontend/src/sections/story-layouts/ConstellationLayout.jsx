// CONSTELLATION — the original "Our Journey" layout. Each milestone is a
// glowing gold star on a starfield; click a star to expand its story card.
//
// Positions: milestones may carry an x/y (0-100, percent) from the database,
// but the admin editor no longer exposes manual positioning — so if x/y are
// missing (new milestones, or older data with only date/title/description),
// we auto-space them along the same gentle zigzag curve the original seeded
// data used, keeping this layout usable with zero manual coordinate entry.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';

// Spread stars over as many rows as needed: with more than 4 milestones a
// single zigzag packs them too tightly to read on a phone (labels overlap),
// so they wrap onto 3 rows instead.
function autoPosition(index, total) {
  if (total <= 1) return { x: 50, y: 50 };

  const rows = total > 8 ? 4 : total > 4 ? 3 : 2;
  const perRow = Math.ceil(total / rows);
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const colsInRow = Math.min(perRow, total - row * perRow);

  const x = colsInRow === 1 ? 50 : 16 + (68 * col) / (colsInRow - 1);
  const y = 14 + (72 * row) / (rows - 1);

  // Nudge alternate rows sideways so stars don't line up in rigid columns.
  return { x: Math.min(92, Math.max(8, x + (row % 2 ? 6 : -6))), y };
}

export function ConstellationLayout({ milestones }) {
  const [openIdx, setOpenIdx] = useState(null);

  const positioned = useMemo(
    () =>
      milestones.map((m, i) => {
        const hasPosition = typeof m.x === 'number' && typeof m.y === 'number';
        return hasPosition ? m : { ...m, ...autoPosition(i, milestones.length) };
      }),
    [milestones],
  );

  const bgStars = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        opacity: 0.3 + Math.random() * 0.5,
        twinkle: Math.random() * 6 + 2,
      })),
    [],
  );

  return (
    <>
      <div
        className="relative mx-auto h-[640px] w-full overflow-hidden rounded-3xl border border-accent/15 sm:h-[680px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgb(var(--color-rose) / 0.28), rgb(var(--color-bg) / 0.97))',
        }}
      >
        {bgStars.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-fg"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity }}
            animate={{ opacity: [s.opacity, s.opacity * 0.3, s.opacity] }}
            transition={{ duration: s.twinkle, repeat: Infinity }}
          />
        ))}

        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {positioned.slice(0, -1).map((m, i) => {
            const next = positioned[i + 1];
            return (
              <line
                key={i}
                x1={m.x} y1={m.y} x2={next.x} y2={next.y}
                stroke="rgb(var(--color-accent) / 0.5)"
                strokeWidth="0.15"
                strokeDasharray="0.6 0.6"
              />
            );
          })}
        </svg>

        {positioned.map((m, i) => (
          <StarNode key={i} milestone={m} index={i} active={openIdx === i} onClick={() => setOpenIdx(i)} />
        ))}

        <AnimatePresence>
          {openIdx !== null && (
            <>
              {/* Click-outside target, behind the card but over the sky. */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => setOpenIdx(null)}
                aria-hidden
              />
              <MilestoneCard milestone={positioned[openIdx]} index={openIdx} onClose={() => setOpenIdx(null)} />
            </>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-fg-soft">
        Tap a star to open its story
      </p>
    </>
  );
}

function StarNode({ milestone, index, active, onClick }) {
  const labelAbove = milestone.y > 55;

  const label = (
    <>
      <span className="text-[10px] uppercase tracking-[0.25em] text-fg-soft">
        Step {String(index + 1).padStart(2, '0')}
      </span>
      <span className="font-display text-sm text-fg/90">{milestone.date}</span>
    </>
  );

  return (
    <motion.button
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? 'z-30' : 'z-[1]'}`}
      aria-label={`${milestone.date}: ${milestone.title}`}
      style={{ left: `${milestone.x}%`, top: `${milestone.y}%` }}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
    >
      {labelAbove && <div className="mb-2 flex flex-col items-center">{label}</div>}

      <div className="relative flex items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute h-14 w-14 rounded-full bg-accent/30 blur-md"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-accent/60 bg-bg/40 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Star size={20} className="text-accent" fill="currentColor" />
        </span>
      </div>

      {!labelAbove && <div className="mt-2 flex flex-col items-center">{label}</div>}
    </motion.button>
  );
}

function MilestoneCard({ milestone, index, onClose }) {
  const closeRef = useRef(null);

  // Focus the card's own control on open (and allow Escape) so the story
  // can be read and dismissed without a mouse.
  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={milestone.title}
      className="absolute inset-4 z-20 mx-auto my-auto flex max-w-md items-center justify-center sm:inset-8"
    >
      <div className="relative w-full rounded-2xl border border-accent/20 bg-bg/80 p-7 text-fg shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {milestone.image && (
          <div className="relative mb-5 overflow-hidden rounded-xl">
            <img src={milestone.image} alt={milestone.title} className="h-44 w-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-bg/80 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-accent">
              Step {index + 1}
            </span>
          </div>
        )}

        <p className="text-xs uppercase tracking-[0.3em] text-accent">{milestone.date}</p>
        <h3 className="mt-2 font-display text-3xl">{milestone.title}</h3>
        {milestone.description && <p className="mt-3 leading-relaxed text-fg-soft">{milestone.description}</p>}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-xs uppercase tracking-[0.25em] text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Star size={14} /> Back to sky
        </button>
      </div>
    </motion.div>
  );
}
