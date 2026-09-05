// FADE & GLOW — the most minimal, elegant option: content dissolves as a
// warm bloom of light washes across the screen and the cover fades to
// transparent. No moving panels, just light and opacity.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1300;

export function FadeGlow() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        initial={{ opacity: 1 }}
        animate={opening ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `
            radial-gradient(circle at 50% 40%, rgb(var(--color-accent) / 0.16), transparent 55%),
            ${FLORAL_PATTERN}
          `,
          backgroundSize: 'auto, 80px 80px',
        }}
      >
        {/* Warm bloom that washes outward from center */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.3 }}
          animate={opening ? { opacity: [0, 1, 0], scale: [0.3, 2.6, 3.4] } : { opacity: 0, scale: 0.3 }}
          transition={{ duration: 1.1, times: [0, 0.45, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,235,200,0.9) 0%, rgba(255,200,140,0.35) 40%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />

        <div className="flex h-full w-full items-center justify-center">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label="Open invitation"
          >
            <CoverContent
              opening={opening}
              exitAnimation={{ opacity: [1, 0.5, 0] }}
              exitTransition={{ duration: 0.9, times: [0, 0.4, 1] }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
