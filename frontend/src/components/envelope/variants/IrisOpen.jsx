// IRIS OPEN — a circular aperture at the center expands outward like a
// camera shutter or a spotlight widening, using a radial clip-path mask.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1400;

export function IrisOpen() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Faint glimpse of what's beneath, growing brighter as the iris opens */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgb(var(--color-bg))' }} />

      <motion.div
        initial={{ clipPath: 'circle(150% at 50% 50%)' }}
        animate={
          opening
            ? { clipPath: 'circle(0% at 50% 50%)' }
            : { clipPath: 'circle(150% at 50% 50%)' }
        }
        transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `
            radial-gradient(circle at 50% 45%, rgb(var(--color-accent) / 0.18), transparent 55%),
            ${FLORAL_PATTERN}
          `,
          backgroundSize: 'auto, 80px 80px',
        }}
      >
        {/* Gold ring that traces the shrinking iris edge */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={opening ? { opacity: [0, 1, 0] } : { opacity: 0 }}
          transition={{ duration: 1.1, times: [0, 0.5, 1] }}
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 0 3px rgb(var(--color-accent) / 0.6)',
            borderRadius: '9999px',
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
              exitAnimation={{ opacity: [1, 0.6, 0], scale: [1, 0.9, 0.7] }}
              exitTransition={{ duration: 0.8, times: [0, 0.5, 1] }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
