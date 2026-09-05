// ANIMATION INTENSITY — one overall "how lively should this page feel" knob
// per invitation (Subtle / Balanced / Playful), set in the admin's Theme &
// Motion tab. This is deliberately separate from the envelope's own opening
// animation choice (a specific effect) — this is a global multiplier applied
// across floating decor, particle counts, and a few transition speeds.

export const ANIMATION_PRESETS = {
  subtle: {
    label: 'Subtle',
    description: 'Minimal movement — fewer particles, slower and gentler transitions.',
    floatingDecorMultiplier: 0.4,
    particleMultiplier: 0.5,
    speedMultiplier: 1.3, // durations multiplied by this — bigger = slower
  },
  balanced: {
    label: 'Balanced',
    description: 'The default feel — a lively but not overwhelming amount of motion.',
    floatingDecorMultiplier: 1,
    particleMultiplier: 1,
    speedMultiplier: 1,
  },
  playful: {
    label: 'Playful',
    description: 'Maximum energy — more particles, snappier and quicker transitions.',
    floatingDecorMultiplier: 1.7,
    particleMultiplier: 1.6,
    speedMultiplier: 0.75,
  },
};

export function getAnimationPreset(intensity) {
  return ANIMATION_PRESETS[intensity] || ANIMATION_PRESETS.balanced;
}
