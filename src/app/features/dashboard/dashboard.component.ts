import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from './services/dashboard.service';
import { BookService } from './services/book.service'; // Mudamos a importação para a nova pasta!
import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';
import { Activity } from './interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StreakChallengeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  public bookService = inject(BookService);

  public userProgress = this.dashboardService.userProgress;
  public suggestions = this.dashboardService.suggestions;

  newTitle = '';
  newAuthor = '';
  newTotalPages = 100;
  newCategory = 'Literatura';

  pagesRead = 0;
  userComment = '';

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
    if (!this.newTitle || !this.newAuthor) return;
    this.bookService.startNewBook(
      this.newTitle,
      this.newAuthor,
      this.newTotalPages,
      this.newCategory,
    );
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
