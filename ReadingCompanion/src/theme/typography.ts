export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  lineHeights: {
    sm: 18,
    md: 22,
    lg: 28,
    xl: 32,
  },
} as const;
export type AppTypography = typeof typography;
