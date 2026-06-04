import { Component, input } from '@angular/core';
import { UserProgress } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-streak-challenge',
  standalone: true,
  templateUrl: './streak-challenge.component.html',
  styleUrls: ['./streak-challenge.component.scss'],
})
export class StreakChallengeComponent {
  progress = input.required<UserProgress>();

  getPercentage(): number {
    const current = this.progress();
    if (!current || !current.dailyGoalMinutes) return 0;

    return Math.min((current.dailyMinutesRead / current.dailyGoalMinutes) * 100, 100);
  }
}
