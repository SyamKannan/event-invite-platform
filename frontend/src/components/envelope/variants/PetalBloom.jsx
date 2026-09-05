// PETAL BLOOM — a soft rose-colored bloom expands from the center (a simple,
// reliable radial clip-path reveal, not a 3D wedge fold — an earlier version
// used rotating wedges which looked like a confusing star/X shape mid-turn
// and hid the names too early), while petal-shaped confetti drifts outward.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoverContent } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1500;

export function PetalBloom() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  const drifters = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 260 + Math.random() * 280;
        return {
          key: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: Math.random() * 540 - 270,
          delay: 0.35 + Math.random() * 0.25,
          size: 14 + Math.random() * 10,
        };
      }),
    [],
  );

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Base cover */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgb(var(--color-rose) / 0.35), rgb(var(--color-bg)) 60%)`,
        }}
      />

      {/* The bloom itself — a soft petal-colored disc that grows and fades,
          clipped away entirely once fully open so the page underneath shows. */}
      <motion.div
        aria-hidden
        initial={{ clipPath: 'circle(0% at 50% 45%)', opacity: 1 }}
        animate={
          opening
            ? { clipPath: 'circle(150% at 50% 45%)', opacity: [1, 1, 0] }
            : { clipPath: 'circle(0% at 50% 45%)', opacity: 1 }
        }
        transition={{ duration: 1, delay: 0.25, ease: [0.65, 0.05, 0.35, 1], opacity: { duration: 1, delay: 0.25, times: [0, 0.7, 1] } }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgb(var(--color-rose) / 0.55), rgb(var(--color-bg)) 55%)`,
        }}
      />

      {/* Petal-shaped drift particles blooming outward */}
      {drifters.map((d) => (
        <motion.span
          key={d.key}
          aria-hidden
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={
            opening
              ? { opacity: [0, 1, 0], x: d.x, y: d.y, rotate: d.rotate, scale: [0, 1, 0.7] }
              : { opacity: 0 }
          }
          transition={{ duration: 1.1, delay: d.delay, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-[45%]"
          style={{
            width: `${d.size}px`,
            height: `${d.size * 1.3}px`,
            borderRadius: '100% 0 100% 0',
            background: 'linear-gradient(135deg, rgb(var(--color-rose)), rgb(var(--color-accent)))',
          }}
        />
      ))}

      <div className="relative flex h-full w-full items-center justify-center">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label="Open invitation"
        >
          <CoverContent
            opening={opening}
            exitAnimation={{ opacity: [1, 1, 0], scale: [1, 1.05, 1.15] }}
            exitTransition={{ duration: 0.8, delay: 0.15, times: [0, 0.5, 1] }}
          />
        </button>
      </div>
    </div>
  );
}
