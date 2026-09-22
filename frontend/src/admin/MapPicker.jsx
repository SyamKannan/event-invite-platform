// MAP PICKER — lets a non-technical admin find a venue by typing a search
// query (no API key needed) instead of hand-typing a Google Maps URL. Shows
// a live embedded preview (Google's free `output=embed` mode) and a button
// that commits a real, shareable Google Maps search link — the exact same
// URL shape (`https://maps.google.com/?q=...`) already used by the seeded
// demo data and read by the public Schedule page's QR code / Directions
// button, so nothing on the public side needs to change.

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';

// Pull the human-readable query back out of a saved
// `https://maps.google.com/?q=…` link so editing an existing event starts
// with its venue in the box (and a live preview) instead of blank.
function queryFromUrl(url) {
  if (!url) return '';
  try {
    return decodeURIComponent(new URL(url).searchParams.get('q') || '');
  } catch {
    return '';
  }
}

export function MapPicker({ value, onChange }) {
  const [query, setQuery] = useState(() => queryFromUrl(value));
  const trimmed = query.trim();
  const committed = queryFromUrl(value);

  // Commit what the admin typed automatically (debounced) — previously the
  // text was thrown away unless they remembered to press "Use this", so a
  // venue could look set and silently not be saved. The row's own Save
  // button still does the actual persisting.
  useEffect(() => {
    if (trimmed === committed) return;
    const id = setTimeout(() => {
      onChange(trimmed ? `https://maps.google.com/?q=${encodeURIComponent(trimmed)}` : null);
    }, 500);
    return () => clearTimeout(id);
  }, [trimmed, committed, onChange]);

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a venue or address…"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {trimmed && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(null); }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose/40 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-rose transition hover:bg-rose/10"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {trimmed && (
        <iframe
          title="Location preview"
          key={committed || trimmed}
          className="h-56 w-full rounded-xl border border-accent/15"
          src={`https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`}
          loading="lazy"
        />
      )}

      <p className="flex items-center gap-1.5 text-xs text-fg-soft">
        <MapPin size={12} className="shrink-0 text-accent" />
        {value ? (
          <>Guests get directions to <span className="truncate font-medium">{committed || value}</span></>
        ) : (
          'No location set — the map and QR code stay hidden for this event.'
        )}
      </p>
    </div>
  );
}
