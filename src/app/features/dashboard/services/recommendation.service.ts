import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  getReaderProfile(books: any[]): {
    favoriteCategory: string;
    categoryScore: Record<string, number>;
  } {
    if (!books.length) {
      return { favoriteCategory: '', categoryScore: {} };
    }

    const categories: Record<string, number> = {};

    books.forEach((book) => {
      const cat = book.category;
      if (!categories[cat]) categories[cat] = 0;

      categories[cat] += 1;
      if (book.completed) categories[cat] += 2;
      if (book.progress && book.totalPages) {
        categories[cat] += (book.progress / book.totalPages) * 2;
      }
      if (book.likes) categories[cat] += book.likes * 0.1;
    });

    const favoriteCategory = Object.keys(categories).reduce((a, b) =>
      categories[a] > categories[b] ? a : b,
    );

    const maxScore = Math.max(...Object.values(categories));
    const normalizedScore = Object.fromEntries(
      Object.entries(categories).map(([cat, score]) => [cat, score / maxScore]),
    );

    return {
      favoriteCategory,
      categoryScore: normalizedScore,
    };
  }
}
