import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { useLanguageStore } from '@/features/settings/language-store';
import { LANGUAGE_NAMES, LANGUAGES } from '@/lib/i18n';
import { MIN_TOUCH } from '@/theme/tokens';
import { useThemeStore, type ThemePreference } from '@/theme/theme-store';
import { useTheme } from '@/theme/use-theme';

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.segment, { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.option,
                { borderRadius: radii.pill, backgroundColor: selected ? colors.primary : 'transparent' },
              ]}>
              <AppText variant="caption" style={{ color: selected ? colors.onPrimary : colors.text }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Temporary theme and language switches so Batch 1 can be checked on a device.
 * Replaced by the real Settings screen in Batch 4.
 */
export function SettingsPreview() {
  const { t, i18n } = useTranslation();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('placeholder.system') },
    { value: 'light', label: t('placeholder.light') },
    { value: 'dark', label: t('placeholder.dark') },
  ];
  return (
    <View style={{ gap: 16, alignSelf: 'stretch' }}>
      <Segmented label={t('placeholder.theme')} options={themeOptions} value={preference} onChange={setPreference} />
      <Segmented
        label={t('placeholder.language')}
        options={LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code] }))}
        value={i18n.language as (typeof LANGUAGES)[number]}
        onChange={setLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4 },
  option: { flex: 1, minHeight: MIN_TOUCH - 8, alignItems: 'center', justifyContent: 'center' },
});
