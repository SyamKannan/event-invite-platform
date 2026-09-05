// ENVELOPE ANIMATION REGISTRY — maps each `envelope.animation` key (set by
// the admin in InvitationEditor's Date & Venue tab, stored as
// invitation_details.envelope_animation) to its component. Keys here must
// exactly match backend/app/Support/EnvelopeAnimations.php's ALL array —
// that's the single source of truth for the admin dropdown's option list.

import { SwingDoors } from './variants/SwingDoors.jsx';
import { StageCurtain } from './variants/StageCurtain.jsx';
import { UnfoldCard } from './variants/UnfoldCard.jsx';
import { RisingCurtain } from './variants/RisingCurtain.jsx';
import { WaxSeal } from './variants/WaxSeal.jsx';
import { FlipBook } from './variants/FlipBook.jsx';
import { ZoomThrough } from './variants/ZoomThrough.jsx';
import { PetalBloom } from './variants/PetalBloom.jsx';
import { SlideReveal } from './variants/SlideReveal.jsx';
import { IrisOpen } from './variants/IrisOpen.jsx';
import { ConfettiPop } from './variants/ConfettiPop.jsx';
import { FadeGlow } from './variants/FadeGlow.jsx';

export const ENVELOPE_ANIMATIONS = {
  'swing-doors': SwingDoors,
  'stage-curtain': StageCurtain,
  'unfold-card': UnfoldCard,
  'rising-curtain': RisingCurtain,
  'wax-seal': WaxSeal,
  'flip-book': FlipBook,
  'zoom-through': ZoomThrough,
  'petal-bloom': PetalBloom,
  'slide-reveal': SlideReveal,
  'iris-open': IrisOpen,
  'confetti-pop': ConfettiPop,
  'fade-glow': FadeGlow,
};

export const DEFAULT_ENVELOPE_ANIMATION = 'swing-doors';

// Display names for the admin picker (InvitationEditor's Date & Venue tab).
// Keys must match ENVELOPE_ANIMATIONS above and
// backend/app/Support/EnvelopeAnimations.php exactly.
export const ENVELOPE_ANIMATION_LABELS = {
  'swing-doors': 'Swing Doors',
  'stage-curtain': 'Stage Curtain',
  'unfold-card': 'Unfold Card',
  'rising-curtain': 'Rising Curtain',
  'wax-seal': 'Wax Seal',
  'flip-book': 'Flip Book',
  'zoom-through': 'Zoom Through',
  'petal-bloom': 'Petal Bloom',
  'slide-reveal': 'Slide Reveal',
  'iris-open': 'Iris Open',
  'confetti-pop': 'Confetti Pop',
  'fade-glow': 'Fade & Glow',
};
