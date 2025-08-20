import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('readingcompanion.db');
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      coverUrl TEXT,
      isCurrent INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_books_iscurrent ON books(isCurrent);
    `);

  // Migration: upgrade notes table to Q&A schema if needed
  try {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(notes)`);
    const hasQaSchema = cols.some((c) => c.name === 'question') && cols.some((c) => c.name === 'answer');

    if (!cols.length) {
      // No notes table → create with new schema
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          conversationId TEXT,
          turnIndex INTEGER,
          bookId TEXT NOT NULL,
          bookTitle TEXT NOT NULL,
          author TEXT NOT NULL,
          chapterNumber INTEGER,
          chapterName TEXT,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          questionType TEXT,
          topic TEXT,
          tags TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(bookId, chapterNumber);
        CREATE INDEX IF NOT EXISTS idx_notes_conv ON notes(conversationId, turnIndex);
      `);
    } else if (!hasQaSchema) {
      // Existing legacy notes → migrate content into new schema
      await db.execAsync('BEGIN');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes__new (
          id TEXT PRIMARY KEY,
          conversationId TEXT,
          turnIndex INTEGER,
          bookId TEXT,
          bookTitle TEXT NOT NULL,
          author TEXT NOT NULL,
          chapterNumber INTEGER,
          chapterName TEXT,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          questionType TEXT,
          topic TEXT,
          tags TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        );
      `);
      // Best-effort copy from legacy columns when present
      try {
        await db.execAsync(`
          INSERT INTO notes__new (id, bookTitle, author, chapterNumber, question, answer, tags, createdAt)
          SELECT id,
                 COALESCE(bookTitle, ''),
                 COALESCE(author, ''),
                 COALESCE(chapterNumber, NULL),
                 title,
                 body,
                 COALESCE(tags, ''),
                 COALESCE(createdAt, strftime('%s','now'))
          FROM notes;
        `);
      } catch {}
      await db.execAsync('DROP TABLE IF EXISTS notes');
      await db.execAsync('ALTER TABLE notes__new RENAME TO notes');
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(bookId, chapterNumber);
        CREATE INDEX IF NOT EXISTS idx_notes_conv ON notes(conversationId, turnIndex);
      `);
      await db.execAsync('COMMIT');
    } else {
      // Ensure indexes exist on QA schema
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(bookId, chapterNumber);
        CREATE INDEX IF NOT EXISTS idx_notes_conv ON notes(conversationId, turnIndex);
      `);
    }
    // Unique index to prevent duplicate inserts for the same conversation turn
    try {
      await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_notes_turn ON notes(conversationId, turnIndex);`);
    } catch (e) {
      // If duplicates exist from old data, ignore index creation failure for now
      console.warn('[sqlite] uniq index create skipped:', e);
    }
  } catch (e) {
    console.warn('[sqlite] notes schema migration skipped/failed:', e);
  }
}
