// FLIP BOOK — the cover flips open like a book, hinged on the left edge,
// revealing the page underneath.
//
// Deliberately does NOT rely on backface-visibility to swap in a "page back"
// face mid-rotation — that 3D technique proved unreliable in this app's
// actual DOM (verified empirically: the back face never painted, even with
// an intentionally glaring test color, despite working in an isolated
// minimal reproduction — some interaction with the surrounding page we
// couldn't isolate). Instead the flap fades out via opacity as it crosses
// the 90-degree mark, so there's never a moment where nothing is visible.

import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1300;

export function FlipBook() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ perspective: '2400px' }}>
      {/* Page glimpse underneath, brightening as the flap fades */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.6 }}
        animate={opening ? { opacity: 1 } : { opacity: 0.6 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `radial-gradient(circle at 70% 50%, rgb(var(--color-gold) / 0.14), transparent 60%)`,
        }}
      />

      <motion.div
        initial={{ rotateY: 0, opacity: 1 }}
        animate={
          opening
            ? { rotateY: -100, opacity: [1, 1, 0] }
            : { rotateY: 0, opacity: 1 }
        }
        transition={
          opening
            ? { rotateY: { duration: 0.85, ease: [0.7, 0, 0.3, 1], delay: 0.1 }, opacity: { duration: 0.85, times: [0, 0.55, 1], delay: 0.1 } }
            : { duration: 0.4 }
        }
        style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
        className="absolute inset-y-0 left-0 w-full shadow-[30px_0_60px_-30px_rgba(0,0,0,0.8)]"
      >
        <div
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            backgroundImage: `
              radial-gradient(circle at 15% 30%, rgb(var(--color-accent) / 0.2), transparent 60%),
              radial-gradient(circle at 80% 80%, rgb(var(--color-rose) / 0.12), transparent 55%),
              ${FLORAL_PATTERN}
            `,
            backgroundSize: 'auto, auto, 80px 80px',
          }}
          className="absolute inset-0"
        >
          {/* Spine shadow */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/25 to-transparent" />
          {/* Gold edge on the page's free edge */}
          <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-accent/20 via-accent/70 to-accent/20" />

          <div className="flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={handleOpen}
              className="flex items-center justify-center cursor-pointer focus:outline-none"
              aria-label="Open invitation"
            >
              <CoverContent
                opening={opening}
                exitAnimation={{ opacity: [1, 0.3, 0] }}
                exitTransition={{ duration: 0.5, times: [0, 0.5, 1] }}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sweeping shadow that crosses as the page turns */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={opening ? { opacity: [0, 0.35, 0], x: ['0%', '60%', '120%'] } : { opacity: 0 }}
        transition={{ duration: 0.85, delay: 0.1, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-black/40 to-transparent"
      />
    </div>
  );
}
