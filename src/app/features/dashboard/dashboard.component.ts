import { Component, inject, signal, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookService } from './services/book.service';
import { AuthService } from './services/auth.service';
import { UtilsService } from './services/utils.service';
import { RecommendationService } from './services/recommendation.service';
import { BookCatalogService } from './services/book-catalog.service';

import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';
import { LoginComponent } from '../login/login.component';

import { Activity, BookSuggestion, UserProgress } from './interfaces/dashboard.interface';
import { BOOK_CATEGORIES } from '../../constants/book-categories';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StreakChallengeComponent, LoginComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnDestroy {
  @ViewChild(StreakChallengeComponent) streakComponent!: StreakChallengeComponent;

  public utilsService = inject(UtilsService);
  public bookService = inject(BookService);
  public authService = inject(AuthService);
  private catalogService = inject(BookCatalogService);
  private recommendationService = inject(RecommendationService);

  public suggestions = signal<BookSuggestion[]>([]);

  public userProgress = signal<UserProgress>({
    name: 'Leitor',
    avatar: '',
    currentStreak: 0,
    dailyGoalMinutes: 60,
    dailyMinutesRead: 0,
  });

  categories = BOOK_CATEGORIES;

  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  pagesRead = 0;
  userComment = '';
  showProgressForm = false;
  selectedBook = signal<any | null>(null);
  readingStartTime: number | null = null;
  readingElapsedSeconds = signal(0);
  timerInterval: any = null;
  isReading = false;

  constructor() {
    console.log('DASHBOARD CRIADO');
    this.loadSuggestions();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  toggleReadingTimer() {
    if (!this.isReading) {
      this.isReading = true;
      this.readingStartTime = Date.now() - this.readingElapsedSeconds() * 1000;
      this.timerInterval = setInterval(() => {
        this.readingElapsedSeconds.set(Math.floor((Date.now() - this.readingStartTime!) / 1000));
      }, 1000);
    } else {
      this.isReading = false;
      clearInterval(this.timerInterval);
    }
  }

  resetTimer() {
    this.isReading = false;
    clearInterval(this.timerInterval);
    this.readingElapsedSeconds.set(0);
    this.readingStartTime = null;
  }

  get formattedTime(): string {
    const m = Math.floor(this.readingElapsedSeconds() / 60)
      .toString()
      .padStart(2, '0');
    const s = (this.readingElapsedSeconds() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  selectBookForProgress(book: any) {
    if (this.selectedBook()?.id === book.id && this.showProgressForm) {
      this.closeProgressForm();
      return;
    }

    this.selectedBook.set(book);
    this.showProgressForm = true;
    this.resetTimer();
    this.pagesRead = 0;
    this.userComment = '';
  }

  closeProgressForm() {
    this.showProgressForm = false;
    this.selectedBook.set(null);
    this.resetTimer();
  }

  loadSuggestions() {
    this.catalogService.getBooks().subscribe((catalog: any[]) => {
      const activities = this.bookService.myActivities?.() ?? [];
      const hasHistory = activities.length > 0;
      const currentBookTitles = this.bookService.myCurrentBook().map((b) => b.title);

      const profile = this.recommendationService.getReaderProfile(
        activities.map((a) => ({
          category: a.bookCategory || a.category,
          completed: a.completed,
          progress: a.progress,
          totalPages: a.totalPages,
          likes: a.likes,
        })),
      );

      const byCategory = catalog.reduce((acc: Record<string, any[]>, book) => {
        if (currentBookTitles.includes(book.title)) return acc;
        (acc[book.category] ??= []).push(book);
        return acc;
      }, {});

      let orderedCategories = Object.keys(byCategory).sort((a, b) => {
        const sa = profile.categoryScore[a] ?? 0;
        const sb = profile.categoryScore[b] ?? 0;
        return sb - sa;
      });

      if (!hasHistory) {
        orderedCategories = orderedCategories.sort(() => Math.random() - 0.5);
      }

      const recommendations: any[] = [];
      for (const cat of orderedCategories) {
        if (recommendations.length >= 3) break;

        const pick = byCategory[cat][Math.floor(Math.random() * byCategory[cat].length)];
        const score = profile.categoryScore[cat] ?? 0;

        recommendations.push({
          ...pick,
          score,
          matchPercentage: hasHistory ? Math.round(score * 100) : 0,
        });
      }

      this.suggestions.set(recommendations);
    });
  }

  handleLogout() {
    this.authService.logout();
  }

  onLikeTriggered(activityId: string) {
    this.bookService.myActivities.update((items: Activity[]) =>
      items.map((item: Activity) =>
        item.id === activityId
          ? {
              ...item,
              hasLiked: !item.hasLiked,
              likes: item.hasLiked ? item.likes - 1 : item.likes + 1,
            }
          : item,
      ),
    );
  }

  handleStartBook() {
    if (!this.newTitle.trim() || !this.newAuthor.trim()) return;

    this.bookService.startNewBook(
      this.newTitle,
      this.newAuthor,
      this.newTotalPages,
      this.newCategory,
    );

    this.loadSuggestions();

    this.newTitle = '';
    this.newAuthor = '';
  }

  handlePostProgress() {
    const book = this.selectedBook();
    if (!book) return;

    const pages = Number(this.pagesRead);
    if (isNaN(pages) || pages <= 0) return;

    const minutesRead = Math.floor((this.readingElapsedSeconds() || 0) / 60);

    this.bookService.registerProgress(book.id, pages, this.userComment, minutesRead);

    this.userProgress.update((p) => ({
      ...p,
      dailyMinutesRead: p.dailyMinutesRead + minutesRead,
    }));

    this.streakComponent?.markTodayRead();

    this.pagesRead = 0;
    this.userComment = '';
    this.showProgressForm = false;
    this.selectedBook.set(null);
    this.resetTimer();
  }
}
