import { Component, inject, signal, OnDestroy, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookService } from './services/book.service';
import { AuthService } from './services/auth.service';
import { UtilsService } from './services/utils.service';
import { RecommendationService } from './services/recommendation.service';
import { BookCatalogService } from './services/book-catalog.service';
import { UserService } from './services/user.service';
import { ChallengesService } from './services/challenges.service';
import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';
import { LoginComponent } from '../login/login.component';
import { Activity, BookSuggestion, UserProgress } from './interfaces/dashboard.interface';
import { BOOK_CATEGORIES } from '../../constants/book-categories';
import {
  BookActionEvent,
  BookActionPanelComponent,
} from './book-action-panel/book-action-panel.component';
import {
  BookSearchComponent,
  BookSearchResult,
} from './components/book-search/book-search.component';
import { MokaComponent, MokaMood } from '../moka/moka.component';

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
    BookSearchComponent,
    MatIconModule,
    MokaComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnDestroy {
  @ViewChild(StreakChallengeComponent) streakComponent!: StreakChallengeComponent;

  public utilsService = inject(UtilsService);
  public bookService = inject(BookService);
  public authService = inject(AuthService);
  public userService = inject(UserService);
  private catalogService = inject(BookCatalogService);
  private recommendationService = inject(RecommendationService);
  private challengesService = inject(ChallengesService);

  public deletingActivity = signal<Activity | null>(null);
  public editingActivity = signal<Activity | null>(null);
  public suggestions = signal<BookSuggestion[]>([]);
  public selectedBook = signal<any | null>(null);
  public globalFeed = signal<any[]>([]);
  public activeTab = signal<'meu-feed' | 'global'>('meu-feed');
  public showSummaryModal = signal(false);
  public userProgress = signal<UserProgress>({
    name: 'Leitor',
    avatar: '',
    currentStreak: 0,
    dailyGoalMinutes: 60,
    dailyMinutesRead: 0,
  });

  public mokaFeedback = signal<MokaMood | null>(null);
  public mokaToast = signal<MokaMood | null>(null);
  private coffeeToast = signal(false);

  private mokaFeedbackTimer: any = null;
  private mokaToastTimer: any = null;

  public editComment = '';
  public editDetail = '';
  public editPagesRead = 0;
  public editMinutesRead = 0;

  categories = BOOK_CATEGORIES;
  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  private get WELCOME_MOKA_KEY() {
    return `@readva:moka-welcome:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private get LAST_LOGIN_KEY() {
    return `@readva:last-login:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private get PROGRESS_KEY() {
    return `@readva:daily-progress:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private get FIRST_POST_KEY() {
    return `@readva:first-post-date:${this.authService.currentUser()?.email || 'guest'}`;
  }

  private get COFFEE_KEY() {
    return `@readva:coffee:${new Date().toDateString()}:${this.authService.currentUser()?.email || 'guest'}`;
  }

  public manualCoffeeCount = signal(0);

  constructor() {
    this.userProgress.set(this.loadDailyProgress());
    this.loadSuggestions();

    const email = this.authService.currentUser()?.email || 'guest';
    this.userService.init(email);
    this.loadGlobalFeed();

    this.initMoka();
    const savedCoffee = Number(localStorage.getItem(this.COFFEE_KEY) || '0');
    this.manualCoffeeCount.set(savedCoffee);
  }

  ngOnDestroy() {
    if (this.mokaFeedbackTimer) clearTimeout(this.mokaFeedbackTimer);
    if (this.mokaToastTimer) clearTimeout(this.mokaToastTimer);
  }

  /**
   * Welcome e sleepy agora são disparados como toasts explícitos e
   * temporizados (igual completed-book, mission etc), e não mais como
   * fallback do currentMokaMood(). Isso evita que eles "roubem" a cena
   * de outro mood ativo (ex: o balão do café) quando esse mood termina.
   * Só um dos dois dispara por sessão pra não colidir.
   */
  private initMoka(): void {
    const lastLogin = localStorage.getItem(this.LAST_LOGIN_KEY);
    let willShowSleepy = false;

    if (lastLogin) {
      const diff = Math.floor(
        (new Date().getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff >= 3) {
        willShowSleepy = true;
        setTimeout(() => this.showToast('sleepy'), 1500);
      }
    }
    localStorage.setItem(this.LAST_LOGIN_KEY, new Date().toISOString());

    if (!willShowSleepy && !this.hasShownWelcomeToday()) {
      this.markWelcomeShownToday();
      setTimeout(() => this.showToast('welcome'), 900);
    }
  }

  private hasShownWelcomeToday(): boolean {
    return localStorage.getItem(this.WELCOME_MOKA_KEY) === new Date().toDateString();
  }

  private markWelcomeShownToday(): void {
    localStorage.setItem(this.WELCOME_MOKA_KEY, new Date().toDateString());
  }

  showToast(mood: MokaMood): void {
    if (this.mokaToastTimer) clearTimeout(this.mokaToastTimer);
    this.mokaToast.set(mood);
    this.mokaToastTimer = setTimeout(() => this.mokaToast.set(null), 5000);
  }

  dismissToast(): void {
    if (this.mokaToastTimer) clearTimeout(this.mokaToastTimer);
    this.mokaToast.set(null);
  }

  private showFeedback(mood: MokaMood): void {
    if (this.mokaFeedbackTimer) clearTimeout(this.mokaFeedbackTimer);
    this.mokaFeedback.set(mood);
    this.mokaFeedbackTimer = setTimeout(() => this.mokaFeedback.set(null), 5000);
  }

  private triggerCoffeeToast(): void {
    this.coffeeToast.set(true);
  }

  get showStreakMoka(): boolean {
    const streak = this.userProgress().currentStreak;
    return streak > 0 && streak % 7 === 0;
  }

  onCoffeeChanged(count: number): void {}

  onCoffeeConfirmed(count: number): void {
    const saved = Number(localStorage.getItem(this.COFFEE_KEY) || '0');
    const total = saved + count;
    localStorage.setItem(this.COFFEE_KEY, String(total));
    this.manualCoffeeCount.set(total);
    this.coffeeToast.set(false);
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

    const streak = this.streakComponent?.streakCount() ?? this.userProgress().currentStreak;
    this.challengesService.onStreakDay(streak);
  }

  openSummaryModal(): void {
    this.showSummaryModal.set(true);
  }

  closeSummaryModal(): void {
    this.showSummaryModal.set(false);
  }

  todayLabel(): string {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  streakDays(): number {
    return this.streakComponent?.streakCount() ?? this.userProgress().currentStreak;
  }

  progressPercentage(): number {
    const p = this.userProgress();
    if (!p.dailyGoalMinutes) return 0;
    return Math.min((p.dailyMinutesRead / p.dailyGoalMinutes) * 100, 100);
  }

  exportSummaryCard(): void {
    import('html2canvas').then(({ default: html2canvas }) => {
      const el = document.getElementById('share-card');
      if (!el) return;
      html2canvas(el, { backgroundColor: '#fdf8f4', scale: 2 }).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'meu-dia-readva.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  }

  onBookSelected(book: BookSearchResult): void {
    this.newTitle = book.title;
    this.newAuthor = book.author;
    this.newTotalPages = book.totalPages || 100;
    this.newCategory = book.category;
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

    this.newTitle = '';
    this.newAuthor = '';
    this.loadGlobalFeed();
    setTimeout(() => this.loadSuggestions(), 0);
    setTimeout(() => this.triggerCoffeeToast(), 600);
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
    this.loadGlobalFeed();

    const updated = this.bookService.myCurrentBook().find((b) => b.id === event.bookId);
    if (updated) this.selectedBook.set({ ...updated });

    setTimeout(() => this.triggerCoffeeToast(), 800);
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
    this.showFeedback('completed-book');
    setTimeout(() => this.showToast('completed-book'), 100);
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

    const oldPages: number = activity['pagesRead'] ?? 0;
    const oldMinutes: number = activity['minutesRead'] ?? 0;
    const diffPages = this.editPagesRead - oldPages;
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
    if (diffPages !== 0) {
      this.challengesService.onPagesRead(diffPages);
    }
    if (diffMinutes !== 0) {
      this.challengesService.onMinutesRead(diffMinutes);
    }

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
    this.loadGlobalFeed();
    setTimeout(() => this.triggerCoffeeToast(), 400);
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

  loadGlobalFeed(): void {
    this.globalFeed.set(this.userService.getFollowingActivities());
  }

  followUser(email: string): void {
    this.userService.follow(email);
    this.loadGlobalFeed();
  }

  unfollowUser(email: string): void {
    this.userService.unfollow(email);
    this.loadGlobalFeed();
  }

  toggleFollow(userId: string): void {
    if (this.userService.isFollowing(userId)) {
      this.userService.unfollow(userId);
    } else {
      this.userService.follow(userId);
    }
    this.loadGlobalFeed();
  }

  getUserName(email: string): string {
    return this.userService.getUserName(email);
  }

  onLikeGlobalActivity(activity: any): void {
    this.globalFeed.update((items) =>
      items.map((item) =>
        item.id === activity.id
          ? {
              ...item,
              hasLiked: !item.hasLiked,
              likes: item.hasLiked ? item.likes - 1 : item.likes + 1,
            }
          : item,
      ),
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

  currentMokaMood = computed<MokaMood | null>(() => {
    if (this.mokaToast()) return this.mokaToast()!;
    if (this.mokaFeedback()) return this.mokaFeedback()!;
    if (this.coffeeToast()) return 'coffee';

    if (this.progressPercentage() >= 100) return 'goal';
    if (this.bookService.myCurrentBook().length === 0) return 'empty-library';
    if (this.activeTab() === 'global' && this.userService.following().length === 0) return 'love';
    if (this.activeTab() === 'meu-feed' && this.bookService.myActivities().length === 0)
      return 'empty-library';

    return null;
  });
}
