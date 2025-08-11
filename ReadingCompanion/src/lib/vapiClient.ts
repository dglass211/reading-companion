import Vapi from '@vapi-ai/react-native';
import { getCurrentBook } from '../data/booksDal';

export type VapiEvent = 'call-start' | 'call-end' | 'volume-level' | 'error' | 'call-start-progress';

type Listener = (...args: any[]) => void;

const apiKey = process.env['EXPO_PUBLIC_VAPI_KEY'] as string;
if (!apiKey) {
  console.warn('EXPO_PUBLIC_VAPI_KEY is not set');
}

const vapi = new Vapi(apiKey ?? '');

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
            `You are a concise coach for helping people reflect on Nonfiction books. Ask 1 broad question, then wait. When the user answers, respond with a probing follow-up. Start each follow-up with a brief 2–4 word acknowledgement, then the question. Oscillate between diving deeper and moving on to another broad level inquiry for reflection such as Is there anything you disagree with from this chapter or Is there anything you're confused about from this chapter.\n` +
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
  return () => {
    try { (vapi as any).removeAllListeners?.(); } catch {}
  };
}

export function say(text: string) {
  vapi.say(text, false, false, false);
}
export default { startCall, stopCall, setMuted, on, off, say };
