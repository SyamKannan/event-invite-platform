// PETAL BLOOM — wedge-shaped "petals" radiate from the center and fold flat
// outward like a flower opening, with soft petal-shaped confetti drifting
// free once bloomed.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoverContent } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1600;

const PETAL_COUNT = 8;
// Each petal is a wide triangular wedge, oversized so neighbors overlap and
// fully tile the circle with no gaps once fanned around the center.
const PETAL_HALF_ANGLE_DEG = (360 / PETAL_COUNT) * 0.75;

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
          delay: 0.2 + Math.random() * 0.3,
          size: 14 + Math.random() * 10,
        };
      }),
    [],
  );

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ perspective: '1800px' }}>
      {/* Base fill so there's never a gap visible behind the petals */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgb(var(--color-bg))' }} />

      {Array.from({ length: PETAL_COUNT }).map((_, i) => {
        const rotate = (360 / PETAL_COUNT) * i;
        const half = PETAL_HALF_ANGLE_DEG;
        return (
          <motion.div
            key={i}
            aria-hidden
            initial={{ rotateX: 0 }}
            animate={opening ? { rotateX: -120 } : { rotateX: 0 }}
            transition={{ duration: 1.1, ease: [0.65, 0.05, 0.35, 1], delay: 0.1 + i * 0.03 }}
            className="absolute left-1/2 top-1/2"
            style={{
              width: '200vmax',
              height: '200vmax',
              marginLeft: '-100vmax',
              marginTop: '-100vmax',
              transform: `rotate(${rotate}deg)`,
              transformOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
              // A wide triangular wedge pointing "up" from the center,
              // spanning +/- half the petal angle so neighbors overlap.
              clipPath: `polygon(50% 50%, ${50 - 50 * Math.tan((half * Math.PI) / 180)}% 0%, ${50 + 50 * Math.tan((half * Math.PI) / 180)}% 0%)`,
            }}
          >
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgb(var(--color-rose) / 0.55), rgb(var(--color-bg)) 45%)`,
              }}
            />
          </motion.div>
        );
      })}

      {/* Petal-shaped drift particles once bloomed */}
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
          transition={{ duration: 1.3, delay: d.delay, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2"
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
          <CoverContent opening={opening} />
        </button>
      </div>
    </div>
  );
}
