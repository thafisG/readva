import type { OnDestroy } from '@angular/core';
import { Component, inject, signal, ViewChild, computed, HostListener } from '@angular/core';
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
import type { UserProgress } from './interfaces/dashboard.interface';
import type { Book, BookSuggestion } from '../../core/models/book.model';
import type { ReadingActivity } from '../../core/models/activity.model';
import type { BookActionEvent } from './book-action-panel/book-action-panel.component';
import { BookActionPanelComponent } from './book-action-panel/book-action-panel.component';
import type { MokaMood } from '../moka/moka.component';
import { MokaComponent } from '../moka/moka.component';
import { DashboardPreferencesService } from './services/dashboard-preferences.service';
import { A11yModule } from '@angular/cdk/a11y';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { SocialPanelComponent } from './components/social-panel/social-panel.component';
import { SummaryCardExportService } from './services/summary-card-export.service';
import {
  StartReadingFormComponent,
  type StartReadingRequest,
} from './components/start-reading-form/start-reading-form.component';
import {
  ActivityFeedComponent,
  type FeedTab,
} from './components/activity-feed/activity-feed.component';
import {
  ActivityEditDialogComponent,
  type ActivityEditRequest,
} from './components/activity-edit-dialog/activity-edit-dialog.component';

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
    StartReadingFormComponent,
    ActivityFeedComponent,
    ActivityEditDialogComponent,
    MatIconModule,
    MokaComponent,
    RecommendationsComponent,
    SocialPanelComponent,
    A11yModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnDestroy {
  @HostListener('document:keydown.escape')
  closeActiveDialog(): void {
    if (this.deletingActivity()) this.cancelDeleteActivity();
    else if (this.editingActivity()) this.closeEditModal();
    else if (this.showSummaryModal()) this.closeSummaryModal();
  }

  @ViewChild(StreakChallengeComponent) streakComponent!: StreakChallengeComponent;

  public utilsService = inject(UtilsService);
  public bookService = inject(BookService);
  public authService = inject(AuthService);
  public userService = inject(UserService);
  private catalogService = inject(BookCatalogService);
  private recommendationService = inject(RecommendationService);
  private challengesService = inject(ChallengesService);
  private preferences = inject(DashboardPreferencesService);
  private summaryCardExport = inject(SummaryCardExportService);

  public deletingActivity = signal<ReadingActivity | null>(null);
  public editingActivity = signal<ReadingActivity | null>(null);
  public suggestions = signal<BookSuggestion[]>([]);
  public selectedBook = signal<Book | null>(null);
  public globalFeed = signal<ReadingActivity[]>([]);
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

  private mokaFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private mokaToastTimer: ReturnType<typeof setTimeout> | null = null;

  public editComment = '';
  public editDetail = '';
  public editPagesRead = 0;
  public editMinutesRead = 0;

  public manualCoffeeCount = signal(0);

  constructor() {
    this.userProgress.set(this.loadDailyProgress());
    this.loadSuggestions();

    const email = this.authService.currentUser()?.email || 'guest';
    this.userService.init(email);
    this.loadGlobalFeed();

    this.initMoka();
    this.manualCoffeeCount.set(this.preferences.getCoffeeCount());
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
    const lastLogin = this.preferences.getLastLogin();
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
    this.preferences.recordLogin();

    if (!willShowSleepy && !this.hasShownWelcomeToday()) {
      this.markWelcomeShownToday();
      setTimeout(() => this.showToast('welcome'), 900);
    }
  }

  private hasShownWelcomeToday(): boolean {
    return this.preferences.wasWelcomeShownToday();
  }

  private markWelcomeShownToday(): void {
    this.preferences.markWelcomeShown();
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

  onCoffeeChanged(count: number): void {
    void count;
  }

  onCoffeeConfirmed(count: number): void {
    const total = this.preferences.addCoffee(count);
    this.manualCoffeeCount.set(total);
    this.coffeeToast.set(false);
  }

  private loadDailyProgress(): UserProgress {
    return this.preferences.loadProgress({
      name: 'Leitor',
      avatar: '',
      currentStreak: 0,
      dailyGoalMinutes: 60,
      dailyMinutesRead: 0,
    });
  }

  private saveDailyProgress(progress: UserProgress): void {
    this.preferences.saveProgress(progress);
  }

  private maybeFireStreakAndConfetti(): void {
    if (this.preferences.isFirstPostToday()) return;
    this.preferences.markFirstPostToday();
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
    void this.summaryCardExport.export('share-card', 'meu-dia-readva.png');
  }

  selectBookForModal(book: Book): void {
    this.selectedBook.set({ ...book });
  }

  closeModal(): void {
    this.selectedBook.set(null);
  }

  handleStartBook(request: StartReadingRequest): void {
    this.bookService.startNewBook(
      request.title,
      request.author,
      request.totalPages,
      request.category,
    );

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

  private onPostProgress(event: Extract<BookActionEvent, { type: 'post-progress' }>): void {
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

  private onSaveEdit(event: Extract<BookActionEvent, { type: 'save-edit' }>): void {
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

  openEditActivityModal(activity: ReadingActivity): void {
    this.editingActivity.set(activity);
  }

  closeEditModal(): void {
    this.editingActivity.set(null);
  }

  saveEditedActivity(request: ActivityEditRequest): void {
    const { activity, comment, pagesRead, minutesRead } = request;
    const oldPages = activity.pagesRead ?? 0;
    const oldMinutes = activity.minutesRead ?? 0;
    const diffPages = pagesRead - oldPages;
    const diffMinutes = minutesRead - oldMinutes;
    const minutesLabel = minutesRead > 0 ? ` • ${minutesRead} min de leitura` : '';

    this.bookService.updateActivity(activity.id, {
      comment,
      detail: `Leu mais ${pagesRead} páginas${minutesLabel}`,
      pagesRead,
      minutesRead,
    });
    if (diffPages !== 0) this.challengesService.onPagesRead(diffPages);
    if (diffMinutes !== 0) this.challengesService.onMinutesRead(diffMinutes);

    if (diffMinutes !== 0) {
      this.userProgress.update((progress) => {
        const updated = {
          ...progress,
          dailyMinutesRead: Math.max(0, progress.dailyMinutesRead + diffMinutes),
        };
        this.saveDailyProgress(updated);
        return updated;
      });
    }

    if (this.selectedBook()?.id === activity.bookId) {
      const updated = this.bookService.myCurrentBook().find((book) => book.id === activity.bookId);
      if (updated) this.selectedBook.set({ ...updated });
    }

    this.closeEditModal();
    this.loadGlobalFeed();
    setTimeout(() => this.triggerCoffeeToast(), 400);
  }
  confirmDeleteActivity(activity: ReadingActivity): void {
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
    this.bookService.toggleActivityLike(activityId);
  }

  onFeedTabChanged(tab: FeedTab): void {
    this.activeTab.set(tab);
    if (tab === 'global') this.loadGlobalFeed();
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

  onLikeGlobalActivity(activity: ReadingActivity): void {
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
    this.catalogService.getBooks().subscribe((catalog) => {
      const activities = this.bookService.myActivities?.() ?? [];
      const currentBookTitles = this.bookService.myCurrentBook().map((b) => b.title);
      this.suggestions.set(
        this.recommendationService.recommend(
          catalog,
          activities.map((a) => ({
            category: a.bookCategory || a.category,
            completed: a.completed,
            progress: a.progress,
            totalPages: a.totalPages,
            likes: a.likes,
          })),
          currentBookTitles,
        ),
      );
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
