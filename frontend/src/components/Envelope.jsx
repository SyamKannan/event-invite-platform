// ENVELOPE — the "tap to open" cover that hides the page on first load.
//
// This is a thin dispatcher: the actual animation lives in
// components/envelope/variants/*, chosen per-invitation by the admin
// (envelope.animation, from invitation_details.envelope_animation via
// InvitationConfigResource). Adding a new style means adding one file under
// envelope/variants/, registering it in envelope/registry.js, and adding its
// key to backend/app/Support/EnvelopeAnimations.php.

import { useConfig } from '../context/ConfigContext.jsx';
import { ENVELOPE_ANIMATIONS, DEFAULT_ENVELOPE_ANIMATION } from './envelope/registry.js';

export function Envelope() {
  const config = useConfig();

  if (!config.envelope.enabled) return null;

  const Variant =
    ENVELOPE_ANIMATIONS[config.envelope.animation] ??
    ENVELOPE_ANIMATIONS[DEFAULT_ENVELOPE_ANIMATION];

  return <Variant />;
}
