// EVENT TYPE ICONS — maps each event type's App\Support\EventTypes 'icon'
// string to a lucide-react component. Icons can't travel over JSON, so this
// is the one necessarily client-only lookup for event types (alongside
// shells/registry.js) — any unrecognized key safely falls back to Sparkles
// rather than crashing.

import { Award, Baby, Cake, Contact, Gem, Heart, House, Sparkles, Store, Users } from 'lucide-react';

const ICONS = {
  heart: Heart,
  cake: Cake,
  baby: Baby,
  contact: Contact,
  store: Store,
  home: House,
  gem: Gem,
  users: Users,
  sparkles: Sparkles,
  award: Award,
};

export function getEventTypeIcon(iconKey) {
  return ICONS[iconKey] || Sparkles;
}
