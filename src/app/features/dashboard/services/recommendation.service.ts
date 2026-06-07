import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  getFavoriteCategory(books: any[]): string {
    if (!books.length) return '';

    const categories: Record<string, number> = {};

    books.forEach((book) => {
      categories[book.category] = (categories[book.category] || 0) + 1;
    });

    return Object.keys(categories).reduce((a, b) => (categories[a] > categories[b] ? a : b));
  }
}
