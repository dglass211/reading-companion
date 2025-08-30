// src/data/db.ts
// Thin wrappers around Supabase for your core entities.

import { supabase } from '../lib/supabase';
async function getCurrentUid(retries = 3): Promise<string> {
  // Fast path: active session
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id;
  if (uid) return uid;
  // Fallback: read user directly
  const { data: ures } = await supabase.auth.getUser();
  if (ures?.user?.id) return ures.user.id;
  // Wait for auth state change once (session restore is async on app launch)
  if (retries <= 0) throw new Error('Not signed in');
  await new Promise<void>((resolve) => setTimeout(resolve, 400));
  return getCurrentUid(retries - 1);
}

function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ---- Types used by screens (safe & simple) ----
export type Book = {
  id: string;
  title: string;
  author?: string | null;
  openlibrary_id?: string | null;
  isbn?: string | null;
  cover_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Note = {
  id: string;
  book_id?: string | null;
  chapter?: string | null;
  question_type?: string | null; // e.g., "takeaway", "reflection"
  topic?: string | null; // e.g., "habits"
  content: string; // the user's answer / note
  tags?: string[]; // JSONB in DB, we expose as string[]
  created_at?: string;
};

// Helper for tag conversion (DB is jsonb; client uses string[])
function toTagsArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

// ---- BOOKS ----
export async function listBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Book[];
}

export async function upsertBook(b: Partial<Book> & { title: string }, opts?: { userId?: string }): Promise<Book> {
  // Ensure we include user_id to satisfy NOT NULL + RLS policies
  const uid = isUuid(opts?.userId) ? (opts!.userId as string) : await getCurrentUid();
  const payload: any = { ...b, user_id: uid };
  const { data, error } = await supabase
    .from('books')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Book;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

// ---- NOTES ----
export async function listNotesByBook(bookId?: string): Promise<Note[]> {
  let q = supabase.from('notes').select('*').order('created_at', { ascending: false });
  if (bookId) q = q.eq('book_id', bookId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((n) => ({ ...(n as any), tags: toTagsArray((n as any).tags) })) as Note[];
}

export async function createNote(n: {
  book_id?: string | null;
  chapter?: string | null;
  question_type?: string | null;
  topic?: string | null;
  content: string;
  tags?: string[];
}): Promise<Note> {
  // Include user_id to satisfy RLS (notes.user_id = auth.uid())
  const uid = await getCurrentUid();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...n,
      user_id: uid,
      tags: n.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return { ...(data as any), tags: toTagsArray((data as any).tags) } as Note;
}

// For Vapi Q&A notes - matches the format from vapiClient
export async function saveVapiNote(n: {
  bookId: string;
  bookTitle: string;
  author: string;
  chapterNumber?: number;
  question: string;
  answer: string;
  questionType?: string;
  topic?: string;
  tags: string[];
}): Promise<void> {
  // Dynamically import tag generator to avoid circular dependencies
  const { generateTags } = await import('../services/tagGenerator');
  
  // Generate AI tags
  const aiTags = await generateTags(n.question, n.answer);
  
  // Convert from Vapi format to Supabase format
  const noteData = {
    book_id: n.bookId,
    chapter: n.chapterNumber ? `Chapter ${n.chapterNumber}` : null,
    question_type: n.questionType ?? null,
    topic: n.topic ?? null,
    // Combine Q&A into content field
    content: `Q: ${n.question}\n\nA: ${n.answer}`,
    tags: aiTags.length > 0 ? aiTags : n.tags,
  };
  
  await createNote(noteData);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}


