import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ChallengesService } from '../../../dashboard/services/challenges.service';

@Component({
  selector: 'app-recent-achievements',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './recent-achievements.component.html',
  styleUrl: './recent-achievements.component.scss',
})
export class RecentAchievementsComponent {
  private readonly challenges = inject(ChallengesService);
  readonly achievements = computed(() =>
    this.challenges
      .achievements()
      .filter((item) => item.unlocked)
      .slice(0, 3),
  );
}
