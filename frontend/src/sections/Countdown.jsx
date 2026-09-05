// COUNTDOWN — four cream cards showing days/hours/minutes/seconds.
//
// NEW FEATURES:
//   1. Animated SVG ring around each card — fills as time passes
//   2. "You're X% of the way there" progress message
//   3. Subtle flip animation when each digit changes

import { motion } from 'framer-motion';
import { useCountdown } from '../hooks/useCountdown.js';
import { useConfig } from '../context/ConfigContext.jsx';
import { Section } from '../components/ui/Section.jsx';

const labels = ['Days', 'Hours', 'Minutes', 'Seconds'];
// Max values for each unit (used to compute ring fill percentage)
const maxValues = [365, 24, 60, 60];

// SVG ring that fills proportionally — a unique visual touch.
function RingProgress({ value, max, size = 80 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  // Fill goes from full (100%) down to empty as time ticks.
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 m-auto"
      aria-hidden
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(212,168,95,0.12)"
        strokeWidth="2"
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(212,168,95,0.5)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

export function Countdown() {
  const config = useConfig();
  const isBirthday = config.type === 'birthday';
  const c = useCountdown(config.weddingDateISO);
  const values = [c.days, c.hours, c.minutes, c.seconds];

  // Work out how far through the "year before the event" we are.
  const eventMs = new Date(config.weddingDateISO).getTime();
  const nowMs = Date.now();
  const totalMs = 365 * 24 * 60 * 60 * 1000;
  const progressPct = Math.max(0, Math.min(100, Math.round(((totalMs - (eventMs - nowMs)) / totalMs) * 100)));

  return (
    <Section id="countdown" subtitle="counting down to forever" showOrnament={false}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {values.map((value, i) => (
          <motion.div
            key={labels[i]}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
            className="glow-card breathe relative overflow-hidden rounded-2xl border border-accent/30 bg-surface px-4 py-8 text-center text-ink shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-1"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

            {/* Ring progress overlay */}
            <RingProgress value={value} max={maxValues[i]} size={110} />

            <motion.div
              key={value}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative font-display text-5xl tabular-nums sm:text-6xl"
            >
              {String(value).padStart(2, '0')}
            </motion.div>

            <div className="relative mt-2 text-xs uppercase tracking-[0.3em] text-muted">
              {labels[i]}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar — how far along the journey we are */}
      {!c.isPast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-10 max-w-sm"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-fg-soft mb-2">
            <span>Journey begins</span>
            <span className="text-accent font-display text-sm">{progressPct}%</span>
            <span>{isBirthday ? 'The big day' : 'Wedding day'}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-accent/15 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
            />
          </div>
          <p className="mt-3 text-center text-xs text-fg-soft italic">
            The best is yet to come ✨
          </p>
        </motion.div>
      )}

      {c.isPast && (
        <p className="mt-10 text-center font-script text-3xl text-accent">
          Today is the day! Thank you for sharing it with us.
        </p>
      )}
    </Section>
  );
}
