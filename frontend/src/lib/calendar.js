// Build an .ics calendar file for one event and trigger a download.
// Apple Calendar, Google Calendar, Outlook all open .ics files.

function pad(n) {
  return String(n).padStart(2, '0');
}

// Format a Date as "YYYYMMDDTHHMMSS" in local time.
function localStamp(d) {
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// Combine "2026-06-14" + "4:00 PM" into a real Date.
function combine(dateISO, timeStr) {
  const [y, m, d] = dateISO.split('-').map(Number);
  // Parse "4:00 PM" / "12:30 PM" / "10:00"
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 0, minutes = 0;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = (match[3] || '').toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  return new Date(y, m - 1, d, hours, minutes, 0);
}

export function downloadIcs(event) {
  const start = combine(event.date, event.time);
  // Default to 2-hour duration if none given.
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Template//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-${start.getTime()}@wedding`,
    `DTSTAMP:${localStamp(new Date())}`,
    `DTSTART:${localStamp(start)}`,
    `DTEND:${localStamp(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue}\\, ${event.address}`,
    event.mapUrl ? `URL:${event.mapUrl}` : '',
    `DESCRIPTION:${event.title} at ${event.venue}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  // Blob → object URL → invisible <a> click → revoke. Standard browser
  // download trick.
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
