import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  size: number;
  uri?: string | null;
  title: string;
}

function initialsFrom(text: string): string {
  const words = text.trim().split(/\s+/);
  const initials = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '');
  return initials.join('');
}

export const BookCover: React.FC<Props> = ({ size, uri, title }) => {
  const [error, setError] = useState(false);
  const actual = size + 20;
  if (!uri || error) {
    return (
      <View style={[styles.fallback, { width: actual, height: actual * 1.5, borderRadius: 6 }]}>        
        <Svg width={actual} height={actual * 1.5} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2C3E50" />
              <Stop offset="100%" stopColor="#4CA1AF" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#g)" />
        </Svg>
        <Text style={styles.initials}>{initialsFrom(title)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: actual, height: actual * 1.5, borderRadius: 6 }}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
