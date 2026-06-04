import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { StreakChallengeComponent } from './components/streak-challenge/streak-challenge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StreakChallengeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  public userProgress = this.dashboardService.userProgress;
  public currentBook = this.dashboardService.currentBook;
  public activities = this.dashboardService.activities;
  public weeklyStats = this.dashboardService.weeklyStats;
  public suggestions = this.dashboardService.suggestions;

  onLikeTriggered(activityId: string) {
    this.dashboardService.toggleLike(activityId);
  }
}
