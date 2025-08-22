import { getDb } from '../data/sqlite';
import { getCurrentUser } from '../auth/auth';

export type SavedNote = {
  id: string;
  conversationId?: string;
  turnIndex: number;
  bookId: string;
  bookTitle: string;
  author: string;
  chapterNumber?: number;
  chapterName?: string;
  question: string;
  answer: string;
  questionType?: string;
  topic?: string;
  tags: string[];
  createdAt: number;
};

function csvFrom(arr: string[]): string {
  return arr.join(',');
}

function parseTags(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function saveNote(n: SavedNote): Promise<void> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  try {
    await db.runAsync(
    `INSERT INTO notes (
      id, conversationId, turnIndex, bookId, bookTitle, author,
      chapterNumber, chapterName, question, answer, questionType, topic, tags, createdAt, userId
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      conversationId=excluded.conversationId,
      turnIndex=excluded.turnIndex,
      bookId=excluded.bookId,
      bookTitle=excluded.bookTitle,
      author=excluded.author,
      chapterNumber=excluded.chapterNumber,
      chapterName=excluded.chapterName,
      question=excluded.question,
      answer=excluded.answer,
      questionType=excluded.questionType,
      topic=excluded.topic,
      tags=excluded.tags,
      userId=excluded.userId
    `,
    n.id,
    n.conversationId ?? null,
    n.turnIndex,
    n.bookId,
    n.bookTitle,
    n.author,
    n.chapterNumber ?? null,
    n.chapterName ?? null,
    n.question,
    n.answer,
    n.questionType ?? null,
    n.topic ?? null,
    csvFrom(n.tags),
    n.createdAt,
    userId,
  );
  } catch (e: any) {
    // Treat unique-turn conflicts as a no-op to make saves idempotent
    const msg = String(e?.message ?? e ?? '');
    if (msg.includes('UNIQUE') || msg.includes('unique') || msg.includes('constraint')) {
      // eslint-disable-next-line no-console
      console.log('[notes] duplicate turn insert ignored');
      return;
    }
    throw e;
  }
}

export async function getNotes(params?: { bookId?: string; chapterNumber?: number; q?: string }): Promise<SavedNote[]> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  const where: string[] = [];
  const args: any[] = [];
  where.push('userId = ?');
  args.push(userId);
  if (params?.bookId) { where.push('bookId = ?'); args.push(params.bookId); }
  if (params?.chapterNumber != null) { where.push('chapterNumber = ?'); args.push(params.chapterNumber); }
  if (params?.q && params.q.trim()) {
    const like = `%${params.q}%`;
    where.push('(question LIKE ? OR answer LIKE ? OR bookTitle LIKE ? OR author LIKE ? OR tags LIKE ?)');
    args.push(like, like, like, like, like);
  }
  const sql = `SELECT * FROM notes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY createdAt DESC`;
  const rows = await db.getAllAsync<any>(sql, ...args);
  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversationId ?? undefined,
    turnIndex: r.turnIndex ?? 0,
    bookId: r.bookId,
    bookTitle: r.bookTitle,
    author: r.author,
    chapterNumber: r.chapterNumber ?? undefined,
    chapterName: r.chapterName ?? undefined,
    question: r.question,
    answer: r.answer,
    questionType: r.questionType ?? undefined,
    topic: r.topic ?? undefined,
    tags: parseTags(r.tags),
    createdAt: r.createdAt,
  }));
}


