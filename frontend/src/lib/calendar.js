// Build an .ics calendar file for one event and trigger a download.
// Apple Calendar, Google Calendar, Outlook all open .ics files.
//
// Times are written in UTC ("...Z") so every guest's calendar converts them
// to their own timezone correctly (a "floating" local time would land at
// the wrong hour for anyone abroad). Text values are escaped per RFC 5545 —
// an unescaped comma or newline in a venue name corrupts the event.

function pad(n) {
  return String(n).padStart(2, '0');
}

// "YYYYMMDDTHHMMSSZ" in UTC.
function utcStamp(d) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

// RFC 5545 TEXT escaping: backslash, semicolon, comma, newline.
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Combine "2026-06-14" + "4:00 PM" / "4 PM" / "16:30" into a Date in the
// guest's local time. Returns { date, hasTime } — an unparseable time
// ("Evening", "After sunset") becomes an all-day event rather than midnight.
function combine(dateISO, timeStr) {
  const [y, m, d] = String(dateISO).slice(0, 10).split('-').map(Number);
  const match = String(timeStr || '').trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|A\.M\.|P\.M\.)?/i);

  if (!match) return { date: new Date(y, m - 1, d), hasTime: false };

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = (match[3] || '').replace(/\./g, '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (hours > 23 || minutes > 59) return { date: new Date(y, m - 1, d), hasTime: false };
  return { date: new Date(y, m - 1, d, hours, minutes, 0), hasTime: true };
}

function dateOnly(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function downloadIcs(event) {
  const { date: start, hasTime } = combine(event.date, event.time);
  const location = [event.venue, event.address].filter(Boolean).join(', ');

  const timing = hasTime
    ? [
        `DTSTART:${utcStamp(start)}`,
        // Default to a 2-hour duration.
        `DTEND:${utcStamp(new Date(start.getTime() + 2 * 60 * 60 * 1000))}`,
      ]
    : [
        `DTSTART;VALUE=DATE:${dateOnly(start)}`,
        `DTEND;VALUE=DATE:${dateOnly(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1))}`,
      ];

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invitations//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-${start.getTime()}@invitations`,
    `DTSTAMP:${utcStamp(new Date())}`,
    ...timing,
    `SUMMARY:${escapeText(event.title)}`,
    location ? `LOCATION:${escapeText(location)}` : '',
    event.mapUrl ? `URL:${event.mapUrl}` : '',
    `DESCRIPTION:${escapeText([event.title, event.venue && `at ${event.venue}`, event.time].filter(Boolean).join(' '))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  // Blob → object URL → invisible <a> click → revoke. Standard browser
  // download trick (revoked on a delay; revoking synchronously can cancel
  // the download in Firefox/Safari).
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${String(event.title || 'event').replace(/[^\w-]+/g, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
