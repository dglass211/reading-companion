import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import LinenBackground from '../components/LinenBackground';

export default function OnboardingPurpose1({ navigation }: { navigation: any }) {
  const lines = [
    'I love to learn while reading',
    'but there is a certain joy from getting lost in a book.',
    'That’s why I wanted to make something to help me indulge my curiosity without ruining the flow of reading.',
  ];

  const opacities = useRef(lines.map(() => new Animated.Value(0))).current;
  const offsets = useRef(lines.map(() => new Animated.Value(8))).current;

  useEffect(() => {
    const animations = lines.map((_, i) =>
      Animated.parallel([
        Animated.timing(opacities[i]!, { toValue: 1, duration: 780, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: i * 520 }),
        Animated.timing(offsets[i]!, { toValue: 0, duration: 780, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: i * 520 }),
      ])
    );
    Animated.stagger(260, animations).start();
  }, [lines, opacities, offsets]);

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {lines.map((t, i) => (
            <Animated.Text key={i} style={[styles.line, { opacity: opacities[i]!, transform: [{ translateY: offsets[i]! }] }]}> 
              {t}
            </Animated.Text>
          ))}
        </View>
        <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={() => navigation.replace('OnboardingPurpose2')}>
          <Text style={styles.ctaText}>continue</Text>
        </Pressable>
      </SafeAreaView>
    </LinenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 44 },
  content: { flex: 1, justifyContent: 'center' },
  line: { color: '#FFFFFF', fontSize: 18, lineHeight: 18 + 24, marginBottom: 24 },
  cta: {
    alignSelf: 'center',
    backgroundColor: '#6EA8CE',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#0187E5',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  ctaText: { color: '#fff', fontWeight: '600' },
});


