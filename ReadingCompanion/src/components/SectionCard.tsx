import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const SectionCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F2845',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});
