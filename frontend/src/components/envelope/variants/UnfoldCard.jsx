// UNFOLD CARD — top and bottom flaps fold away like an opened greeting card,
// each hinging along the horizontal center line.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1500;

export function UnfoldCard() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  const flapStyle = {
    backgroundColor: 'rgb(var(--color-bg))',
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgb(var(--color-accent) / 0.16), transparent 60%),
      ${FLORAL_PATTERN}
    `,
    backgroundSize: 'auto, 80px 80px',
    backfaceVisibility: 'hidden',
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ perspective: '2000px' }}>
      {/* Top flap */}
      <motion.div
        initial={{ rotateX: 0 }}
        animate={opening ? { rotateX: 110 } : { rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
        style={{ transformOrigin: 'top center', ...flapStyle }}
        className="absolute inset-x-0 top-0 h-1/2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]"
      />

      {/* Bottom flap */}
      <motion.div
        initial={{ rotateX: 0 }}
        animate={opening ? { rotateX: -110 } : { rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
        style={{ transformOrigin: 'bottom center', ...flapStyle }}
        className="absolute inset-x-0 bottom-0 h-1/2 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.7)]"
      />

      {/* Center crease flare */}
      <motion.div
        aria-hidden
        initial={{ opacity: 1, scaleY: 1 }}
        animate={opening ? { opacity: [1, 1, 0], scaleY: [1, 1.4, 0.3] } : { opacity: 1 }}
        transition={{ duration: 1, times: [0, 0.3, 1], ease: 'easeOut' }}
        className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
      />

      <button
        type="button"
        onClick={handleOpen}
        className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none"
        aria-label="Open invitation"
      >
        <CoverContent opening={opening} />
      </button>
    </div>
  );
}
