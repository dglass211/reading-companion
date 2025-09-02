import { create } from 'zustand';
import { Book } from '../data/db';

interface BooksState {
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;
}

export const useBooksStore = create<BooksState>((set) => ({
  currentBook: null,
  setCurrentBook: (book) => set({ currentBook: book }),
}));