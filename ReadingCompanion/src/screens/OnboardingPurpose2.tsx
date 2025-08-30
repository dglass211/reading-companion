import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import LinenBackground from '../components/LinenBackground';
import * as SecureStore from 'expo-secure-store';

const FLAG = 'rc_onboarding_done_v1';

export default function OnboardingPurpose2({ navigation }: { navigation: any }) {
  const lines = [
    'Just add your book',
    'Read a chapter',
    'Have a 90 second conversation answering a few questions about it',
    'Keep reading',
  ];

  const opacities = useRef(lines.map(() => new Animated.Value(0))).current;
  const offsets = useRef(lines.map(() => new Animated.Value(8))).current;

  useEffect(() => {
    const animations = lines.map((_, i) =>
      Animated.parallel([
        Animated.timing(opacities[i]!, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: i * 400 }),
        Animated.timing(offsets[i]!, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: i * 400 }),
      ])
    );
    Animated.stagger(200, animations).start();
  }, [lines, opacities, offsets]);

  async function finish() {
    navigation.replace('OnboardingAdd1stBook');
  }

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
        <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={finish}>
          <Text style={styles.ctaText}>continue</Text>
        </Pressable>
      </SafeAreaView>
    </LinenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 44 },
  content: { flex: 1, justifyContent: 'center' },
  line: { color: '#FFFFFF', fontSize: 18, lineHeight: 18 + 24, marginBottom: 12 },
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


