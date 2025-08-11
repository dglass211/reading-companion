import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { LinenBackground } from '../components/LinenBackground';
import { theme } from '../theme';
import { useVoiceStore } from '../store/useVoiceStore';
import { Visualizer } from '../components/voice/Visualizer';
import { MiniToast } from '../components/voice/Toast';

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
  } = useVoiceStore();

  const onMicPress = async () => {
    if (isRecording) await stopRecording();
    else await startRecording();
  };

  return (
    <LinenBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerWrap}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' }} style={styles.cover} />
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

          <Visualizer levels={levels} />

          <Pressable onPress={onMicPress} style={({ pressed }) => [styles.micCta, pressed && { opacity: 0.8 }]}>
            <Text style={styles.micIcon}>🎤</Text>
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
  centerWrap: { alignItems: 'center', paddingTop: 24 },
  cover: { width: 208, height: 208, borderRadius: 104, marginBottom: 24 },
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  micIcon: { color: '#fff', marginRight: 8, fontSize: 16 },
  micLabel: { color: '#fff', fontWeight: '600' },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  askIcon: { color: '#fff', marginRight: 8, fontSize: 18 },
  askLabel: { color: '#fff' },
});
