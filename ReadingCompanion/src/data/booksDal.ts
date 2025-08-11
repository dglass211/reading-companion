import { getDb } from './sqlite';

export interface BookRow {
  id: string; // prefer ISBN
  title: string;
  author: string | null;
  coverUrl: string | null;
  isCurrent: number; // 0/1
}

export async function addBook(row: Omit<BookRow, 'isCurrent'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO books (id, title, author, coverUrl, isCurrent) VALUES (?, ?, ?, ?, COALESCE((SELECT isCurrent FROM books WHERE id = ?), 0))',
    row.id,
    row.title,
    row.author ?? null,
    row.coverUrl ?? null,
    row.id,
  );
}

export async function removeBook(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM books WHERE id = ?', id);
}

export async function listBooks(): Promise<BookRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookRow>('SELECT * FROM books ORDER BY createdAt DESC');
  return rows;
}

export async function getCurrentBook(): Promise<BookRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BookRow>('SELECT * FROM books WHERE isCurrent = 1 LIMIT 1');
  return row ?? null;
}

export async function setCurrentBook(id: string | null): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE books SET isCurrent = 0 WHERE isCurrent = 1');
    if (id) {
      await db.runAsync('UPDATE books SET isCurrent = 1 WHERE id = ?', id);
    }
  });
}
