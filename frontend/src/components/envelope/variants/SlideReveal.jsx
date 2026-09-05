// SLIDE REVEAL — a single panel slides off to the right with a subtle
// parallax on the content, and a thin gold rail trails behind the edge.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1200;

export function SlideReveal() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        initial={{ x: 0 }}
        animate={opening ? { x: '100%' } : { x: 0 }}
        transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
        className="absolute inset-0 shadow-[30px_0_60px_-30px_rgba(0,0,0,0.7)]"
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgb(var(--color-accent) / 0.16), transparent 55%),
            radial-gradient(circle at 80% 80%, rgb(var(--color-rose) / 0.1), transparent 55%),
            ${FLORAL_PATTERN}
          `,
          backgroundSize: 'auto, auto, 80px 80px',
        }}
      >
        <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-accent/10 via-accent/70 to-accent/10" />

        <div className="flex h-full w-full items-center justify-center">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label="Open invitation"
          >
            <CoverContent
              opening={opening}
              exitAnimation={{ opacity: [1, 1, 0], x: [0, -30, -60] }}
              exitTransition={{ duration: 0.7, times: [0, 0.5, 1] }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
