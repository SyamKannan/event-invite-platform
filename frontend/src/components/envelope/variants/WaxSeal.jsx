// WAX SEAL — a round wax seal sits over the content; tapping it cracks the
// seal in half and the two halves fall away before the cover fades out.

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { CoverContent, FLORAL_PATTERN } from '../CoverContent.jsx';
import { useEnvelopeOpen } from '../useEnvelopeOpen.js';
import { useConfig } from '../../../context/ConfigContext.jsx';

export const DURATION_MS = 1600;

export function WaxSeal() {
  const config = useConfig();
  const { opening, done, handleOpen } = useEnvelopeOpen(DURATION_MS);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgb(var(--color-bg))',
          backgroundImage: `
            radial-gradient(circle at 50% 40%, rgb(var(--color-accent) / 0.14), transparent 55%),
            ${FLORAL_PATTERN}
          `,
          backgroundSize: 'auto, 80px 80px',
        }}
      >
        {/* Background content fades in once the seal cracks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={opening ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex h-full w-full items-center justify-center"
        >
          <CoverContent opening={false} />
        </motion.div>
      </div>

      {/* The two seal halves */}
      {!opening && (
        <button
          type="button"
          onClick={handleOpen}
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer focus:outline-none"
          aria-label="Break the seal to open invitation"
        >
          <div className="relative h-40 w-40">
            <SealHalf side="left" opening={opening} />
            <SealHalf side="right" opening={opening} />
            <Mail className="pointer-events-none absolute inset-0 m-auto text-bg" size={36} />
          </div>
        </button>
      )}

      {opening && (
        <>
          <SealHalf side="left" opening={opening} />
          <SealHalf side="right" opening={opening} />
        </>
      )}
    </div>
  );
}

function SealHalf({ side, opening }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      initial={{ x: 0, rotate: 0, opacity: 1 }}
      animate={
        opening
          ? { x: isLeft ? -160 : 160, y: 220, rotate: isLeft ? -140 : 140, opacity: [1, 1, 0] }
          : { x: 0, rotate: 0, opacity: 1 }
      }
      transition={{ duration: 0.9, ease: 'easeIn', times: opening ? [0, 0.6, 1] : undefined }}
      className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        clipPath: isLeft ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
        background:
          'radial-gradient(circle at 35% 30%, rgb(var(--color-rose)), rgb(var(--color-gold)) 70%)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.25)',
      }}
    />
  );
}
