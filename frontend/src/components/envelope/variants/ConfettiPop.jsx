// CONFETTI POP — a playful burst of colorful confetti explodes from the CTA
// button, the cover flashes bright, then fades out. Best suited to birthdays.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoverContent } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';

export const DURATION_MS = 1500;

const CONFETTI_COLORS = [
  'rgb(var(--color-accent))',
  'rgb(var(--color-rose))',
  'rgb(var(--color-gold))',
  '#7fd8be',
  '#f5f5f5',
];

export function ConfettiPop() {
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 160 + Math.random() * 420;
        return {
          key: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 60,
          rotate: Math.random() * 900 - 450,
          delay: Math.random() * 0.2,
          size: 6 + Math.random() * 8,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          round: i % 3 === 0,
        };
      }),
    [],
  );

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgb(var(--color-accent) / 0.14), transparent 45%), radial-gradient(circle at 80% 80%, rgb(var(--color-rose) / 0.14), transparent 45%)',
          }}
        />
      </div>

      {/* Flash */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={opening ? { opacity: [0, 0.8, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute inset-0 bg-white"
      />

      {pieces.map((p) => (
        <motion.span
          key={p.key}
          aria-hidden
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={
            opening
              ? { opacity: [0, 1, 1, 0], x: p.x, y: [0, p.y, p.y + 260], rotate: p.rotate }
              : { opacity: 0 }
          }
          transition={{ duration: 1.3, delay: p.delay, times: [0, 0.15, 0.6, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 1 }}
        animate={opening ? { opacity: [1, 1, 0] } : { opacity: 1 }}
        transition={{ duration: 0.9, times: [0, 0.6, 1] }}
        className="relative flex h-full w-full items-center justify-center"
      >
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label="Open invitation"
        >
          <CoverContent
            opening={opening}
            exitAnimation={{ opacity: [1, 1, 0], scale: [1, 1.1, 1.05] }}
            exitTransition={{ duration: 0.5 }}
          />
        </button>
      </motion.div>
    </div>
  );
}
