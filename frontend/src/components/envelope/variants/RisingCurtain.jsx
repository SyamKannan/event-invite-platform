// RISING CURTAIN — the whole cover lifts straight up and off screen, like a
// theater curtain, revealing the page underneath. Simple, fast, elegant.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1200;

export function RisingCurtain() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        initial={{ y: 0 }}
        animate={opening ? { y: '-100%' } : { y: 0 }}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
        className="absolute inset-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgb(var(--color-accent) / 0.16), transparent 55%),
            radial-gradient(circle at 20% 85%, rgb(var(--color-rose) / 0.12), transparent 55%),
            ${FLORAL_PATTERN}
          `,
          backgroundSize: 'auto, auto, 80px 80px',
        }}
      >
        {/* Bottom gold trim that catches the light as it rises */}
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <div className="flex h-full w-full items-center justify-center">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label="Open invitation"
          >
            <CoverContent
              opening={opening}
              exitAnimation={{ opacity: [1, 1, 0], y: 0 }}
              exitTransition={{ duration: 0.6, times: [0, 0.5, 1] }}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
