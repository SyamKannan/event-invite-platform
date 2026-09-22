// EVENT TYPES — fetches and caches App\Support\EventTypes::ALL from the
// backend (GET /api/event-types) so admin screens (Dashboard, PeopleTab,
// etc.) never hand-duplicate the list of supported event types. In-memory
// cache only, matching the simple no-over-abstraction style of api.js —
// this data is static per deploy, so one fetch per page load is enough.

import { getEventTypes } from './api.js';

let cache = null;

export async function loadEventTypes() {
  if (!cache) {
    cache = getEventTypes().catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}
