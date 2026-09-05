// COVER CONTENT — the names/date/CTA block shown on the face of every
// envelope variant. Kept as one shared component so all 11 animations render
// identical text, just wrapped in different motion containers.

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext.jsx';

export function CoverContent({ opening, exitAnimation, exitTransition }) {
  const config = useConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        opening
          ? exitAnimation ?? { opacity: 0, scale: 1.15, y: -8 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        opening
          ? exitTransition ?? { duration: 0.45, ease: 'easeOut' }
          : { duration: 1, delay: 0.2, ease: 'easeOut' }
      }
      className="px-6 text-center"
    >
      {config.envelope.overline && (
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-fg-soft">
          {config.envelope.overline}
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <span className="divider-ornament text-accent">✦</span>
      </div>

      {config.type === 'birthday' ? (
        <h1 className="mt-6 font-script text-5xl sm:text-7xl text-accent leading-tight">
          {config.celebrant?.firstName}
        </h1>
      ) : (
        <>
          {config.couple?.bride && (
            <h1 className="mt-6 font-script text-5xl sm:text-7xl text-accent leading-tight">
              {config.couple.bride.firstName}
            </h1>
          )}
          {config.couple?.bride && config.couple?.groom && (
            <p className="my-1 font-display text-xl text-fg/60">{config.couple.connector ?? '&'}</p>
          )}
          {config.couple?.groom && (
            <h1 className="font-script text-5xl sm:text-7xl text-accent leading-tight">
              {config.couple.groom.firstName}
            </h1>
          )}
        </>
      )}

      <div className="mt-8 flex justify-center">
        <span className="divider-ornament text-accent">✦</span>
      </div>

      <p className="mt-6 text-sm uppercase tracking-[0.3em] text-fg-soft">
        {config.display.date}
      </p>

      {/* The "open" pill — gently bounces */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-3 text-sm tracking-wide text-accent shadow-[0_8px_24px_-12px_rgb(var(--color-accent)/0.5)] backdrop-blur-sm"
      >
        <Mail size={16} />
        {config.envelope.cta}
      </motion.div>
    </motion.div>
  );
}

// Shared decorative pattern used by several variants for a "wine + gold
// floral" backdrop.
export const FLORAL_PATTERN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23d4a85f' stroke-opacity='0.18' stroke-width='0.6'><circle cx='40' cy='40' r='14'/><circle cx='40' cy='40' r='6'/><path d='M40 18 L40 26 M40 54 L40 62 M18 40 L26 40 M54 40 L62 40'/></g></svg>\")";
