import { Injectable } from '@angular/core';
import type { ReadingPreference } from '../../../core/domain/recommendation.rules';
import { buildReaderProfile, recommendBooks } from '../../../core/domain/recommendation.rules';
import type { BookSuggestion, CatalogBook } from '../../../core/models/book.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  getReaderProfile(readings: readonly ReadingPreference[]) {
    return buildReaderProfile(readings);
  }
  recommend(
    catalog: readonly CatalogBook[],
    readings: readonly ReadingPreference[],
    excludedTitles: readonly string[],
  ): BookSuggestion[] {
    return recommendBooks(catalog, readings, excludedTitles);
  }
}
