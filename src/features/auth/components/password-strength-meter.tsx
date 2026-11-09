import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { SegmentedBar } from '@/components/ui/segmented-bar';
import type { Colors } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { usePasswordStrength, type StrengthScore } from '../password-strength';
import { passwordChecks } from '../schemas';

const LEVELS: Record<StrengthScore, { key: string; color: keyof Colors; filled: number }> = {
  0: { key: 'weak', color: 'danger', filled: 1 },
  1: { key: 'weak', color: 'danger', filled: 1 },
  2: { key: 'fair', color: 'warning', filled: 2 },
  3: { key: 'good', color: 'success', filled: 3 },
  4: { key: 'strong', color: 'success', filled: 4 },
};

/**
 * Live password feedback: a 4-segment strength bar with a label and tip (how guessable it is), plus the backend's
 * required rules as a checklist.
 */
export function PasswordStrengthMeter({ password, userInputs }: { password: string; userInputs: string[] }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const score = usePasswordStrength(password, userInputs);
  const level = score === null ? null : LEVELS[score];
  const checks = passwordChecks(password);
  const rules = [
    { ok: checks.length, label: t('auth.ruleLength') },
    { ok: checks.letter, label: t('auth.ruleLetter') },
    { ok: checks.digit, label: t('auth.ruleDigit') },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        <View style={styles.header}>
          <AppText variant="caption" color="textMuted">
            {t('auth.strength.title')}
          </AppText>
          {level && (
            <AppText variant="caption" accessibilityLiveRegion="polite" style={[styles.bold, { color: colors[level.color] }]}>
              {t(`auth.strength.${level.key}`)}
            </AppText>
          )}
        </View>
        <SegmentedBar
          segments={4}
          filled={level?.filled ?? 0}
          color={level ? colors[level.color] : colors.border}
          accessibilityLabel={t('auth.strength.title')}
          accessibilityValue={{ text: level ? t(`auth.strength.${level.key}`) : t('auth.strength.empty') }}
        />
        <AppText variant="caption" color="textMuted">
          {t(level ? `auth.strength.${level.key}Tip` : 'auth.strength.empty')}
        </AppText>
      </View>
      <View style={{ gap: 6 }} accessibilityLabel={t('auth.passwordRulesTitle')}>
        {rules.map((rule) => (
          <View key={rule.label} style={styles.rule} accessibilityState={{ checked: rule.ok }} accessible>
            <Ionicons
              name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={rule.ok ? colors.success : colors.textMuted}
            />
            <AppText variant="caption" color={rule.ok ? 'text' : 'textMuted'}>
              {rule.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bold: { fontWeight: '700' },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
