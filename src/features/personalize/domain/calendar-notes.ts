import type { CalendarFacts } from './models/personalization';

/**
 * Calendar notes: the (personalized) description, then the exact facts from the server, never rewritten by the AI
 * (intent §4.4: dates, venue and links are kept exactly as given).
 */
export function buildCalendarNotes(description: string, facts: CalendarFacts) {
  const lines = [description.trim(), '', `🗓 ${facts.dateTimeText}`];
  if (facts.venueText) lines.push(`📍 ${facts.venueText}`);
  lines.push(`🎟 ${facts.url}`);
  return lines.join('\n').trim();
}
