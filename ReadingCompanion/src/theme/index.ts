import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  background: {
    variant: 'linen' as 'linen' | 'solid',
  },
} as const;

export type AppTheme = typeof theme;
