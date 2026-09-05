// SCHEDULE — venue cards. Optional Groom/Bride tabs let you show a
// different list per side.
//
// Each card has:
//   • Title, date, time, venue, address, dresscode
//   • A scannable QR code that opens the map URL
//   • "View on map" button (external link)
//   • "Add to calendar" button (downloads an .ics file)

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar, CalendarPlus, Clock, MapPin, Navigation, ScanLine, Shirt,
} from 'lucide-react';
import { Section } from '../components/ui/Section.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { downloadIcs } from '../lib/calendar.js';

export function Schedule() {
  const config = useConfig();
  const { schedule } = config;

  const tabs = schedule.tabs && schedule.tabs.length > 0 ? schedule.tabs : null;
  const [activeTab, setActiveTab] = useState(tabs ? tabs[0].id : null);

  if (!schedule.enabled) return null;

  const visibleEvents = tabs
    ? schedule.events.filter((ev) => !ev.team || ev.team === activeTab)
    : schedule.events;

  return (
    <Section id="schedule" title={schedule.title} subtitle={schedule.subtitle} size="lg">
      {tabs && (
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-accent/30 bg-bg/40 p-1 backdrop-blur-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.25em] transition ${
                  activeTab === t.id
                    ? 'bg-accent text-ink shadow-[0_4px_12px_-6px_rgba(0,0,0,0.6)]'
                    : 'text-fg-soft hover:text-fg'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-6">
        {visibleEvents.map((event, i) => (
          <div key={event.id} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
            <EventCard event={event} index={i} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function EventCard({ event, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="glow-card relative flex flex-col overflow-hidden rounded-3xl border border-accent/20 bg-surface p-7 text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1"
    >
      <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <h3 className="font-display text-3xl tracking-wide">{event.title}</h3>

      <ul className="mt-5 space-y-3 text-sm text-muted">
        <li className="flex items-center gap-3"><Calendar size={16} className="text-accent" /><span>{formatDate(event.date)}</span></li>
        <li className="flex items-center gap-3"><Clock size={16} className="text-accent" /><span>{event.time}</span></li>
        <li className="flex items-start gap-3">
          <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>
            <span className="block text-ink">{event.venue}</span>
            <span className="block">{event.address}</span>
          </span>
        </li>
        {event.dresscode && (
          <li className="flex items-center gap-3"><Shirt size={16} className="text-accent" /><span>{event.dresscode}</span></li>
        )}
      </ul>

      {event.mapUrl && (
        <div className="mt-6 flex items-center gap-4">
          <div className="rounded-xl border border-accent/30 bg-white p-2 shadow-sm">
            <QRCodeSVG value={event.mapUrl} size={84} bgColor="#ffffff" fgColor="#5a3e22" level="M" marginSize={0} />
          </div>
          <p className="flex-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted">
            <ScanLine size={12} className="text-accent" /> Scan for directions
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadIcs(event)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-fg transition hover:bg-ink/90"
        >
          <CalendarPlus size={14} /> Add to calendar
        </button>
        {event.mapUrl && (
          <a
            href={event.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink transition hover:bg-ink/10"
          >
            <Navigation size={14} /> Directions
          </a>
        )}
      </div>
    </motion.article>
  );
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
