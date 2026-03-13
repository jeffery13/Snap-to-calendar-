/**
 * Generates an RFC 5545-compliant ICS file string from an event object.
 *
 * @param {Object} event  - The event data
 * @param {string[]} guests - List of attendee email addresses
 * @returns {string} ICS file content
 */
export function generateICS(event, guests = []) {
  // Format: YYYYMMDDTHHMMSS  (local time, no Z suffix = floating time)
  const toICSDate = (date, time) =>
    `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

  const attendeeLines = guests
    .map((email) => `ATTENDEE;RSVP=TRUE:mailto:${email}`)
    .join('\r\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Snap-to-Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:snap-${event.id}@snapcal.app`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${toICSDate(event.date, event.startTime)}`,
    `DTEND:${toICSDate(event.date, event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    `ORGANIZER;CN=${event.organizer || 'Event Organizer'}:mailto:noreply@snapcal.app`,
    attendeeLines,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return lines;
}

/**
 * Triggers a .ics file download in the browser.
 */
export function downloadICS(event, guests = []) {
  const content = generateICS(event, guests);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
