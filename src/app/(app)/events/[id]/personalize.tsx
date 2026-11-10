import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { failureMessage } from '@/core/failures';
import { BackButton, ErrorState, FormScreen } from '@/components/ui';
import { useEvent } from '@/features/events';
import { PersonalizeForm } from '@/features/personalize/personalize-form';
import { useTheme } from '@/core/theme/use-theme';

/** Personalize + add to calendar for one event (spec §6). Waits for the full event so the description is there. */
export default function PersonalizeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const query = useEvent(id);
  const event = query.data;

  // The list summary has no description yet; wait for the full event (placeholder data is the summary).
  if (!event || query.isPlaceholderData) {
    return (
      <FormScreen actions={null}>
        <BackButton />
        {query.isError ? (
          <ErrorState message={t(failureMessage(query.error))} onRetry={() => void query.refetch()} />
        ) : (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
        )}
      </FormScreen>
    );
  }
  // Remount when the event changes so the form starts from that event's text.
  return <PersonalizeForm key={event.id} event={event} />;
}
