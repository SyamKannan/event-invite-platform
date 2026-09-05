// MUSIC TOGGLE — small button in the bottom-right corner that plays/pauses
// background music.
//
// Why is autoplay tricky?
//   Browsers block audio from playing automatically until the visitor has
//   interacted with the page (clicked or tapped). So even if you set
//   `autoplay: true` in config, the visitor still has to click play first.
//
// Why track a load error?
//   If music.src doesn't actually resolve to a real audio file (e.g. no
//   file was ever uploaded for this invitation, or the upload was corrupt),
//   the browser fires an `error` event on the <audio> element and every
//   play() call rejects silently — the button would sit there looking
//   clickable and doing nothing, with no feedback to the visitor. We listen
//   for that error and hide the button entirely rather than show a dead
//   control.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, VolumeX } from 'lucide-react';
import { useConfig } from '../context/ConfigContext.jsx';

export function MusicToggle() {
  const config = useConfig();
  const { music } = config;

  // useRef gives us a way to grab the actual <audio> DOM element.
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // Reset the failure flag whenever the track itself changes (e.g. a
  // different invitation, or the admin swapped the uploaded file).
  useEffect(() => {
    setLoadFailed(false);
  }, [music.src]);

  // Try to autoplay once when the component first renders.
  useEffect(() => {
    if (!music.enabled || !music.autoplay || !audioRef.current) return;

    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Autoplay was blocked — that's fine, the user can tap to play.
      });
  }, [music.enabled, music.autoplay]);

  // Start music when the envelope is opened (the tap satisfies the browser's
  // "user must interact first" rule, so this play() call is allowed).
  useEffect(() => {
    if (!music.enabled) return;

    function handleEnvelopeOpened() {
      const audio = audioRef.current;
      if (!audio) return;
      audio.play().then(() => setPlaying(true)).catch(() => {
        /* still blocked — user can tap the music button manually */
      });
    }

    window.addEventListener('envelope:opened', handleEnvelopeOpened);
    return () => window.removeEventListener('envelope:opened', handleEnvelopeOpened);
  }, [music.enabled]);

  if (!music.enabled || !music.src || loadFailed) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <>
      {/* The actual audio element (invisible). */}
      <audio
        ref={audioRef}
        src={music.src}
        loop
        preload="auto"
        onError={() => setLoadFailed(true)}
      />

      {/* The floating button.
          The `style` adds extra space on iPhones with a home indicator
          so the button never hides behind it. */}
      <motion.button
        onClick={toggle}
        title={music.title}
        aria-label={playing ? 'Mute music' : 'Play music'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          right: 'calc(1.5rem + env(safe-area-inset-right))',
        }}
        className="fixed z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-accent shadow-[0_8px_24px_-10px_rgb(var(--color-accent)/0.6)] backdrop-blur-md transition hover:scale-105 hover:bg-white"
      >
        {playing ? (
          // Spinning music note while playing.
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <Music size={18} />
          </motion.span>
        ) : (
          <VolumeX size={18} />
        )}
      </motion.button>
    </>
  );
}
