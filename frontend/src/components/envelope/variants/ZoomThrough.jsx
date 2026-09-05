// ZOOM THROUGH — the content rushes toward the viewer and the cover's radial
// vignette rapidly expands, like flying through a gate into the page beyond.

import { motion } from 'framer-motion';
import { CoverContent } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1300;

export function ZoomThrough() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={opening ? { scale: 6, opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
        transition={{ duration: 1.05, ease: [0.6, 0, 0.9, 0.2], times: [0, 0.7, 1] }}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(var(--color-bg)) 0%, rgb(var(--color-bg)) 45%, rgb(var(--color-ink)) 100%)',
        }}
      >
        {/* Concentric gold rings suggest a tunnel/gate */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/20"
            style={{ width: `${140 + i * 160}px`, height: `${140 + i * 160}px` }}
          />
        ))}
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={opening ? { opacity: [0, 0.9, 0] } : { opacity: 0 }}
        transition={{ duration: 1, times: [0, 0.5, 1] }}
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 60%)' }}
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
            exitAnimation={{ opacity: [1, 1, 0], scale: [1, 1.8, 3.2] }}
            exitTransition={{ duration: 0.9, times: [0, 0.4, 1], ease: 'easeIn' }}
          />
        </button>
      </div>
    </div>
  );
}
