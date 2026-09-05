// PHOTO MOSAIC — an image-forward grid of story moments, captions revealed
// on hover. Mirrors Gallery.jsx's masonry visual language for consistency.

import { motion } from 'framer-motion';

export function MosaicLayout({ milestones }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {milestones.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: (i % 6) * 0.05 }}
          className={`group relative overflow-hidden rounded-xl bg-fg/5 ${i === 0 ? 'col-span-2 row-span-2 sm:col-span-2' : ''}`}
          style={{ aspectRatio: i === 0 ? '4 / 3' : '1 / 1' }}
        >
          {m.image ? (
            <img
              src={m.image}
              alt={m.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-bg/40 text-fg-soft">
              <span className="font-script text-3xl">{m.date}</span>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">{m.date}</p>
            <p className="font-display text-lg text-white">{m.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-white/80">{m.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
