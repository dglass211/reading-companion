import { getDb } from './sqlite';
import { getCurrentUser } from '../auth/auth';

export interface BookRow {
  id: string; // prefer ISBN
  title: string;
  author: string | null;
  coverUrl: string | null;
  isCurrent: number; // 0/1
}

export async function addBook(row: Omit<BookRow, 'isCurrent'>): Promise<void> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  await db.runAsync(
    'INSERT OR REPLACE INTO books (id, title, author, coverUrl, isCurrent, userId) VALUES (?, ?, ?, ?, COALESCE((SELECT isCurrent FROM books WHERE id = ?), 0), ?)',
    row.id,
    row.title,
    row.author ?? null,
    row.coverUrl ?? null,
    row.id,
    userId,
  );
}

export async function removeBook(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM books WHERE id = ?', id);
}

export async function listBooks(): Promise<BookRow[]> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  const rows = await db.getAllAsync<BookRow>('SELECT * FROM books WHERE userId = ? ORDER BY createdAt DESC', userId);
  return rows;
}

export async function getCurrentBook(): Promise<BookRow | null> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  const row = await db.getFirstAsync<BookRow>('SELECT * FROM books WHERE isCurrent = 1 AND userId = ? LIMIT 1', userId);
  return row ?? null;
}

export async function setCurrentBook(id: string | null): Promise<void> {
  const db = await getDb();
  const user = await getCurrentUser();
  const userId = user?.id ?? 'local';
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE books SET isCurrent = 0 WHERE isCurrent = 1 AND userId = ?', userId);
    if (id) {
      await db.runAsync('UPDATE books SET isCurrent = 1 WHERE id = ? AND userId = ?', id, userId);
    }
  });
}
