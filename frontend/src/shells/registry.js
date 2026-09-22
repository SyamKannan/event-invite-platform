// SHELL REGISTRY — maps an invitation's config.type to the page-shell
// component that composes its sections. Most event types share the same
// section stack (StandardShell); a few (visiting_card, business_opening)
// need a structurally different composition/order and get their own shell.
//
// This is a necessarily client-only lookup (a React component reference
// can't travel over JSON from the backend's /event-types endpoint), but it
// degrades safely: any type not listed here — including one added to the
// backend registry before its shell exists yet — falls back to
// StandardShell rather than crashing.

import { StandardShell } from './StandardShell.jsx';

const SHELLS = {
  // Populated as each new type gets its own shell (CardShell for
  // visiting_card, LandingShell for business_opening, etc.). Every type not
  // listed here uses StandardShell by default.
};

export function getShell(type) {
  return SHELLS[type] || StandardShell;
}
