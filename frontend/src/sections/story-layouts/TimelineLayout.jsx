// VERTICAL TIMELINE — a classic top-to-bottom line with cards alternating
// left/right. The most familiar, easiest-to-scan "our story" layout.

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export function TimelineLayout({ milestones }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* The vertical line running down the center. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-accent/40 to-transparent sm:block"
      />

      <div className="grid gap-10">
        {milestones.map((m, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`relative grid items-center gap-6 sm:grid-cols-2 ${isLeft ? '' : 'sm:[&>*:first-child]:order-2'}`}
            >
              {/* Card */}
              <div className={`rounded-2xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)] ${isLeft ? 'sm:text-right' : ''}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">{m.date}</p>
                <h3 className="mt-2 font-display text-2xl">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.description}</p>
              </div>

              {/* Photo (or a heart marker if none) */}
              <div className={isLeft ? '' : ''}>
                {m.image ? (
                  <img src={m.image} alt={m.title} className="h-48 w-full rounded-2xl object-cover shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]" />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-accent/20 bg-bg/40">
                    <Heart size={28} className="text-accent/60" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Center dot on the line */}
              <span
                aria-hidden
                className="absolute left-1/2 top-6 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_4px_rgb(var(--color-bg))] sm:block"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
