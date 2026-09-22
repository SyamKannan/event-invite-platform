// DASHBOARD STATS — headline stat tiles + per-event-type breakdown for the
// admin dashboard. Pure presentation; Dashboard.jsx owns the fetch (via
// adminGetDashboardStats) and passes the result down as `stats`.

import { motion } from 'framer-motion';
import { CalendarCheck, FileEdit, LayoutGrid, MessageSquare, Users } from 'lucide-react';
import { getEventTypeIcon } from '../lib/eventTypeIcons.js';

const TILES = [
  { key: 'total', label: 'Invitations', icon: LayoutGrid },
  { key: 'published', label: 'Published', icon: CalendarCheck },
  { key: 'draft', label: 'Drafts', icon: FileEdit },
  { key: 'rsvps', label: 'RSVPs', icon: Users },
  { key: 'wishes', label: 'Wishes', icon: MessageSquare },
];

export default function DashboardStats({ stats, eventTypes }) {
  const byType = stats?.by_type || {};
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...typeEntries.map(([, count]) => count));

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-accent/20 bg-surface p-4 text-ink shadow-[0_10px_30px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 text-accent">
                <Icon size={16} />
                <span className="text-[11px] uppercase tracking-[0.15em] text-muted">{tile.label}</span>
              </div>
              <p className="mt-2 font-display text-3xl">
                {stats ? (stats[tile.key] ?? 0) : <span className="inline-block h-8 w-10 animate-pulse rounded bg-ink/10" />}
              </p>
            </motion.div>
          );
        })}
      </div>

      {typeEntries.length > 0 && (
        <div className="mt-4 rounded-2xl border border-accent/20 bg-surface p-5 text-ink shadow-[0_10px_30px_-20px_rgba(0,0,0,0.5)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">By event type</p>
          <div className="mt-3 space-y-2.5">
            {typeEntries.map(([type, count]) => {
              const Icon = getEventTypeIcon(eventTypes?.[type]?.icon);
              const label = eventTypes?.[type]?.label || type;
              return (
                <div key={type} className="flex items-center gap-3">
                  <Icon size={14} className="shrink-0 text-accent" />
                  <span className="w-40 shrink-0 truncate text-sm text-ink">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-accent"
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm text-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
