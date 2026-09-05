// A custom React "hook" — that's just a function whose name starts with `use`
// and which calls other hooks. This one ticks every second and tells you how
// much time is left until the wedding date.
//
// Usage:
//   const c = useCountdown('2026-06-14T16:00:00+05:30');
//   c.days, c.hours, c.minutes, c.seconds, c.isPast

import { useEffect, useState } from 'react';

export function useCountdown(targetISO) {
  // Convert the ISO string ("2026-06-14T...") into milliseconds since 1970.
  const target = new Date(targetISO).getTime();

  // `now` is a piece of state that holds the current time in ms.
  // `setNow` updates it. When state changes, React re-renders the component.
  const [now, setNow] = useState(() => Date.now());

  // useEffect runs side effects (timers, fetches, subscriptions).
  // Here: start a timer that updates `now` every second, then clean up on unmount.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id); // cleanup
  }, []);

  // Difference in ms (clamped to 0 so we never go negative).
  const diff = Math.max(0, target - now);
  const isPast = target - now <= 0;

  // Break ms down into days/hours/minutes/seconds.
  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return { days, hours, minutes, seconds, isPast };
}
