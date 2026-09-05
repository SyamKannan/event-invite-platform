// SWING DOORS — the original cover animation. Two panels swing open in 3D
// like ornate wedding doors, each rotating outward around its OUTER hinge,
// with a golden flare + particle burst at the center seam.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1700;

export function SwingDoors() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 220 + Math.random() * 320;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.7,
          size: 4 + Math.random() * 6,
          delay: 0.15 + Math.random() * 0.25,
          rotate: Math.random() * 720 - 360,
          key: i,
        };
      }),
    [],
  );

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ perspective: '1600px' }}>
      <motion.div
        initial={{ rotateY: 0 }}
        animate={opening ? { rotateY: -98 } : { rotateY: 0 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], delay: 0.25 }}
        style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden shadow-[20px_0_40px_-20px_rgba(0,0,0,0.7)]"
      >
        <CurtainPanel side="left" />
      </motion.div>

      <motion.div
        initial={{ rotateY: 0 }}
        animate={opening ? { rotateY: 98 } : { rotateY: 0 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], delay: 0.25 }}
        style={{ transformOrigin: 'right center', backfaceVisibility: 'hidden' }}
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.7)]"
      >
        <CurtainPanel side="right" />
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 1, scaleX: 1, scaleY: 1 }}
        animate={
          opening
            ? { opacity: [1, 1, 0], scaleX: [1, 4, 1], scaleY: [1, 1.05, 0.4] }
            : { opacity: 1 }
        }
        transition={{ duration: 1.2, times: [0, 0.25, 1], ease: 'easeOut' }}
        className="pointer-events-none absolute inset-y-8 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-accent to-transparent"
        style={{ filter: 'blur(0.4px)' }}
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0 }}
        animate={
          opening
            ? { opacity: [0, 0.85, 0], scale: [0.2, 1.6, 2.4] }
            : { opacity: 0, scale: 0 }
        }
        transition={{ duration: 1.4, times: [0, 0.35, 1], ease: 'easeOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,215,140,0.85) 0%, rgba(255,180,90,0.4) 35%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {particles.map((p) => (
        <motion.span
          key={p.key}
          aria-hidden
          initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={
            opening
              ? {
                  opacity: [0, 1, 1, 0],
                  x: [0, p.x * 0.4, p.x],
                  y: [0, p.y * 0.4, p.y],
                  scale: [0, 1, 0.6],
                  rotate: p.rotate,
                }
              : { opacity: 0 }
          }
          transition={{ duration: 1.2, delay: p.delay, times: [0, 0.25, 0.6, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, rgb(255,225,160) 0%, rgb(212,168,95) 60%, transparent 100%)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(255,200,120,0.7)',
          }}
        />
      ))}

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

function CurtainPanel({ side }) {
  const edgeClass =
    side === 'left'
      ? 'right-0 bg-gradient-to-l from-accent/40 via-accent/10 to-transparent'
      : 'left-0 bg-gradient-to-r from-accent/40 via-accent/10 to-transparent';

  return (
    <div
      className="relative h-full w-full"
      style={{
        backgroundColor: 'rgb(var(--color-bg))',
        backgroundImage: `
          radial-gradient(circle at ${side === 'left' ? '90%' : '10%'} 40%, rgb(var(--color-accent) / 0.18), transparent 60%),
          radial-gradient(circle at ${side === 'left' ? '20%' : '80%'} 80%, rgb(var(--color-rose) / 0.12), transparent 60%),
          ${FLORAL_PATTERN}
        `,
        backgroundSize: 'auto, auto, 80px 80px',
      }}
    >
      <div className={`absolute inset-y-0 w-12 ${edgeClass}`} />
      <div
        aria-hidden
        className={`absolute inset-y-0 w-1/2 pointer-events-none ${side === 'left' ? 'right-0' : 'left-0'}`}
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.04))'
              : 'linear-gradient(to left, transparent, rgba(255,255,255,0.04))',
        }}
      />
    </div>
  );
}
