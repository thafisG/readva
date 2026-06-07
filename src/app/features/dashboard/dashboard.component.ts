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

  private recommendationService = inject(RecommendationService);
  private catalogService = inject(BookCatalogService);

  public suggestions = signal<BookSuggestion[]>([]);

  public userProgress = signal<UserProgress>({
    name: 'Leitor',
    avatar: '',
    currentStreak: 0,
    dailyGoalMinutes: 60,
    dailyMinutesRead: 0,
  });

  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  pagesRead = 0;
  userComment = '';
  showProgressForm = false;
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

  loadSuggestions() {
    this.catalogService.getBooks().subscribe((catalog: any[]) => {
      this.suggestions.set(catalog.slice(0, 3));
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
    if (this.pagesRead <= 0) return;

    const minutesRead = Math.floor(this.readingElapsedSeconds() / 60);

    this.bookService.registerProgress(this.pagesRead, this.userComment, minutesRead);

    this.userProgress.update((p) => ({
      ...p,
      dailyMinutesRead: p.dailyMinutesRead + minutesRead,
    }));

    this.streakComponent?.markTodayRead();

    this.pagesRead = 0;
    this.userComment = '';
    this.showProgressForm = false;
    this.resetTimer();
  }
}
