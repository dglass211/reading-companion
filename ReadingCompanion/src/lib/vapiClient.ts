import Vapi from '@vapi-ai/react-native';
import { listBooks, saveVapiNote } from '../data/db';
import { useVoiceStore } from '../store/useVoiceStore';

export type VapiEvent = 'call-start' | 'call-end' | 'volume-level' | 'error' | 'call-start-progress';

type Listener = (...args: any[]) => void;

const apiKey = process.env['EXPO_PUBLIC_VAPI_KEY'] as string;
if (!apiKey) {
  console.warn('EXPO_PUBLIC_VAPI_KEY is not set');
}

const vapi = new Vapi(apiKey ?? '');

// Helper to get the current book (first book in the library)
async function getCurrentBook() {
  const books = await listBooks();
  return books[0] ?? null;
}

interface StartContext {
  bookTitle?: string | null;
  author?: string | null;
  chapterNumber?: number;
}

export function on(event: VapiEvent, cb: Listener) {
  vapi.on(event as any, cb);
}

export function off(event: VapiEvent, cb: Listener) {
  vapi.off(event as any, cb);
}

export async function setMuted(muted: boolean) {
  vapi.setMuted(muted);
}

export async function stopCall() {
  await vapi.stop();
}

// Utilities for pairing logic
function inferQuestionType(text: string): 'broad' | 'probe' | 'synthesis' {
  try {
    const turn = useVoiceStore.getState().turnIndex;
    if (turn === 0) return 'broad';
  } catch {}
  return 'probe';
}

function inferTopic(text: string): string | undefined {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const stop = new Set(['the','a','an','and','or','but','on','in','at','to','for','from','about','of','is','are','be','do','did','does','what','how','why','which','with','this','that','these','those','you','your']);
  const keywords = words.filter((w) => !stop.has(w) && w.length > 2).slice(0, 2);
  if (keywords.length === 0) return undefined;
  return keywords.join('-');
}

export function extractMeta(s: string) {
  const m = s.match(/<meta>(.*?)<\/meta>/s);
  let questionType: string | undefined;
  let topic: string | undefined;
  if (m) {
    try {
      const raw = JSON.parse(m[1] ?? '{}');
      const j = (raw ?? {}) as Record<string, unknown>;
      questionType = typeof j['question_type'] === 'string' ? (j['question_type'] as string) : undefined;
      topic = typeof j['topic'] === 'string' ? (j['topic'] as string) : undefined;
    } catch {}
  }
  // Strip any meta tags from spoken text
  const text = s.replace(/<meta>.*?<\/meta>/s, '').trim();
  // Fallback inference when metadata is absent
  if (!questionType) questionType = inferQuestionType(text);
  if (!topic) topic = inferTopic(text);
  return { text, questionType, topic };
}

export const buildTags = (b: { bookTitle: string; author: string; chapterNumber?: number; questionType?: string; topic?: string }) => [
  b.bookTitle,
  b.author,
  `Ch ${b.chapterNumber ?? '?'}`,
  b.questionType ?? 'Question',
  b.topic ?? 'General',
];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Temporary event logger (prints each event name once)
const _seenEvents = new Set<string>();
function logOnce(event: string) {
  if (_seenEvents.has(event)) return;
  _seenEvents.add(event);
  vapi.on(event as any, (...args: any[]) => {
    try {
      // eslint-disable-next-line no-console
      console.log('[Vapi:event]', event, typeof args[0] === 'object' ? JSON.stringify(args[0]).slice(0, 300) : String(args[0]));
    } catch {}
  });
}
['message', 'transcript', 'partial-transcript', 'final-transcript', 'assistant-message', 'user-message', 'response', 'call-start', 'call-end', 'assistant-speech-started', 'assistant-speech-stopped', 'user-speech-started', 'user-speech-stopped'].forEach(logOnce);

export async function startCall(context: StartContext = {}) {
  // Use full assistant object per SDK types to avoid 400 validation
  const curBook = await getCurrentBook().catch(() => null);
  if (curBook) {
    // Assuming setState is available or you need to manage state differently
    // For now, we'll just log or handle it as needed.
    // If you have a state management solution, you might do:
    // set({ bookTitle: curBook.title, author: curBook.author ?? null });
    console.log('Current book loaded:', curBook);
  }

  await vapi.start({
    transcriber: {
      provider: 'deepgram',
      model: 'nova-3',
      language: 'en',
      endpointing: 300,
      smartFormat: true,
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            `You are a concise Nonfiction Reflection Coach. Ask 1 broad opening question, then short probing questions (acknowledge with 2–4 words). Keep each turn <120 words.\n` +
            `Do not include any machine-readable tags in your spoken output.\n` +
            `Context: Book="${context.bookTitle ?? 'Unknown'}"${context.author ? ` by ${context.author}` : ''}; Chapter=${context.chapterNumber ?? '?'}.`,
        },
      ],
      // keep model steady
      temperature: 0.3,
    },
    voice: {
      provider: 'playht',
      voiceId: 'michael',       // older male timbre
      speed: 0.88,
      temperature: 0.3
      // model: 'PlayHT2.0'      // optional: keep default or set explicitly
    },
    // Speak first, then wait for user
    firstMessageMode: 'assistant-speaks-first',
    firstMessageInterruptionsEnabled: false,
    firstMessage: `What are your initial thoughts from Chapter ${context.chapterNumber ?? '?'} of ${context.bookTitle ?? 'your book'}?`,
  } as any);
  // Ensure mic is unmuted
  try { vapi.setMuted(false); } catch {}

  // Pairing logic listeners
  // Half-duplex: mute mic while assistant speaks to avoid echo/barge-in
  vapi.on('assistant-speech-started' as any, () => { try { vapi.setMuted(true); } catch {} });
  vapi.on('assistant-speech-stopped' as any, () => { try { vapi.setMuted(false); } catch {} });

  // Track current user-turn aggregation and save state
  let lastFinalAt = 0;
  let bufferedUserText = '';
  let lastTurnSeen = -1;
  let hasAnyFinalThisTurn = false;
  let finalSaveTimer: any = null;

  async function flushSave(via: string) {
    const store = useVoiceStore.getState();
    const pending = store.pendingQuestion;
    if (!pending || !pending.text.trim()) {
      try { console.log('[Vapi pairing] flush skipped (no pending) via', via); } catch {}
      return;
    }
    if (!bufferedUserText.trim()) {
      try { console.log('[Vapi pairing] flush skipped (no buffered final) via', via); } catch {}
      return;
    }
    const cur = await getCurrentBook().catch(() => null);
    if (!cur) { try { console.log('[Vapi pairing] no current book; cannot save'); } catch {}; return; }
    const note = {
      bookId: cur.id,
      bookTitle: cur.title,
      author: cur.author ?? '',
      chapterNumber: store.chapter,
      question: pending.text,
      answer: bufferedUserText.trim(),
      questionType: pending.questionType,
      topic: pending.topic,
      tags: buildTags({ bookTitle: cur.title, author: cur.author ?? '', chapterNumber: store.chapter, questionType: pending.questionType, topic: pending.topic }),
    };
    try {
      await saveVapiNote(note);
      try { console.log('note_saved', { bookId: note.bookId, via }); } catch {}
    } catch (e) {
      const msgStr = String((e as any)?.message ?? e ?? '');
      try { console.log('note_save_error', msgStr); } catch {}
    }
    store.clearPendingQuestion();
    store.incrementTurnIndex();
    bufferedUserText = '';
    hasAnyFinalThisTurn = false;
    lastFinalAt = 0;
  }

  // Helper extractors and centralized handler with detailed logs
  const getRole = (msg: any): string => {
    return String((msg && (msg.role || msg.sender || msg.type || msg.source)) ?? '');
  };
  const getText = (msg: any): string => {
    // common shapes: { text }, { content }, { message }, transcripts and voice-input/model-output
    const direct = (msg?.text ?? msg?.content ?? msg?.message ?? msg?.transcript ?? msg?.output ?? msg?.input ?? '');
    const nested = msg?.data?.text ?? msg?.data?.content ?? '';
    return String((direct || nested || '')).trim();
  };
  const getIsFinal = (msg: any): boolean => {
    // possible flags: final, isFinal, is_final, finalized, status === 'final'
    const status = (msg?.status ?? '').toString().toLowerCase();
    const transcriptType = (msg?.transcriptType ?? msg?.transcript_type ?? '').toString().toLowerCase();
    return Boolean(
      msg?.final === true ||
      msg?.isFinal === true ||
      msg?.is_final === true ||
      msg?.finalized === true ||
      status === 'final' ||
      transcriptType === 'final'
    );
  };

  async function handleIncomingMessage(msg: any) {
    const store = useVoiceStore.getState();
    const role = getRole(msg).toLowerCase();
    const typ = String(msg?.type ?? '').toLowerCase();
    const text = getText(msg);
    const finalFlag = getIsFinal(msg);
    try {
      console.log('[Vapi pairing] incoming', { role, type: typ, finalFlag, len: text.length, preview: text.slice(0, 80) });
    } catch {}

    if (!text) return;

    // Assistant question → capture pending (use assistant final transcript or synthesized voice-input)
    const isAssistantish = role.includes('assistant') || typ === 'voice-input';
    if (isAssistantish) {
      // For transcripts, only capture on final; for voice-input capture immediately
      const shouldCapture = typ === 'voice-input' || finalFlag === true;
      if (!shouldCapture) return;
      const { text: qText, questionType, topic } = extractMeta(text);
      console.log('[Vapi pairing] setPendingQuestion', { qText: qText.slice(0, 80), questionType, topic });
      store.setPendingQuestion({ text: qText, questionType, topic });
      return;
    }

    // User finals: aggregate this turn, do not save yet. We'll save on speech-stopped
    if (role.includes('user') || role.includes('customer')) {
      if (!finalFlag) return; // ignore partials
      const now = Date.now();
      const sameTurn = lastTurnSeen === store.turnIndex;
      if (sameTurn && now - lastFinalAt < 500) {
        if (text.length > bufferedUserText.length) bufferedUserText = text;
        console.log('[Vapi pairing] debounced final; buffered len', bufferedUserText.length);
      } else {
        lastTurnSeen = store.turnIndex;
        bufferedUserText = text;
      }
      lastFinalAt = now;
      hasAnyFinalThisTurn = true;

      // Save also on final (debounced) because some SDKs emit speech-stopped before finals
      if (finalSaveTimer) { try { clearTimeout(finalSaveTimer); } catch {} }
      finalSaveTimer = setTimeout(() => { flushSave('final-debounce'); }, 600);
    }
  }

  vapi.on('call-start' as any, (info: any) => {
    const callId: string = String((info && (info.id || info.callId)) ?? uid());
    try { useVoiceStore.getState().startConversation(callId); } catch {}
    lastFinalAt = 0; bufferedUserText = ''; lastTurnSeen = 0;
  });

  vapi.on('message' as any, handleIncomingMessage);
  // Some SDKs emit role-specific or transcript events; wire them too
  vapi.on('assistant-message' as any, handleIncomingMessage);
  vapi.on('user-message' as any, handleIncomingMessage);
  vapi.on('final-transcript' as any, handleIncomingMessage);

  // If SDK exposes explicit end-of-user-speech, use it to flush buffered partials
  vapi.on('user-speech-stopped' as any, async () => {
    try {
      if (finalSaveTimer) { try { clearTimeout(finalSaveTimer); } catch {} finalSaveTimer = null; }
      if (!hasAnyFinalThisTurn) { try { console.log('[Vapi pairing] speech-stopped without finals; skip'); } catch {} ; return; }
      await flushSave('speech-stopped');
    } finally {
      // no-op (flushSave resets state)
    }
  });

  // Fallback: when call ends, if we have a pending question and buffered finals, persist once
  vapi.on('call-end' as any, async () => {
    try {
      const store = useVoiceStore.getState();
      if (store.pendingQuestion && bufferedUserText.trim()) {
        const cur = await getCurrentBook().catch(() => null);
        if (!cur) return;
        const note = {
          bookId: cur.id,
          bookTitle: cur.title,
          author: cur.author ?? '',
          chapterNumber: store.chapter,
          question: store.pendingQuestion.text,
          answer: bufferedUserText.trim(),
          questionType: store.pendingQuestion.questionType,
          topic: store.pendingQuestion.topic,
          tags: buildTags({ bookTitle: cur.title, author: cur.author ?? '', chapterNumber: store.chapter, questionType: store.pendingQuestion.questionType, topic: store.pendingQuestion.topic }),
        };
        await saveVapiNote(note);
        console.log('note_saved', { bookId: note.bookId, via: 'call-end' });
      }
    } catch {}
  });

  return () => {
    try { (vapi as any).removeAllListeners?.(); } catch {}
  };
}

export function say(text: string) {
  vapi.say(text, false, false, false);
}
export default { startCall, stopCall, setMuted, on, off, say };
