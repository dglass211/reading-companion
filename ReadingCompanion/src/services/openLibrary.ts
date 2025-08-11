import axios from 'axios';

export interface OpenLibDoc {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
}

export interface BookSearchResult {
  id: string; // ISBN if available else key
  title: string;
  author: string | null;
  coverUrl: string | null;
}

function firstIsbn(isbns?: string[]): string | null {
  if (!isbns || isbns.length === 0) return null;
  // prefer ISBN-13
  const isbn13 = isbns.find((s) => /^\d{13}$/.test(s));
  if (isbn13) return isbn13;
  const isbn10 = isbns.find((s) => /^\d{10}$/.test(s));
  return isbn10 ?? isbns[0];
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=25`;
  const { data } = await axios.get(url, { timeout: 10000 });
  const docs: OpenLibDoc[] = data.docs ?? [];
  return docs.map((d) => {
    const isbn = firstIsbn(d.isbn);
    const id = isbn ?? d.key;
    const coverUrl = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`
      : d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg?default=false`
      : null;
    return {
      id,
      title: d.title,
      author: d.author_name?.[0] ?? null,
      coverUrl,
    } as BookSearchResult;
  });
}
