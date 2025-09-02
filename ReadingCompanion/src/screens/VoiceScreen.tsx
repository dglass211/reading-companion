import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Image, Pressable, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Shadow } from 'react-native-shadow-2';
import LinenBackground from '../components/LinenBackground';
import { theme } from '../theme';
import { useVoiceStore } from '../store/useVoiceStore';
import { Visualizer } from '../components/voice/Visualizer';
import { IconMic } from '../components/icons/TabIcons';
import { MiniToast } from '../components/voice/Toast';
import { useBooksStore } from '../store/useBooksStore';

export const VoiceScreen: React.FC = () => {
  const {
    bookTitle,
    author,
    chapter,
    prevChapter,
    nextChapter,
    isRecording,
    startRecording,
    stopRecording,
    levels,
    status,
    setBook,
  } = useVoiceStore();
  const { currentBook } = useBooksStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isQuestionMode, setIsQuestionMode] = React.useState(false);

  // Load current book when screen comes into focus or currentBook changes
  useFocusEffect(
    useCallback(() => {
      if (currentBook) {
        setBook(currentBook.title, currentBook.author ?? null);
      }
    }, [currentBook, setBook])
  );

  const onMicPress = async () => {
    if (isRecording && !isQuestionMode) {
      await stopRecording();
      // Auto-increment to next chapter after stopping
      nextChapter();
    } else if (!isRecording) {
      setIsQuestionMode(false);
      await startRecording();
    }
  };

  const onAskQuestion = async () => {
    if (isRecording && isQuestionMode) {
      await stopRecording();
      setIsQuestionMode(false);
    } else if (!isRecording) {
      setIsQuestionMode(true);
      await startRecording();
    }
  };

  // Animate the light ring when recording
  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      // Rotation animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      pulse.start();
      rotate.start();
      
      return () => {
        pulse.stop();
        rotate.stop();
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    }
  }, [isRecording, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerWrap}>
          <View style={styles.coverWrap}>
            <Image
              source={require('../../assets/Blue Water Daytime Photo.jpg')}
              style={styles.cover}
            />
            {/* Glass ellipse overlay with inner shadow */}
            <View style={styles.glassOverlayWrap} pointerEvents="none">
              <Shadow
                distance={4}
                startColor={'rgba(0, 0, 0, 0.2)'}
                offset={[0, 0]}
                paintInside
                style={styles.glassShadow}
              >
                <View style={styles.glassInner} />
              </Shadow>
            </View>
            {/* Dynamic light ring visualizer */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.lightRing,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { rotate: spin },
                    ],
                  },
                ]}
                pointerEvents="none"
              />
            )}
            <View style={styles.portholeWrap} pointerEvents="none">
              <Image
                source={require('../../assets/slimPorthole.png')}
                style={styles.porthole}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.title}>{bookTitle ?? 'Actionable Gamification'}</Text>
          <View style={styles.authorRow}>
            <Text style={styles.iconBullet}>≣</Text>
            <Text style={styles.author}>{author ?? 'The Octalysis Framework'}</Text>
          </View>
          <View style={styles.chapterRow}>
            <Pressable onPress={prevChapter} style={styles.navBtn}><Text style={styles.navText}>◀</Text></Pressable>
            <Text style={styles.chapter}>Chapter {chapter}</Text>
            <Pressable onPress={nextChapter} style={styles.navBtn}><Text style={styles.navText}>▶</Text></Pressable>
          </View>

          {/* <Visualizer levels={levels} /> */}

          <Pressable onPress={onMicPress} style={({ pressed }) => [styles.micCta, pressed && { opacity: 0.8 }]}>
            <IconMic size={28} color="#fff"/>
            <Text style={styles.micLabel}>{isRecording && !isQuestionMode ? 'stop' : `reflect on ch ${chapter}`}</Text>
          </Pressable>

          <Pressable onPress={onAskQuestion} style={({ pressed }) => [styles.askRow, pressed && { opacity: 0.8 }]}>
            <Text style={styles.askIcon}>?</Text>
            <Text style={styles.askLabel}>{isRecording && isQuestionMode ? 'stop' : 'ask a question'}</Text>
          </Pressable>
        </View>
        <MiniToast visible={status === 'listening'} text="listening" />
      </SafeAreaView>
    </LinenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
  cover: { width: 224, height: 224, borderRadius: 112, marginBottom: 24, zIndex: 5 },
  coverWrap: { width: 224, height: 224, marginBottom: 24, position: 'relative' },
  portholeWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  porthole: { width: '125%', height: '125%', marginTop: 10 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  iconBullet: { color: theme.colors.textSecondary, marginRight: 8 },
  author: { color: theme.colors.textSecondary, fontWeight: '600' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  navBtn: { padding: 8 },
  navText: { color: '#fff', fontSize: 18 },
  chapter: { color: '#fff', fontSize: 18, marginHorizontal: 16, fontFamily: 'Georgia' },
  micCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6EA8CE',
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 28,
    // Shadow approximation of: 0 0 28px rgba(1,135,229,0.40), 0 2px 4px rgba(18,37,59,0.12)
    shadowColor: '#0187E5',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  micIcon: { color: '#fff', marginRight: 12, fontSize: 16},
  micLabel: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  askIcon: { color: '#fff', marginRight: 8, fontSize: 18 },
  askLabel: { color: '#fff' },
  glassOverlayWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 224,
    height: 224,
    borderRadius: 112,
    zIndex: 6,
  },
  glassShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 224,
    height: 224,
    borderRadius: 112,
  },
  glassInner: {
    width: '100%',
    height: '100%',
    borderRadius: 112,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    // Outer shadow for drop-shadow effect
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  lightRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: 'rgba(110, 168, 206, 0.6)',
    backgroundColor: 'transparent',
    shadowColor: '#6EA8CE',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    zIndex: 2,
  },
});
