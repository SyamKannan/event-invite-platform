// GALLERY — masonry grid with lightbox, plus a polaroid featured strip.
//
//   1. Polaroid strip of the first few photos — tilted, hover snaps upright.
//      Only shown when there are enough photos that the strip isn't just a
//      duplicate of the grid below it; the grid then starts after them.
//   2. Lightbox with caption + counter, arrow keys, ESC, and swipe
//   3. Focus moves into the lightbox on open and back to the thumbnail on
//      close, so it's usable from the keyboard

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

  // With more than 6 photos, feature the first 4 as polaroids and start
  // the grid after them — otherwise those 4 would appear twice on the page.
  const featureCount = gallery.images.length > 6 ? 4 : 0;
  const polaroids = gallery.images.slice(0, featureCount);
  const gridImages = gallery.images.slice(featureCount);

  return (
    <Section id="gallery" title={gallery.title} subtitle={gallery.subtitle} size="lg">

      {/* ── Polaroid featured strip ─────────────────────────────────── */}
      {polaroids.length > 0 && (
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
      )}

      {/* ── Masonry grid ────────────────────────────────────────────── */}
      <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {gridImages.map((img, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: (i % 6) * 0.05 }}
            onClick={() => setOpenIdx(featureCount + i)}
            className={
              'group relative overflow-hidden rounded-xl bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
              (img.span ? spanClass[img.span] || '' : '')
            }
            aria-label={img.alt ? `Open photo: ${img.alt}` : `Open photo ${featureCount + i + 1}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
      className="shrink-0 cursor-pointer rounded-sm bg-surface p-2 pb-7 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ width: 130 }}
      aria-label={img.alt ? `Open photo: ${img.alt}` : 'Open photo'}
    >
      <img
        src={img.src}
        alt={img.alt}
        loading="lazy"
        className="h-28 w-full object-cover"
      />
    </motion.button>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose, onChange }) {
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const open = index !== null;
  const many = images.length > 1;

  // Move focus into the dialog on open and hand it back on close, so
  // keyboard users aren't left tabbing the page behind the overlay.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (!many) return;
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    }
    const previousOverflow = document.body.style.overflow;
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, many, index, images.length, onChange, onClose]);

  function handleDragEnd(_, info) {
    if (info.offset.x < -60) onChange((index + 1) % images.length);
    else if (info.offset.x > 60) onChange((index - 1 + images.length) % images.length);
  }

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Counter */}
          {many && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-widest text-white">
              {index + 1} / {images.length}
            </div>
          )}

          <button
            ref={closeRef}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {many && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }}
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-8"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {many && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }}
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-8"
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
          )}

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
              alt={images[index].alt || ''}
              className="max-h-[78vh] max-w-[88vw] rounded-lg object-contain shadow-2xl"
            />
            {/* The caption the admin typed — previously only ever used as
                alt text, so guests never saw it. */}
            {images[index].alt && images[index].alt !== 'Gallery photo' && (
              <p className="max-w-[88vw] text-center text-sm text-white/80">{images[index].alt}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
