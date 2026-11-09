import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { personalizeApi, type Event, type EventSummary, type Language, type PersonalizeResponse } from '@/api/endpoints';
import { ApiError, errorMessageKey } from '@/api/errors';
import { AppText, BackButton, Button, FormScreen, OfflineBanner, snackbar, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { formatEventDate, formatVenue } from '@/features/events/format';
import { useSaveEvent } from '@/features/saved-events/mutations';
import { LANGUAGES } from '@/lib/i18n';
import { openCalendarEntry, openSystemSettings } from '@/lib/calendar';
import { logger } from '@/lib/logger';
import { MIN_TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { addToCalendar, CalendarPermissionError } from './add-to-calendar';

/** Reminder choices (spec §6): at start, 15 min, 1 hour, 1 day before. */
const REMINDERS = [0, 15, 60, 1440] as const;

type EventLike = EventSummary & Partial<Pick<Event, 'description' | 'notes'>>;

/**
 * Personalize + add to calendar (intent §4.4). The original text fills the editable fields; Shorten and/or Translate
 * runs one AI request and replaces them; the user can still edit, then picks a reminder and adds it to the calendar.
 */
export function PersonalizeForm({ event }: { event: EventLike }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const userId = useSession((s) => s.userId);
  const saveEvent = useSaveEvent();

  const originalDescription = event.description || event.notes || '';
  const originalFacts: PersonalizeResponse['facts'] = {
    dateTimeText: formatEventDate(event.start, i18n.language),
    venueText: formatVenue(event.venue),
    url: event.url,
  };

  const [shorten, setShorten] = useState(true);
  const [translate, setTranslate] = useState(i18n.language !== 'en');
  const [language, setLanguage] = useState<Language>((i18n.language as Language) ?? 'en');
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(originalDescription);
  const [facts, setFacts] = useState(originalFacts);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [reminder, setReminder] = useState<number>(60);
  const [adding, setAdding] = useState(false);

  const personalize = useMutation({
    mutationFn: () =>
      personalizeApi.run(event.id, { shorten, ...(translate ? { translateTo: language } : {}) }),
    onSuccess: (result) => {
      setTitle(result.title);
      setDescription(result.description);
      setFacts(result.facts);
      setFromCache(result.cached);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'AI_LIMIT_REACHED') {
        snackbar.error(t('personalize.limitReached'), { label: t('personalize.useOriginal'), onPress: resetToOriginal });
      } else {
        snackbar.error(t(errorMessageKey(error)));
      }
    },
  });

  function resetToOriginal() {
    setTitle(event.title);
    setDescription(originalDescription);
    setFacts(originalFacts);
    setFromCache(null);
  }

  async function onAdd() {
    if (!userId) return;
    setAdding(true);
    try {
      const calendarEventId = await addToCalendar({ userId, event, title, description, facts, reminderMinutes: reminder });
      saveEvent.mutate(event.id); // queued and sent later when offline
      // The event is usually weeks away; "View" jumps straight to it in the calendar app.
      snackbar.success(t('personalize.added', { date: facts.dateTimeText }), {
        label: t('personalize.view'),
        onPress: () => void openCalendarEntry(calendarEventId),
      });
      router.back();
    } catch (error) {
      if (error instanceof CalendarPermissionError) {
        snackbar.error(
          t('personalize.permissionNeeded'),
          error.result === 'blocked' ? { label: t('personalize.openSettings'), onPress: () => void openSystemSettings() } : undefined,
        );
      } else {
        logger.error('add to calendar failed', error);
        snackbar.error(t('personalize.calendarFailed'));
      }
    } finally {
      setAdding(false);
    }
  }

  const canApply = shorten || translate;

  return (
    <FormScreen
      actions={
        <Button label={t('personalize.addToCalendar')} icon="calendar-outline" onPress={() => void onAdd()} loading={adding} />
      }>
      <OfflineBanner />
      <View style={styles.topBar}>
        <BackButton />
        <AppText variant="heading" style={styles.flex} numberOfLines={1} accessibilityRole="header">
          {t('personalize.title')}
        </AppText>
      </View>
      <AppText color="textMuted">{t('personalize.subtitle')}</AppText>

      {/* Options */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md }]}>
        <Option label={t('personalize.shorten')} hint={t('personalize.shortenHint')} value={shorten} onChange={setShorten} />
        <Option label={t('personalize.translate')} hint={t('personalize.translateHint')} value={translate} onChange={setTranslate} />
        {translate && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {LANGUAGES.map((code) => (
              <Chip key={code} label={t(`languages.${code}`)} active={language === code} onPress={() => setLanguage(code)} />
            ))}
          </ScrollView>
        )}
        <Button
          label={t('personalize.apply')}
          variant="outline"
          icon="sparkles-outline"
          onPress={() => personalize.mutate()}
          loading={personalize.isPending}
          disabled={!canApply}
        />
      </View>

      {/* Result (editable) */}
      <View style={styles.resultHeader}>
        <AppText variant="bodyStrong">{t('personalize.result')}</AppText>
        {fromCache !== null && (
          <Pressable onPress={resetToOriginal} accessibilityRole="button" hitSlop={8} style={styles.link}>
            <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
              {t('personalize.useOriginal')}
            </AppText>
          </Pressable>
        )}
      </View>
      {fromCache && (
        <AppText variant="caption" color="textMuted">
          {t('personalize.fromCache')}
        </AppText>
      )}
      <TextField label={t('personalize.eventTitle')} value={title} onChangeText={setTitle} />
      <TextField
        label={t('personalize.description')}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <View style={{ gap: 4 }}>
        <AppText variant="caption" color="textMuted">{`🗓 ${facts.dateTimeText}`}</AppText>
        {facts.venueText && <AppText variant="caption" color="textMuted">{`📍 ${facts.venueText}`}</AppText>}
      </View>

      {/* Reminder */}
      <AppText variant="bodyStrong">{t('personalize.reminder')}</AppText>
      <View style={[styles.wrap, { gap: spacing.sm }]}>
        {REMINDERS.map((minutes) => (
          <Chip key={minutes} label={t(`personalize.reminders.${minutes}`)} active={reminder === minutes} onPress={() => setReminder(minutes)} />
        ))}
      </View>
    </FormScreen>
  );
}

function Option({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.option}>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.brand, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        active ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <AppText variant="caption" style={{ color: active ? colors.onPrimary : colors.text, fontWeight: '500' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
});
