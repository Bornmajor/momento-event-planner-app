import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, Button, FormScreen, OfflineBanner, snackbar, TextField } from '@/components/ui';
import { openCalendarEntry, openSystemSettings } from '@/core/calendar/device-calendar';
import { failureMessage } from '@/core/failures';
import { LANGUAGES } from '@/core/i18n/i18n';
import { logger } from '@/core/logger';
import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';
import { useSession, type Language } from '@/features/auth';
import { formatEventDate, formatVenue, type EventView } from '@/features/events';

import { AiLimitFailure, CalendarPermissionFailure } from '../../domain/failures';
import type { CalendarFacts } from '../../domain/models/personalization';
import { useAddToCalendar } from '../hooks/use-add-to-calendar';
import { usePersonalize } from '../hooks/use-personalize';

/** Reminder choices (spec §6): at start, 15 min, 1 hour, 1 day before. */
const REMINDERS = [0, 15, 60, 1440] as const;

/**
 * Personalize + add to calendar (intent §4.4). The original text fills the editable fields; Shorten and/or Translate
 * runs one AI request and replaces them; the user can still edit, then picks a reminder and adds it to the calendar.
 */
export function PersonalizeForm({ event }: { event: EventView }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const userId = useSession((s) => s.userId);
  const addToCalendar = useAddToCalendar();

  const originalDescription = event.description || event.notes || '';
  const originalFacts: CalendarFacts = {
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

  const personalize = usePersonalize(
    event.id,
    (result, textLanguage) => {
      setTitle(result.title);
      setDescription(result.description);
      // The backend writes the date in the venue's time zone; show it in the user's, like everywhere else in the app.
      setFacts({ ...result.facts, dateTimeText: formatEventDate(event.start, textLanguage) });
      setFromCache(result.cached);
    },
    (failure) => {
      if (failure instanceof AiLimitFailure) {
        snackbar.error(t('personalize.limitReached'), { label: t('personalize.useOriginal'), onPress: resetToOriginal });
      } else {
        snackbar.error(t(failureMessage(failure)));
      }
    },
  );

  /** Runs one AI request: shorten and/or translate. The result is written in the target language, else the app's. */
  const applyAi = () =>
    personalize.mutate({
      options: { shorten, ...(translate ? { translateTo: language } : {}) },
      textLanguage: translate ? language : i18n.language,
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
      const calendarEventId = await addToCalendar({
        userId,
        event: { ...event, description: event.description ?? null, notes: event.notes ?? null },
        title,
        description,
        facts,
        reminderMinutes: reminder,
      });
      // The event is usually weeks away; "View" jumps straight to it in the calendar app.
      snackbar.success(t('personalize.added', { date: facts.dateTimeText }), {
        label: t('personalize.view'),
        onPress: () => void openCalendarEntry(calendarEventId),
      });
      router.back();
    } catch (failure) {
      if (failure instanceof CalendarPermissionFailure) {
        snackbar.error(
          t('personalize.permissionNeeded'),
          failure.result === 'blocked' ? { label: t('personalize.openSettings'), onPress: () => void openSystemSettings() } : undefined,
        );
      } else {
        logger.error('add to calendar failed', failure);
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
          onPress={applyAi}
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
