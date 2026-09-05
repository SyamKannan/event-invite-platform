// STACKED CARDS — the simplest possible layout: one card per milestone,
// straight down the page, minimal animation. Good for admins who just want
// something clean and low-fuss.

import { motion } from 'framer-motion';

export function StackedLayout({ milestones }) {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      {milestones.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.08 }}
          className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-accent/20 bg-surface p-6 text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)] sm:flex-row sm:items-center"
        >
          {m.image && (
            <img src={m.image} alt={m.title} className="h-32 w-full rounded-xl object-cover sm:h-24 sm:w-32 sm:shrink-0" />
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">{m.date}</p>
            <h3 className="mt-1 font-display text-2xl">{m.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{m.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
