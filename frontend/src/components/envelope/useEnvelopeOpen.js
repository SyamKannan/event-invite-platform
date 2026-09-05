// Shared open/close lifecycle for every envelope animation variant.
// Each variant calls this with the total time (ms) its own animation needs
// from tap to fully unmounted, and gets back { opening, done, handleOpen }.

import { useEffect, useState } from 'react';

export function useEnvelopeOpen(animationMs) {
  const [opening, setOpening] = useState(false);
  const [done, setDone] = useState(false);

  // Lock scrolling while the cover is on screen. Both html and body need
  // this — the cover is `position: fixed` so it visually covers the page,
  // but locking body alone still lets the page scroll behind it via the
  // html element (visible as a live scrollbar even though the cover looks
  // static).
  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, [done]);

  function handleOpen() {
    if (opening) return;
    setOpening(true);
    window.dispatchEvent(new CustomEvent('envelope:opened'));
    setTimeout(() => setDone(true), animationMs);
  }

  return { opening, done, handleOpen };
}
