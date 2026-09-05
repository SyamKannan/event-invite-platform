// SCRATCH REVEAL — three little gold "coins" the visitor scratches with
// their finger or mouse to expose the wedding date. A delightful interactive
// touch you don't see often.
//
// How it works: each coin is a <canvas>. We paint a gold gradient on top and
// listen for pointer-move events while the pointer is down. Each move erases
// a circle from the canvas (using globalCompositeOperation = 'destination-out').
// When ~60% of the canvas is erased, we mark the coin as "revealed" and
// fade the canvas away to show the date underneath.

import { useEffect, useRef, useState } from 'react';

export function ScratchCoin({ value, label, size = 88 }) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const isDownRef = useRef(false);
  const checkedRef = useRef(false);

  // Paint the gold surface once when the canvas is ready.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match the canvas pixel size to the CSS size at the device pixel ratio.
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Gold radial gradient — looks like a metal coin.
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0,    '#e7c489');
    grad.addColorStop(0.5,  '#c39146');
    grad.addColorStop(1,    '#8d6322');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // Faint diagonal shimmer so the coin looks shiny.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, size * 0.15, size, size * 0.12);

    // From now on, scratching = erasing.
    ctx.globalCompositeOperation = 'destination-out';
  }, [size]);

  // Erase a circle at the pointer position.
  function scratchAt(e) {
    if (!isDownRef.current || revealed) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Every few moves, check how much has been erased.
    if (!checkedRef.current && Math.random() < 0.2) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      // Sample every 12th pixel (alpha channel) for speed.
      for (let i = 3; i < data.length; i += 48) {
        if (data[i] === 0) cleared++;
      }
      const total = data.length / 48;
      if (cleared / total > 0.55) {
        checkedRef.current = true;
        setRevealed(true);
      }
    }
  }

  return (
    <div
      className="relative inline-flex flex-col items-center"
      style={{ width: size }}
    >
      <div
        className="relative grid place-items-center rounded-full bg-surface text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
        style={{ width: size, height: size }}
      >
        {/* The number underneath the coin */}
        <span className="font-display text-3xl">{value}</span>

        {/* The scratchable canvas overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 cursor-grab rounded-full transition-opacity duration-700 ${
            revealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ width: size, height: size, touchAction: 'none' }}
          onPointerDown={(e) => {
            isDownRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratchAt(e);
          }}
          onPointerMove={scratchAt}
          onPointerUp={() => {
            isDownRef.current = false;
          }}
          onPointerCancel={() => {
            isDownRef.current = false;
          }}
        />
      </div>
      {label && (
        <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-fg-soft">
          {label}
        </span>
      )}
    </div>
  );
}
