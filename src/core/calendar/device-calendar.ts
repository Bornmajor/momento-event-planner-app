import * as Calendar from 'expo-calendar';
import { Linking, Platform } from 'react-native';

import { BRAND } from '@/core/theme/tokens';

import { logger } from '@/core/logger';

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
 * A calendar the app can write to and the user will actually see. iOS: the system default. Android has no single
 * default, so writable calendars are ranked: hidden ones are skipped; a synced account calendar (e.g. Google) beats a
 * phone-only one, because the Google Calendar app doesn't show phone-only calendars; the account's main calendar
 * (primary, or titled like the account) comes first. Only when nothing is writable is a local "Momento" created.
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
  const all = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const writable = all.filter((c) => c.allowsModifications && c.isVisible !== false);
  const pick = [...writable].sort((a, b) => calendarRank(b) - calendarRank(a))[0];
  logger.debug(
    'calendars',
    all.map((c) => ({
      title: c.title,
      account: c.source?.name,
      local: c.source?.isLocalAccount ?? false,
      primary: c.isPrimary ?? false,
      writable: c.allowsModifications,
      visible: c.isVisible,
      synced: c.isSynced,
    })),
    '→ chosen:',
    pick?.title ?? '(none, creating Momento)',
  );
  return pick ?? createMomentoCalendar();
}

/**
 * Phone-only calendars. Android's own marker is isLocalAccount (account type "LOCAL"), but phone makers ship their
 * own, e.g. a "Local Calendar" account type marked primary, so the type and name are checked too.
 */
function isPhoneOnly(c: Pick<Calendar.ExpoCalendar, 'source'>) {
  return Boolean(c.source?.isLocalAccount) || /local/i.test(String(c.source?.type ?? '')) || /local/i.test(c.source?.name ?? '');
}

/** Higher is better (see getWritableCalendar). Ties keep the phone's order (lowest id first). */
export function calendarRank(c: Pick<Calendar.ExpoCalendar, 'isPrimary' | 'isSynced' | 'title' | 'source'>): number {
  let rank = 0;
  if (c.source?.type === 'com.google') rank += 8; // a Google account calendar: shows in the Google Calendar app
  if (!isPhoneOnly(c)) rank += 4; // synced to some account
  if (c.isPrimary) rank += 2;
  if (c.source?.name && c.title === c.source.name) rank += 2; // Google names the main calendar after the account
  if (c.isSynced) rank += 1;
  if (c.title === MOMENTO_CALENDAR_TITLE) rank += 1;
  return rank;
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

/** When an event starts (the same shape as an event's `start`; core doesn't import features). */
export interface EntryStart {
  localDate: string;
  localTime: string | null;
  dateTime: string | null;
  timezone: string | null;
}

export interface CalendarEntryInput {
  start: EntryStart;
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
export function entryTiming(start: EntryStart) {
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
  const timing = entryTiming(input.start);
  const entry = await calendar.createEvent({
    ...timing,
    title: input.title,
    notes: input.notes,
    location: input.location,
    url: input.url, // iOS only; the link is also in the notes
    // Negative offsets fire before the start (SDK 58 Alarm type). Android needs a method.
    alarms: [{ relativeOffset: -input.reminderMinutes, method: Calendar.AlarmMethod.ALERT }],
  });
  logger.info(
    `calendar entry ${entry.id} created in "${calendar.title}" (${calendar.source?.name ?? 'no account'})`,
    `for ${timing.startDate.toISOString()}${timing.allDay ? ' (all day)' : ''}`,
  );
  return entry.id;
}

/** Opens the entry in the phone's calendar app, so the user sees exactly where it went. */
export async function openCalendarEntry(id: string): Promise<void> {
  try {
    const entry = await Calendar.ExpoCalendarEvent.get(id);
    await entry.openInCalendar();
  } catch (error) {
    logger.warn('could not open the calendar entry', error);
  }
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
