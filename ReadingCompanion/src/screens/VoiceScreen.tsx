import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import LinenBackground from '../components/LinenBackground';
import { theme } from '../theme';
import { useVoiceStore } from '../store/useVoiceStore';
import { Visualizer } from '../components/voice/Visualizer';
import { IconMic } from '../components/icons/TabIcons';
import { MiniToast } from '../components/voice/Toast';
import { listBooks } from '../data/db';

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

  // Load current book when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const books = await listBooks();
        const current = books[0];
        if (current) {
          setBook(current.title, current.author ?? null);
        }
      })();
    }, [setBook])
  );

  const onMicPress = async () => {
    if (isRecording) await stopRecording();
    else await startRecording();
  };

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerWrap}>
          <View style={styles.coverWrap}>
            <Image
              source={require('../../assets/Blue Water Daytime Photo.jpg')}
              style={styles.cover}
            />
            <View style={styles.portholeWrap} pointerEvents="none">
              <Image
                source={require('../../assets/porthole.png')}
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
            <Text style={styles.micLabel}>{isRecording ? 'stop' : `reflect on ch ${chapter}`}</Text>
          </Pressable>

          <Pressable onPress={() => {}} style={styles.askRow}>
            <Text style={styles.askIcon}>?</Text>
            <Text style={styles.askLabel}>ask a question</Text>
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
  cover: { width: 224, height: 224, borderRadius: 104, marginBottom: 24 },
  coverWrap: { width: 224, height: 224, marginBottom: 24, position: 'relative' },
  portholeWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  porthole: { width: '108%', height: '108%' },
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
});
