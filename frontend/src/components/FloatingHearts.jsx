// Tiny hearts/petals/sparkles that drift up the screen behind the content.
//
// How it works:
//   1. We make N spans (where N comes from config.floatingDecor.count).
//   2. Each span gets random horizontal position, animation delay,
//      duration, and symbol (symbols come per event type from the API —
//      hearts for weddings, sparkles for most others).
//   3. The CSS class `.floater` (in index.css) handles the actual floating
//      animation — they rise from below the screen up over the top. It's
//      hidden entirely under prefers-reduced-motion.

import { useMemo } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { getAnimationPreset } from '../lib/animationPresets.js';

export function FloatingHearts() {
  const config = useConfig();
  const decor = config.floatingDecor;
  const { floatingDecorMultiplier, speedMultiplier } = getAnimationPreset(config.animationIntensity);
  const count = decor?.enabled ? Math.max(0, Math.round((decor.count || 0) * floatingDecorMultiplier)) : 0;
  const symbols = decor?.symbols?.length ? decor.symbols : ['✦'];

  // Random layout computed once (not on every render), so a re-render never
  // makes every floater jump to a new position mid-flight.
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        symbol: symbols[i % symbols.length],
        left: Math.random() * 100,
        duration: (12 + Math.random() * 14) * speedMultiplier,
        delay: Math.random() * 18,
        size: 14 + Math.random() * 18,
        opacity: 0.25 + Math.random() * 0.45,
      })),
    [count, speedMultiplier, symbols.join('')],
  );

  if (count === 0) return null;

  return (
    <div aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className="floater"
          style={{
            left: `${it.left}%`,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
            fontSize: `${it.size}px`,
            opacity: it.opacity,
          }}
        >
          {it.symbol}
        </span>
      ))}
    </div>
  );
}
