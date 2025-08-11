import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Global linen background: solid deep blue + randomized dot noise (since SVG filters are unsupported on native)
function buildRandomNoiseSvg(): string {
  const dots: string[] = [];
  const dotCount = 900; // density
  for (let i = 0; i < dotCount; i++) {
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const r = (Math.random() * 0.2 + 0.02).toFixed(2); // 0.05..0.40
    const isBlue = Math.random() < 0.6;
    const color = isBlue ? '#37A3E2' : '#FFFFFF';
    const opacity = (isBlue ? (Math.random() * 0.18 + 0.04) : (Math.random() * 0.12 + 0.03)).toFixed(2);
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${opacity}" />`);
  }
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
  <rect x="0" y="0" width="100%" height="100%" fill="#061B3D" />
  <g opacity="0.5">${dots.join('')}</g>
</svg>`;
}

export const LinenBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const noiseSvg = useMemo(buildRandomNoiseSvg, []);
  return (
    <View style={styles.container}>
      <View style={styles.base} />
      {/* SVG noise overlay */}
      <SvgXml xml={noiseSvg} width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#061B3D',
  },
  // No extra layers; SVG covers full screen
  content: { flex: 1 },
});
