import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export const Visualizer: React.FC<{ levels: number[] }> = ({ levels }) => {
  const BAR_COUNT = levels.length;
  const gap = 6;
  return (
    <View style={styles.wrap}>
      {levels.map((v, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 60,
            marginHorizontal: gap / 2,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: Math.max(4, Math.round(60 * v)),
              backgroundColor: theme.colors.primary,
              borderRadius: 3,
            }}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
});
