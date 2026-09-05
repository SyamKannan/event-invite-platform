// HORIZONTAL SCROLL — a swipeable row of story cards. Works especially well
// on mobile (native touch scroll, no extra library) and reads like a strip
// of photo-booth prints.

import { motion } from 'framer-motion';

export function HorizontalScrollLayout({ milestones }) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      {milestones.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="w-[280px] shrink-0 snap-center overflow-hidden rounded-3xl border border-accent/20 bg-surface text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)] sm:w-[340px]"
        >
          {m.image && (
            <img src={m.image} alt={m.title} className="h-44 w-full object-cover" />
          )}
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">{m.date}</p>
            <h3 className="mt-2 font-display text-2xl">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{m.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
