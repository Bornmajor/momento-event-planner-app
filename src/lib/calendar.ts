import * as Calendar from 'expo-calendar';
import { Linking, Platform } from 'react-native';

import type { EventSummary } from '@/api/endpoints';
import { BRAND } from '@/theme/tokens';

import { logger } from './logger';

/**
 * Device calendar helpers (spec §6 "Add to calendar"), on the SDK 58 object API: `getCalendars()` returns
 * `ExpoCalendar` objects, `calendar.createEvent()` creates an entry, `ExpoCalendarEvent.get(id).delete()` removes it.
 */

const MOMENTO_CALENDAR_TITLE = 'Momento';
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // Ticketmaster rarely gives an end time

export type PermissionResult = 'granted' | 'denied' | 'blocked';

/** Asks for calendar access. "blocked" means the user must enable it in the system settings. */
export async function requestCalendarAccess(): Promise<PermissionResult> {
  const { granted, canAskAgain } = await Calendar.requestCalendarPermissions();
  if (granted) return 'granted';
  return canAskAgain ? 'denied' : 'blocked';
}

export const openSystemSettings = () => Linking.openSettings();

/**
 * A calendar the app can write to: the system default (iOS) or a primary, modifiable calendar (Android; it has no
 * single default), then an existing "Momento" calendar, then any modifiable one; otherwise a new local "Momento".
 */
export async function getWritableCalendar(): Promise<Calendar.ExpoCalendar> {
  if (Platform.OS === 'ios') {
    try {
      const fallback = Calendar.getDefaultCalendarSync();
      if (fallback.allowsModifications) return fallback;
    } catch (error) {
      logger.warn('no default iOS calendar', error);
    }
  }
  const calendars = (await Calendar.getCalendars(Calendar.EntityTypes.EVENT)).filter((c) => c.allowsModifications);
  const pick =
    calendars.find((c) => c.isPrimary) ??
    calendars.find((c) => c.title === MOMENTO_CALENDAR_TITLE) ??
    calendars[0];
  return pick ?? createMomentoCalendar();
}

function createMomentoCalendar() {
  return Calendar.createCalendar({
    title: MOMENTO_CALENDAR_TITLE,
    color: BRAND,
    entityType: Calendar.EntityTypes.EVENT,
    // Android: a local account, so the OS keeps it without a synced account behind it.
    source: { isLocalAccount: true, name: MOMENTO_CALENDAR_TITLE, type: Calendar.SourceType.LOCAL },
    name: 'momento',
    ownerAccount: 'momento',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export interface CalendarEntryInput {
  start: EventSummary['start'];
  title: string;
  notes: string;
  location: string | null;
  url: string;
  /** Minutes before the start for the reminder (0 = at start). */
  reminderMinutes: number;
}

/**
 * Start, end and time zone for the entry. With a UTC start it's a timed event in the venue's time zone (2-hour
 * default length); without one (time not announced) it's an all-day event on the local date.
 */
export function entryTiming(start: EventSummary['start']) {
  if (start.dateTime) {
    const startDate = new Date(start.dateTime);
    return {
      startDate,
      endDate: new Date(startDate.getTime() + DEFAULT_DURATION_MS),
      allDay: false,
      timeZone: start.timezone ?? undefined,
    };
  }
  const [y, m, d] = start.localDate.split('-').map(Number);
  return { startDate: new Date(y, m - 1, d), endDate: new Date(y, m - 1, d + 1), allDay: true, timeZone: undefined };
}

/** Creates the entry with one reminder and returns its id (stored to update or delete it later). */
export async function createCalendarEntry(input: CalendarEntryInput): Promise<string> {
  const calendar = await getWritableCalendar();
  const entry = await calendar.createEvent({
    ...entryTiming(input.start),
    title: input.title,
    notes: input.notes,
    location: input.location,
    url: input.url, // iOS only; the link is also in the notes
    // Negative offsets fire before the start (SDK 58 Alarm type). Android needs a method.
    alarms: [{ relativeOffset: -input.reminderMinutes, method: Calendar.AlarmMethod.ALERT }],
  });
  return entry.id;
}

/** Deletes an entry this app created. Already gone (deleted in the calendar app) counts as done. */
export async function deleteCalendarEntry(id: string): Promise<void> {
  try {
    const entry = await Calendar.ExpoCalendarEvent.get(id);
    await entry.delete();
  } catch (error) {
    logger.info('calendar entry already gone', error);
  }
}
