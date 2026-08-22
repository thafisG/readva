import { Injectable, computed, inject } from '@angular/core';
import { buildReaderStatistics } from '../../../core/domain/profile-statistics.rules';
import { BookService } from '../../dashboard/services/book.service';
import { ReadingStreakService } from '../../dashboard/services/reading-streak.service';

@Injectable({ providedIn: 'root' })
export class ProfileStatisticsService {
  private readonly books = inject(BookService);
  private readonly streak = inject(ReadingStreakService);

  readonly statistics = computed(() =>
    buildReaderStatistics(
      this.books.myBooks(),
      this.books.myActivities(),
      this.streak.getMarkedDays(),
    ),
  );
}
