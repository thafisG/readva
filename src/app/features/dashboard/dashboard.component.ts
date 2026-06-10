import { Component, inject, signal, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BookService } from './services/book.service';
import { AuthService } from './services/auth.service';
import { UtilsService } from './services/utils.service';
import { RecommendationService } from './services/recommendation.service';
import { BookCatalogService } from './services/book-catalog.service';

import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';
import { LoginComponent } from '../login/login.component';

import { Activity, BookSuggestion, UserProgress } from './interfaces/dashboard.interface';
import { BOOK_CATEGORIES } from '../../constants/book-categories';
import {
  BookActionEvent,
  BookActionPanelComponent,
} from './book-action-panel/book-action-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StreakChallengeComponent,
    LoginComponent,
    BookActionPanelComponent,
    RouterLink,
    RouterLinkActive,
  ],
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

  public deletingActivity = signal<Activity | null>(null);
  public editingActivity = signal<Activity | null>(null);
  public suggestions = signal<BookSuggestion[]>([]);
  public selectedBook = signal<any | null>(null);
  public userProgress = signal<UserProgress>({
    name: 'Leitor',
    avatar: '',
    currentStreak: 0,
    dailyGoalMinutes: 60,
    dailyMinutesRead: 0,
  });

  public editComment = '';
  public editDetail = '';
  public editPagesRead = 0;
  public editMinutesRead = 0;

  categories = BOOK_CATEGORIES;
  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  constructor() {
    this.userProgress.set(this.loadDailyProgress());
    this.loadSuggestions();
  }

  ngOnDestroy() {}

  private get PROGRESS_KEY() {
    return `@readva:daily-progress:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private get FIRST_POST_KEY() {
    return `@readva:first-post-date:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private loadDailyProgress(): UserProgress {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(this.PROGRESS_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        return {
          name: 'Leitor',
          avatar: '',
          currentStreak: parsed.currentStreak ?? 0,
          dailyGoalMinutes: parsed.dailyGoalMinutes ?? 60,
          dailyMinutesRead: parsed.dailyMinutesRead ?? 0,
        };
      }
    }

    return {
      name: 'Leitor',
      avatar: '',
      currentStreak: 0,
      dailyGoalMinutes: 60,
      dailyMinutesRead: 0,
    };
  }

  private saveDailyProgress(progress: UserProgress): void {
    const today = new Date().toDateString();
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify({ ...progress, date: today }));
  }

  private maybeFireStreakAndConfetti(): void {
    const today = new Date().toDateString();
    const lastPostDate = localStorage.getItem(this.FIRST_POST_KEY);

    if (lastPostDate === today) return;

    localStorage.setItem(this.FIRST_POST_KEY, today);
    this.streakComponent?.markTodayRead();
  }

  selectBookForModal(book: any): void {
    this.selectedBook.set({ ...book });
  }

  closeModal(): void {
    this.selectedBook.set(null);
  }

  handleStartBook(): void {
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

  handlePanelAction(event: BookActionEvent): void {
    switch (event.type) {
      case 'post-progress':
        this.onPostProgress(event);
        break;
      case 'save-edit':
        this.onSaveEdit(event);
        break;
      case 'move-to-library':
        this.onMoveToLibrary(event);
        break;
      case 'mark-completed':
        this.onMarkCompleted(event);
        break;
      case 'delete':
        this.onDeleteBook(event);
        break;
    }
  }

  private onPostProgress(event: BookActionEvent): void {
    const { pages, comment, minutesRead } = event.payload;
    this.bookService.registerProgress(event.bookId, pages, comment, minutesRead);

    this.userProgress.update((p) => {
      const updated = { ...p, dailyMinutesRead: p.dailyMinutesRead + minutesRead };
      this.saveDailyProgress(updated);
      return updated;
    });

    this.maybeFireStreakAndConfetti();

    const updated = this.bookService.myCurrentBook().find((b) => b.id === event.bookId);
    if (updated) this.selectedBook.set({ ...updated });
  }

  private onSaveEdit(event: BookActionEvent): void {
    this.bookService.updateBook(event.bookId, event.payload);
    const updated = this.bookService.myCurrentBook().find((b) => b.id === event.bookId);
    if (updated) this.selectedBook.set({ ...updated });
    this.loadSuggestions();
  }

  private onMoveToLibrary(event: BookActionEvent): void {
    this.bookService.moveToLibrary(event.bookId);
    this.closeModal();
    this.loadSuggestions();
  }

  private onMarkCompleted(event: BookActionEvent): void {
    this.bookService.markCompleted(event.bookId);
    this.closeModal();
    this.loadSuggestions();
  }

  private onDeleteBook(event: BookActionEvent): void {
    this.bookService.deleteBook(event.bookId);
    this.closeModal();
    this.loadSuggestions();
  }

  openEditActivityModal(activity: Activity): void {
    this.editingActivity.set(activity);
    this.editComment = activity.comment || '';
    this.editPagesRead = activity.pagesRead ?? 0;
    this.editMinutesRead = activity.minutesRead ?? 0;
    this.editDetail = activity.detail;
  }

  closeEditModal(): void {
    this.editingActivity.set(null);
    this.editComment = '';
    this.editDetail = '';
    this.editPagesRead = 0;
    this.editMinutesRead = 0;
  }

  saveEditedActivity(): void {
    const activity = this.editingActivity();
    if (!activity) return;

    const oldMinutes: number = activity['minutesRead'] ?? 0;
    const diffMinutes = this.editMinutesRead - oldMinutes;

    const minutesLabel =
      this.editMinutesRead > 0 ? ` • ${this.editMinutesRead} min de leitura` : '';
    const newDetail = `Leu mais ${this.editPagesRead} páginas${minutesLabel}`;

    this.bookService.updateActivity(activity.id, {
      comment: this.editComment,
      detail: newDetail,
      pagesRead: this.editPagesRead,
      minutesRead: this.editMinutesRead,
    });

    if (diffMinutes !== 0) {
      this.userProgress.update((p) => {
        const updated = {
          ...p,
          dailyMinutesRead: Math.max(0, p.dailyMinutesRead + diffMinutes),
        };
        this.saveDailyProgress(updated);
        return updated;
      });
    }

    if (this.selectedBook()?.id === activity['bookId']) {
      const updated = this.bookService.myCurrentBook().find((b) => b.id === activity['bookId']);
      if (updated) this.selectedBook.set({ ...updated });
    }

    this.closeEditModal();
  }

  confirmDeleteActivity(activity: Activity): void {
    this.deletingActivity.set(activity);
  }

  executeDeleteActivity(): void {
    const activity = this.deletingActivity();
    if (!activity) return;
    this.bookService.deleteActivity(activity.id);
    this.deletingActivity.set(null);
  }

  cancelDeleteActivity(): void {
    this.deletingActivity.set(null);
  }

  onLikeTriggered(activityId: string): void {
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
    localStorage.setItem(
      `@readva:activities:${this.authService.currentUser()?.email || 'guest'}`,
      JSON.stringify(this.bookService.myActivities()),
    );
  }

  handleLogout(): void {
    this.authService.logout();
  }

  loadSuggestions(): void {
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

      if (!hasHistory) orderedCategories = orderedCategories.sort(() => Math.random() - 0.5);

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
}
