// HERO — first big screen on the page. Photo background with the hosts'
// names in clean ivory serif on top, plus three "scratch to reveal" gold
// coins that hide the event date until the visitor scratches them (only
// shown once the admin has actually set a date).
//
// NEW FEATURES ADDED:
//   1. Rose-petal rain — CSS-animated petals drift down over the hero
//   2. Ambient glow orbs — soft bokeh circles floating in the background
//   3. Animated connector line under the names
//
// Original effects kept:
//   4. Parallax background photo
//   5. Letter-by-letter name reveal
//   6. Three scratch-off coins that hide the date
//   7. Bouncing scroll-down arrow

import { useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Heart } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';
import { getAnimationPreset } from '../lib/animationPresets.js';
import { eventDate } from '../lib/invitationText.js';

// Rose petals suit a wedding/anniversary; everything else gets a neutral
// sparkle so a business opening doesn't rain flowers.
const PETAL_GLYPH = { wedding: '🌸', anniversary: '🌸' };
import { ScratchCoin } from '../components/ScratchReveal.jsx';

export function Hero() {
  const config = useConfig();
  const { couple, celebrant, hero, display } = config;
  const isBirthday = config.type === 'birthday';
  const { particleMultiplier, speedMultiplier } = getAnimationPreset(config.animationIntensity);
  const petalCount = Math.max(0, Math.round(18 * particleMultiplier));

  // The envelope cover (when enabled) sits on top of the page until tapped,
  // but its own name-reveal animation runs independently of Hero's — without
  // this gate, Hero's AnimatedName plays immediately on mount, in the same
  // screen position as the still-visible envelope's names, and the two
  // double-expose each other. Wait for the 'envelope:opened' event (already
  // dispatched by useEnvelopeOpen.js for MusicToggle) before revealing.
  const [nameRevealReady, setNameRevealReady] = useState(!config.envelope.enabled);
  useEffect(() => {
    if (!config.envelope.enabled) return;
    const onOpened = () => setNameRevealReady(true);
    window.addEventListener('envelope:opened', onOpened);
    // Safety net: if the cover never reports opening (e.g. its component
    // errored and an ErrorBoundary removed it), reveal anyway rather than
    // leaving the hero permanently blank.
    const fallback = setTimeout(() => setNameRevealReady(true), 8000);
    return () => {
      window.removeEventListener('envelope:opened', onOpened);
      clearTimeout(fallback);
    };
  }, [config.envelope.enabled]);

  const { scrollY } = useScroll();
  const bgShift = useTransform(scrollY, [0, 800], [0, 200]);

  const date = eventDate(config);
  const day = date ? String(date.getDate()).padStart(2, '0') : '';
  const monthShort = date ? date.toLocaleString(undefined, { month: 'short' }).toUpperCase() : '';
  const year = date ? String(date.getFullYear()) : '';
  const petalGlyph = PETAL_GLYPH[config.type] || '✧';
  // The scroll-hint arrow targets the first section that actually renders.
  const nextSectionId = ['countdown', 'story', 'schedule', 'rsvp', 'gallery', 'guestbook']
    .find((id) => config[id]?.enabled);

  // Pre-compute petal data once so positions stay stable across re-renders.
  const petals = useMemo(
    () =>
      Array.from({ length: petalCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: (8 + Math.random() * 10) * speedMultiplier,
        delay: Math.random() * 14,
        size: 10 + Math.random() * 14,
        drift: (Math.random() - 0.5) * 80,
        rotate: Math.random() * 720,
        opacity: 0.3 + Math.random() * 0.4,
      })),
    [petalCount, speedMultiplier],
  );

  // Ambient bokeh orbs for depth.
  const orbs = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        cx: 15 + i * 18,
        cy: 10 + Math.random() * 80,
        size: 80 + Math.random() * 180,
        isAccent: i % 2 === 0,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
      })),
    [],
  );

  if (!hero?.enabled) return null;

  return (
    <section
      id="home"
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      {/* Background photo with parallax. */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgShift }}>
        {/* No photo uploaded yet: a themed gradient wash rather than a flat
            slab of background color. */}
        {!hero.backgroundImage && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgb(var(--color-accent) / 0.22), transparent 55%), radial-gradient(ellipse at 75% 80%, rgb(var(--color-rose) / 0.2), transparent 60%)',
            }}
          />
        )}
        {hero.backgroundImage && (
          <img
            src={hero.backgroundImage}
            alt=""
            className="h-[120%] w-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
        )}
        <div className="absolute inset-0 bg-bg/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg" />
      </motion.div>

      {/* Ambient bokeh orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${orb.cx}%`,
            top: `${orb.cy}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: orb.isAccent
              ? 'radial-gradient(circle, rgb(var(--color-accent) / 0.18), transparent 70%)'
              : 'radial-gradient(circle, rgb(var(--color-rose) / 0.15), transparent 70%)',
            filter: 'blur(32px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ y: [-12, 12, -12], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Rose-petal rain */}
      {petals.map((p) => (
        <motion.div
          key={p.id}
          aria-hidden
          className="pointer-events-none absolute -top-8 select-none"
          style={{ left: `${p.left}%`, fontSize: `${p.size}px`, opacity: p.opacity }}
          animate={{
            y: ['0vh', '115vh'],
            x: [0, p.drift],
            rotate: [0, p.rotate],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        >
          {petalGlyph}
        </motion.div>
      ))}

      {/* Two faint rotating gold rings */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-8 top-24 h-24 w-24 rounded-full border border-accent/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-32 right-10 h-32 w-32 rounded-full border border-rose/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content — withheld until the envelope cover (if any) has been
          opened, so its name-reveal animation doesn't double-expose with
          the envelope's own names while the cover is still on screen. */}
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        {nameRevealReady && hero.overline && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xs uppercase tracking-[0.4em] text-fg-soft"
          >
            {hero.overline}
          </motion.p>
        )}

        <h1 className="mt-8 font-display text-5xl leading-[0.95] text-fg sm:text-7xl md:text-8xl">
          {nameRevealReady && (isBirthday ? (
            <>
              <AnimatedName name={celebrant?.firstName} delay={0.4} />
              {celebrant?.turningText && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.9 }}
                  className="my-4 block font-script text-5xl text-accent sm:text-6xl"
                >
                  {celebrant.turningText}
                </motion.span>
              )}
            </>
          ) : couple ? (
            <>
              {couple.bride && <AnimatedName name={couple.bride.firstName} delay={0.4} />}
              {couple.bride && couple.groom && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.9 }}
                  className="my-4 block font-script text-5xl text-accent sm:text-6xl"
                >
                  {couple.connector}
                </motion.span>
              )}
              {couple.groom && <AnimatedName name={couple.groom.firstName} delay={couple.bride ? 1.1 : 0.4} />}
            </>
          ) : (
            // Any type without a couple/celebrant shape (visiting_card,
            // anniversary, house_warming, ...) — fall back to the generic
            // people map (see InvitationConfigResource's 'people' key).
            Object.values(config.people || {})
              .map((p) => p?.firstName)
              .filter(Boolean)
              .map((name, i) => <AnimatedName key={name} name={name} delay={0.4 + i * 0.3} />)
          ))}
        </h1>

        {/* Animated divider line */}
        {nameRevealReady && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 h-px w-40 origin-center bg-gradient-to-r from-transparent via-accent/70 to-transparent"
          />
        )}

        {nameRevealReady && hero.tagline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="mt-8 font-display text-lg italic text-fg-soft sm:text-xl"
          >
            {hero.tagline}
          </motion.p>
        )}

        {nameRevealReady && date && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.9 }}
            className="mt-8 text-xs uppercase tracking-[0.4em] text-fg-soft"
          >
            {hero.dateRevealLabel || 'Date reveal'}
          </motion.p>
        )}

        {nameRevealReady && date && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.15, 1] }}
              transition={{
                opacity: { duration: 0.6, delay: 2 },
                scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 2 },
              }}
              className="mt-4 flex justify-center text-accent"
            >
              <Heart size={20} fill="currentColor" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              className="mt-8 text-xs uppercase tracking-[0.3em] text-fg-soft"
            >
              Scratch to discover the date
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.4 }}
              className="mt-5 flex items-end justify-center gap-5"
            >
              <ScratchCoin value={day} label="Day" />
              <ScratchCoin value={monthShort} label="Month" />
              <ScratchCoin value={year} label="Year" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.8 }}
              className="mt-8 text-xs uppercase tracking-[0.3em] text-fg-soft"
            >
              {display.location}
            </motion.p>
          </>
        )}

        {nameRevealReady && !date && display.location && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="mt-10 text-xs uppercase tracking-[0.3em] text-fg-soft"
          >
            {display.location}
          </motion.p>
        )}
      </div>

      {nextSectionId && (
      <motion.a
        href={`#${nextSectionId}`}
        aria-label="Scroll to the next section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 1, delay: 3.2 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-accent"
      >
        <ChevronDown size={28} strokeWidth={1.5} />
      </motion.a>
      )}
    </section>
  );
}

function AnimatedName({ name, delay = 0 }) {
  // Names are optional in the admin (e.g. a hidden side, a new invitation).
  if (!name) return null;
  const letters = Array.from(name); // Array.from keeps emoji/combining chars intact
  return (
    <span className="block">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {letter === ' ' ? '\u00a0' : letter}
        </motion.span>
      ))}
    </span>
  );
}
