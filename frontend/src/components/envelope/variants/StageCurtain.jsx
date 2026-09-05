// STAGE CURTAIN — a classic theater curtain: two heavy draped panels meet at
// the center and part sideways (left panel to the left, right panel to the
// right), each with vertical fold texture and a gold trim along the meeting
// edge, like the reveal at the start of a show.

import { motion } from 'framer-motion';
import { CoverContent } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1400;

export function StageCurtain() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        initial={{ x: 0 }}
        animate={opening ? { x: '-102%' } : { x: 0 }}
        transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        className="absolute inset-y-0 left-0 w-1/2 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.7)]"
      >
        <CurtainPanel side="left" />
      </motion.div>

      <motion.div
        initial={{ x: 0 }}
        animate={opening ? { x: '102%' } : { x: 0 }}
        transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        className="absolute inset-y-0 right-0 w-1/2 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.7)]"
      >
        <CurtainPanel side="right" />
      </motion.div>

      {/* Gold tassel/trim glinting at the center seam before it parts */}
      <motion.div
        aria-hidden
        initial={{ opacity: 1 }}
        animate={opening ? { opacity: [1, 1, 0] } : { opacity: 1 }}
        transition={{ duration: 0.8, times: [0, 0.2, 1] }}
        className="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-transparent via-accent to-transparent"
      />

      <div className="relative flex h-full w-full items-center justify-center">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label="Open invitation"
        >
          <CoverContent
            opening={opening}
            exitAnimation={{ opacity: [1, 1, 0] }}
            exitTransition={{ duration: 0.6, times: [0, 0.35, 1] }}
          />
        </button>
      </div>
    </div>
  );
}

// One curtain panel — deep rose/wine drapery with vertical fold shading and a
// gold edge along the seam where the two panels meet.
function CurtainPanel({ side }) {
  const foldCount = 7;
  const folds = Array.from({ length: foldCount }).map((_, i) => {
    const pos = ((i + 0.5) / foldCount) * 100;
    return (
      <div
        key={i}
        aria-hidden
        className="absolute inset-y-0"
        style={{
          left: `${pos}%`,
          width: '18%',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(0,0,0,0.28), transparent 70%)',
        }}
      />
    );
  });

  const edgeClass =
    side === 'left'
      ? 'right-0 bg-gradient-to-l from-accent/50 via-accent/15 to-transparent'
      : 'left-0 bg-gradient-to-r from-accent/50 via-accent/15 to-transparent';

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgb(var(--color-rose)) 0%, rgb(var(--color-bg)) 55%, rgb(var(--color-ink)) 100%)',
      }}
    >
      {folds}
      {/* Top valance shadow */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent" />
      {/* Gold edge at the meeting seam */}
      <div className={`absolute inset-y-0 w-2 ${edgeClass}`} />
    </div>
  );
}
