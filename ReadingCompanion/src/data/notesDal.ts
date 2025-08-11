import { getDb } from './sqlite';

export interface NoteRow {
  id: string; // uuid
  title: string; // first italic line (question/title)
  body: string;
  bookTitle: string | null;
  author: string | null;
  chapterNumber: number | null;
  tags: string; // comma-separated
  createdAt: number;
  updatedAt: number;
}

export async function initNotes() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      bookTitle TEXT,
      author TEXT,
      chapterNumber INTEGER,
      tags TEXT DEFAULT '',
      createdAt INTEGER DEFAULT (strftime('%s','now')),
      updatedAt INTEGER DEFAULT (strftime('%s','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notes_search ON notes(title, body, tags);
    `);
}

export async function upsertNote(n: Omit<NoteRow, 'createdAt'|'updatedAt'>) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes(id,title,body,bookTitle,author,chapterNumber,tags)
     VALUES(?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       body=excluded.body,
       bookTitle=excluded.bookTitle,
       author=excluded.author,
       chapterNumber=excluded.chapterNumber,
       tags=excluded.tags,
       updatedAt=(strftime('%s','now'))
    `,
    n.id, n.title, n.body, n.bookTitle, n.author, n.chapterNumber, n.tags,
  );
}

export async function listNotes(params: { q?: string; book?: string | null; chapter?: number | null } = {}) {
  const db = await getDb();
  const { q, book, chapter } = params;
  const where: string[] = [];
  const args: any[] = [];
  if (q && q.trim()) {
    where.push('(title LIKE ? OR body LIKE ? OR tags LIKE ?)');
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  if (book) { where.push('bookTitle = ?'); args.push(book); }
  if (chapter != null) { where.push('chapterNumber = ?'); args.push(chapter); }
  const sql = `SELECT * FROM notes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updatedAt DESC`;
  return db.getAllAsync<NoteRow>(sql, ...args);
}

export async function getNote(id: string) {
  const db = await getDb();
  return db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
}

export async function deleteNote(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}


