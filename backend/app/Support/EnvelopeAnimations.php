<?php

namespace App\Support;

/**
 * Single source of truth for the opening-cover animation styles an admin can
 * pick per invitation (InvitationEditor's Date & Venue tab → "Opening style").
 * Keys here must exactly match the keys in the frontend's
 * frontend/src/components/envelope/registry.js.
 */
class EnvelopeAnimations
{
    /**
     * @var array<string, string>
     */
    public const array ALL = [
        'swing-doors' => 'Swing Doors',
        'stage-curtain' => 'Stage Curtain',
        'unfold-card' => 'Unfold Card',
        'rising-curtain' => 'Rising Curtain',
        'wax-seal' => 'Wax Seal',
        'flip-book' => 'Flip Book',
        'zoom-through' => 'Zoom Through',
        'petal-bloom' => 'Petal Bloom',
        'slide-reveal' => 'Slide Reveal',
        'iris-open' => 'Iris Open',
        'confetti-pop' => 'Confetti Pop',
        'fade-glow' => 'Fade & Glow',
    ];
}
