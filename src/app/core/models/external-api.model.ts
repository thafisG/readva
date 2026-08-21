export interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  cover_i?: number;
}

export interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[];
  numFound?: number;
}

export interface GoogleBooksResponse {
  items?: Array<{ volumeInfo?: { imageLinks?: Record<string, string> } }>;
}
