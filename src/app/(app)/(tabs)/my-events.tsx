import { useTranslation } from 'react-i18next';

import { EmptyState, OfflineBanner, Screen } from '@/components/ui';

/** My Events: saved events arrive in Batch 4 (plan.md). */
export default function MyEventsScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top', 'left', 'right']}>
      <OfflineBanner />
      <EmptyState icon="bookmark-outline" title={t('myEvents.emptyTitle')} message={t('myEvents.emptyBody')} />
    </Screen>
  );
}
