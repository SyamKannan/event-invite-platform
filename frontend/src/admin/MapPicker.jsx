// MAP PICKER — lets a non-technical admin find a venue by typing a search
// query (no API key needed) instead of hand-typing a Google Maps URL. Shows
// a live embedded preview (Google's free `output=embed` mode) and a button
// that commits a real, shareable Google Maps search link — the exact same
// URL shape (`https://maps.google.com/?q=...`) already used by the seeded
// demo data and read by the public Schedule page's QR code / Directions
// button, so nothing on the public side needs to change.

import { useState } from 'react';
import { MapPin } from 'lucide-react';

export function MapPicker({ value, onChange }) {
  const [query, setQuery] = useState('');

  function useThisLocation() {
    if (!query.trim()) return;
    onChange(`https://maps.google.com/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a venue or address…"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="button"
          onClick={useThisLocation}
          disabled={!query.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-white disabled:opacity-40 transition hover:bg-gold"
        >
          <MapPin size={14} /> Use this
        </button>
      </div>

      {query.trim() && (
        <iframe
          title="Location preview"
          className="h-56 w-full rounded-xl border border-accent/15"
          src={`https://www.google.com/maps?q=${encodeURIComponent(query.trim())}&output=embed`}
          loading="lazy"
        />
      )}

      {value && (
        <p className="truncate text-xs text-fg-soft">
          Current: <a href={value} target="_blank" rel="noreferrer" className="text-accent underline">{value}</a>
        </p>
      )}
    </div>
  );
}
