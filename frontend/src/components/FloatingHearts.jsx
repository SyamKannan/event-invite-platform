// Tiny hearts/petals/sparkles that drift up the screen behind the content.
//
// How it works:
//   1. We make N spans (where N comes from config.floatingDecor.count).
//   2. Each span gets random horizontal position, animation delay,
//      duration, and symbol.
//   3. The CSS class `.floater` (in index.css) handles the actual floating
//      animation — they rise from below the screen up over the top.

import { useConfig } from '../context/ConfigContext.jsx';
import { getAnimationPreset } from '../lib/animationPresets.js';

export function FloatingHearts() {
  const config = useConfig();
  const decor = config.floatingDecor;
  if (!decor || !decor.enabled || decor.count <= 0) return null;

  const { floatingDecorMultiplier, speedMultiplier } = getAnimationPreset(config.animationIntensity);
  const count = Math.max(0, Math.round(decor.count * floatingDecorMultiplier));

  // Build an array of N items, each with random visual properties.
  // We compute these once at render time — no animations in JS, all CSS.
  const items = Array.from({ length: count }).map((_, i) => {
    const symbol = decor.symbols[i % decor.symbols.length];
    return {
      symbol,
      left: Math.random() * 100,           // 0–100% across the screen
      duration: (12 + Math.random() * 14) * speedMultiplier, // 12–26s to cross the screen, scaled by intensity
      delay: Math.random() * 18,           // start time offset
      size: 14 + Math.random() * 18,       // 14–32px font size
      opacity: 0.25 + Math.random() * 0.45,
    };
  });

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
