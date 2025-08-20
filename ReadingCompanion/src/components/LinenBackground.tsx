import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function LinenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.base} />
      <Image
        source={require('../../assets/NoiseGrain.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#061B3D' },
});
