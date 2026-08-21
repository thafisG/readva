export type BookStatus = 'want-to-read' | 'reading' | 'paused' | 'abandoned' | 'completed';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  currentPage: number;
  category: string;
  status?: BookStatus;
  createdAt?: string;
  completedAt?: string;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  totalPages: number;
  minutesRead: number;
  updatedAt: string;
}

export interface BookSearchResult {
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string;
  category: string;
}

export interface BookSuggestion {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  category?: string;
  matchPercentage?: number;
  explanation?: string;
}

export interface CatalogBook extends Omit<BookSuggestion, 'category'> {
  category: string;
  tags: string[];
  difficulty: string;
  readingLevel: string;
}
