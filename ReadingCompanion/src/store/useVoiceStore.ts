import { create } from 'zustand';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import VapiClient, { on as vapiOn, off as vapiOff, startCall as vapiStart, stopCall as vapiStop } from '../lib/vapiClient';

export type TranscriptMessage = { id: string; role: 'user' | 'assistant' | 'system'; content: string };
export type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'error';

export interface VoiceState {
  // UI/state
  bookTitle: string | null;
  author: string | null;
  chapter: number;
  currentConversationId?: string | null;
  turnIndex: number;
  pendingQuestion?: { text: string; questionType?: string; topic?: string } | null;
  isRecording: boolean;
  status: VoiceStatus;
  statusMessage?: string;
  levels: number[]; // 12 bars 0..1
  transcript: TranscriptMessage[];

  // Vapi call lifecycle
  unsubscribeVapi?: (() => void) | null;

  // Actions
  setBook: (title: string | null, author: string | null) => void;
  setChapter: (n: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  startConversation: (id: string) => void;
  incrementTurnIndex: () => void;
  setPendingQuestion: (q: { text: string; questionType?: string; topic?: string } | null) => void;
  clearPendingQuestion: () => void;

  requestMicrophonePermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  sendToAssistant: (payload: { audioUri?: string; text?: string }) => Promise<void>;
  appendTranscript: (role: TranscriptMessage['role'], content: string) => void;
}

const NUM_BARS = 12;

function emptyLevels(): number[] {
  return Array.from({ length: NUM_BARS }, () => 0);
}

async function ensureAudioModeAsync() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playThroughEarpieceAndroid: false,
  });
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  bookTitle: null,
  author: null,
  chapter: 3,
  currentConversationId: null,
  turnIndex: 0,
  pendingQuestion: null,
  isRecording: false,
  status: 'idle',
  levels: emptyLevels(),
  transcript: [],
  unsubscribeVapi: null,

  setBook: (title, author) => set({ bookTitle: title, author }),
  setChapter: (n) => set({ chapter: Math.max(1, Math.floor(n)) }),
  nextChapter: () => set((s) => ({ chapter: s.chapter + 1 })),
  prevChapter: () => set((s) => ({ chapter: Math.max(1, s.chapter - 1) })),

  startConversation: (id: string) => set({ currentConversationId: id, turnIndex: 0 }),
  incrementTurnIndex: () => set((s) => ({ turnIndex: s.turnIndex + 1 })),
  setPendingQuestion: (q) => set({ pendingQuestion: q }),
  clearPendingQuestion: () => set({ pendingQuestion: null }),

  requestMicrophonePermission: async () => {
    const cur = await Audio.getPermissionsAsync();
    if (cur.status === 'granted') return true;
    const res = await Audio.requestPermissionsAsync();
    return res.status === 'granted';
  },

  appendTranscript: (role, content) =>
    set((s) => ({ transcript: [...s.transcript, { id: String(Date.now()), role, content }] })),

  startRecording: async () => {
    if (get().isRecording) return;
    const ok = await get().requestMicrophonePermission();
    if (!ok) {
      set({ status: 'error', statusMessage: 'Microphone permission denied' });
      return;
    }
    await ensureAudioModeAsync();

    // Wire Vapi events
    const onStart = () => {
      console.log('[Vapi] call-start');
      set({ status: 'listening', isRecording: true, statusMessage: 'listening…' });
    };
    const onEnd = () => {
      console.log('[Vapi] call-end');
      set({ status: 'idle', isRecording: false, statusMessage: undefined, levels: emptyLevels() });
    };
    const onError = (e: unknown) => {
      console.log('[Vapi] error:', e);
      set({ status: 'error', statusMessage: 'error' });
    };
    // useful progress logs to diagnose start
    const onProgress = (evt: any) => {
      try { console.log('[Vapi] call-start-progress:', evt?.stage, evt?.status, evt?.metadata || ''); } catch {}
      // When first message is finished playing, Vapi typically emits 'speech-end' then remains idle
    };
    const onVolume = (payload: any) => {
      // SDK emits a number or event object; normalize to number 0..1
      const raw = typeof payload === 'number' ? payload : (payload?.level ?? payload?.volume ?? 0);
      const amp = Math.max(0, Math.min(1, Number(raw)));
      const levels = Array.from({ length: NUM_BARS }, (_, i) => {
        const variance = 0.6 + (i % 4) * 0.09;
        return Math.max(0, Math.min(1, amp * variance * (0.9 + Math.random() * 0.25)));
      });
      set({ levels });
    };

    vapiOn('call-start', onStart);
    vapiOn('call-end', onEnd);
    vapiOn('error', onError);
    vapiOn('volume-level', onVolume);
    vapiOn('call-start-progress' as any, onProgress);

    set({ unsubscribeVapi: () => {
      vapiOff('call-start', onStart);
      vapiOff('call-end', onEnd);
      vapiOff('error', onError);
      vapiOff('volume-level', onVolume);
      vapiOff('call-start-progress' as any, onProgress);
    }});

    console.log('[Vapi] startCall →', { bookTitle: get().bookTitle, author: get().author, chapterNumber: get().chapter });
    try {
      const unsub = await vapiStart({
        bookTitle: get().bookTitle,
        author: get().author,
        chapterNumber: get().chapter,
      });
      if (unsub) set({ unsubscribeVapi: unsub });
    } catch (e) {
      console.log('[Vapi] startCall error:', e);
      set({ status: 'error', statusMessage: 'error' });
    }
  },

  stopRecording: async () => {
    try { await vapiStop(); } catch {}
    const unsub = get().unsubscribeVapi;
    if (unsub) unsub();
    set({ unsubscribeVapi: null, isRecording: false, status: 'idle', statusMessage: undefined });
  },

  sendToAssistant: async ({ audioUri, text }) => {
    // With Vapi, the mic stream and text messages are sent through the SDK.
    // For now, append local transcript to mirror state; actual send would use vapi.send or message APIs if needed.
    if (text) get().appendTranscript('user', text);
  },
}));

export function useVoiceComputed() {
  const chapterLabel = (state: VoiceState) => `Chapter ${state.chapter}`;
  return { chapterLabel };
}
