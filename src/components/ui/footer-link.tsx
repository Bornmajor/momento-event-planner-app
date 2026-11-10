import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH } from '@/core/theme/tokens';

import { AppText } from './app-text';

/** "Don't have an account? Sign Up" style footer under a form's main button. */
export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footer}>
      <AppText variant="caption" color="textMuted">
        {prompt}
      </AppText>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={styles.action}>
        <AppText variant="caption" style={styles.bold}>
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  bold: { fontWeight: '700' },
});
