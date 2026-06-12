import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const COVERS_CACHE_KEY = '@readva:covers-cache';

@Injectable({ providedIn: 'root' })
export class BookCatalogService {
  constructor(private http: HttpClient) {}

  getBooks(): Observable<any[]> {
    const cache = this.loadCoversCache();

    return new Observable((observer) => {
      this.http.get<any[]>('assets/books.json').subscribe((books) => {
        const withCached = books.map((book) => ({
          ...book,
          coverUrl: cache[book.id] || book.coverUrl,
        }));
        observer.next(withCached);

        const missing = books.filter((b) => !cache[b.id]);
        if (missing.length === 0) {
          observer.complete();
          return;
        }

        this.enrichMissingCovers(missing, cache).then((updatedCache) => {
          const withAll = books.map((book) => ({
            ...book,
            coverUrl: updatedCache[book.id] || book.coverUrl,
          }));
          observer.next(withAll);
          observer.complete();
        });
      });
    });
  }

  private async enrichMissingCovers(
    books: any[],
    cache: Record<string, string>,
  ): Promise<Record<string, string>> {
    const updated = { ...cache };

    const chunkSize = 5;
    for (let i = 0; i < books.length; i += chunkSize) {
      const chunk = books.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (book) => {
          const cover = await this.fetchBookCover(book.title, book.author);
          updated[book.id] = cover;
        }),
      );
    }

    this.saveCoversCache(updated);
    return updated;
  }

  private loadCoversCache(): Record<string, string> {
    try {
      const raw = localStorage.getItem(COVERS_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveCoversCache(cache: Record<string, string>): void {
    localStorage.setItem(COVERS_CACHE_KEY, JSON.stringify(cache));
  }

  async fetchBookCover(title: string, author: string): Promise<string> {
    try {
      const result = await Promise.race([
        this._fetchCoverInternal(title, author),
        new Promise<null>((res) => setTimeout(() => res(null), 8000)),
      ]);
      if (result) return result;
    } catch {}
    return this.generateCoverFallback(title, author);
  }

  private async _fetchCoverInternal(title: string, author: string): Promise<string | null> {
    let cover = await this.tryGoogleBooks(`intitle:${title} inauthor:${author}`);
    if (cover) return cover;
    cover = await this.tryGoogleBooks(`intitle:${title}`);
    if (cover) return cover;
    cover = await this.tryGoogleBooks(title);
    if (cover) return cover;
    cover = await this.tryOpenLibrary(title, author);
    return cover;
  }

  private fetchWithTimeout(url: string, ms = 4000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  private async tryGoogleBooks(query: string): Promise<string | null> {
    try {
      const q = encodeURIComponent(query);
      const res = await this.fetchWithTimeout(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3&langRestrict=pt`,
      );
      const data = await res.json();
      for (const item of data.items ?? []) {
        const links = item.volumeInfo?.imageLinks;
        const thumb = links?.extraLarge || links?.large || links?.medium || links?.thumbnail;
        if (thumb) return thumb.replace('http://', 'https://');
      }
      return null;
    } catch {
      return null;
    }
  }

  private async tryOpenLibrary(title: string, author: string): Promise<string | null> {
    try {
      const q = encodeURIComponent(`${title} ${author}`);
      const res = await this.fetchWithTimeout(
        `https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`,
      );
      const data = await res.json();
      const coverId = data.docs?.[0]?.cover_i;
      return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
    } catch {
      return null;
    }
  }

  generateCoverFallback(title: string, author: string): string {
    const PALETTES = [
      { bg: '#7C3AED', dark: '#5B21B6' },
      { bg: '#0F766E', dark: '#0D5C56' },
      { bg: '#B45309', dark: '#92400E' },
      { bg: '#BE185D', dark: '#9D174D' },
      { bg: '#1D4ED8', dark: '#1E3A8A' },
      { bg: '#0369A1', dark: '#075985' },
      { bg: '#15803D', dark: '#14532D' },
      { bg: '#7E22CE', dark: '#581C87' },
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash * 31 + title.charCodeAt(i)) & 0xffffffff;
    }
    const palette = PALETTES[Math.abs(hash) % PALETTES.length];
    const initial = (title.trim()[0] || '?').toUpperCase();
    const shortTitle = title.length > 16 ? title.slice(0, 15) + '…' : title;
    const shortAuthor = author.length > 18 ? author.slice(0, 17) + '…' : author;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" rx="6" fill="${palette.bg}"/>
  <rect y="240" width="200" height="60" fill="${palette.dark}"/>
  <text x="100" y="165" text-anchor="middle"
    font-family="Georgia,serif" font-size="72" font-weight="700"
    fill="rgba(255,255,255,0.9)">${initial}</text>
  <text x="100" y="262" text-anchor="middle"
    font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.9)"
    font-weight="500">${shortTitle}</text>
  <text x="100" y="281" text-anchor="middle"
    font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.65)">${shortAuthor}</text>
</svg>`.trim();

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}
