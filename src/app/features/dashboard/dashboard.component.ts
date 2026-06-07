import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookService } from './services/book.service';
import { AuthService } from './services/auth.service';
import { UtilsService } from './services/utils.service';
import { RecommendationService } from './services/recommendation.service';
import { BookCatalogService } from './services/book-catalog.service';

import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';

import { Activity, BookSuggestion, UserProgress } from './interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StreakChallengeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
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

  loginEmail = '';
  loginName = '';
  showNameField = false;

  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  pagesRead = 0;
  userComment = '';

  constructor() {
    console.log('DASHBOARD CRIADO');
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.catalogService.getBooks().subscribe((catalog: any[]) => {
      this.suggestions.set(catalog.slice(0, 3));
    });
  }

  handleLogin() {
    if (!this.loginEmail.trim()) return;

    const cleanedEmail = this.loginEmail.trim().toLowerCase();

    const usersList = JSON.parse(localStorage.getItem('@readva:users_db') || '[]');

    const existingUser = usersList.find((u: any) => u.email === cleanedEmail);

    if (existingUser) {
      this.authService.authenticate(cleanedEmail, existingUser.name);
    } else if (!this.showNameField) {
      this.showNameField = true;
    } else {
      if (!this.loginName.trim()) return;

      this.authService.authenticate(cleanedEmail, this.loginName);
    }
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

    this.bookService.registerProgress(this.pagesRead, this.userComment);

    this.pagesRead = 0;
    this.userComment = '';
  }
}
