// GALLERY — masonry grid with lightbox, plus a polaroid featured strip.
//
// NEW FEATURES:
//   1. Polaroid-style featured strip at the top — photos slightly tilted,
//      hover snaps them upright with a shadow pop
//   2. Lightbox now shows caption + image counter
//   3. Touch swipe support on mobile (drag to navigate)
//
// Original features kept:
//   4. Masonry grid
//   5. Click to open full-screen lightbox
//   6. Arrow keys + ESC navigation

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Section } from '../components/ui/Section.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

const spanClass = {
  tall: 'row-span-2',
  wide: 'sm:col-span-2',
  lg: 'sm:col-span-2',
};

// Stable random tilts for polaroids — computed once outside the component.
const POLAROID_TILTS = [-4, 2, -2, 5, -3, 3, -1, 4].map(
  (t) => t + (Math.random() - 0.5) * 2,
);

export function Gallery() {
  const config = useConfig();
  const { gallery } = config;
  const [openIdx, setOpenIdx] = useState(null);
  if (!gallery.enabled) return null;

  // Show first 4 images as polaroids, rest in the masonry grid.
  const polaroids = gallery.images.slice(0, 4);
  const gridImages = gallery.images;

  return (
    <Section id="gallery" title={gallery.title} subtitle={gallery.subtitle} size="lg">

      {/* ── Polaroid featured strip ─────────────────────────────────── */}
      <div className="mb-10 flex items-end justify-center gap-3 sm:gap-5 overflow-x-auto pb-2 px-2">
        {polaroids.map((img, i) => (
          <PolaroidCard
            key={i}
            img={img}
            tilt={POLAROID_TILTS[i] || 0}
            onClick={() => setOpenIdx(i)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* ── Masonry grid ────────────────────────────────────────────── */}
      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {gridImages.map((img, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: (i % 6) * 0.05 }}
            onClick={() => setOpenIdx(i)}
            className={
              'group relative overflow-hidden rounded-xl bg-fg/5 ' +
              (img.span ? spanClass[img.span] || '' : '')
            }
            aria-label={`Open ${img.alt}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            {/* Caption on hover */}
            <p className="absolute bottom-0 inset-x-0 px-3 pb-2 text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-left">
              {img.alt}
            </p>
          </motion.button>
        ))}
      </div>

      <Lightbox
        images={gallery.images}
        index={openIdx}
        onClose={() => setOpenIdx(null)}
        onChange={setOpenIdx}
      />
    </Section>
  );
}

// ── Polaroid card ──────────────────────────────────────────────────────────
function PolaroidCard({ img, tilt, onClick, delay }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -8, scale: 1.05 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="shrink-0 rounded-sm bg-surface p-2 pb-7 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] cursor-pointer"
      style={{ width: 130 }}
      aria-label={`Open ${img.alt}`}
    >
      <img
        src={img.src}
        alt={img.alt}
        loading="lazy"
        className="h-28 w-full object-cover"
      />
      <p className="mt-2 text-center font-script text-base text-muted leading-tight truncate px-1">
        {img.alt}
      </p>
    </motion.button>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose, onChange }) {
  const dragX = useMotionValue(0);

  useEffect(() => {
    if (index === null) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    }
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onChange, onClose]);

  function handleDragEnd(_, info) {
    if (info.offset.x < -60) onChange((index + 1) % images.length);
    else if (info.offset.x > 60) onChange((index - 1 + images.length) % images.length);
  }

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-widest text-white">
            {index + 1} / {images.length}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-8"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-8"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>

          {/* Draggable image for swipe navigation */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-3 cursor-grab active:cursor-grabbing"
          >
            <motion.img
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={images[index].src}
              alt={images[index].alt}
              className="max-h-[80vh] max-w-[88vw] rounded-lg object-contain shadow-2xl"
            />
            {/* Caption below the photo */}
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              {images[index].alt}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
