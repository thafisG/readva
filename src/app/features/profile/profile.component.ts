import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { MokaComponent, type MokaMood } from '../moka/moka.component';
import { AuthService } from '../dashboard/services/auth.service';
import { AvatarBuilderComponent } from './components/avatar-builder/avatar-builder.component';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown.component';
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { ReadingGoalsComponent } from './components/reading-goals/reading-goals.component';
import { RecentAchievementsComponent } from './components/recent-achievements/recent-achievements.component';
import { StatsOverviewComponent } from './components/stats-overview/stats-overview.component';
import { WeeklyReadingChartComponent } from './components/weekly-reading-chart/weekly-reading-chart.component';
import { ProfileGoalsService } from './services/profile-goals.service';
import { ProfileStatisticsService } from './services/profile-statistics.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileHeaderComponent,
    StatsOverviewComponent,
    WeeklyReadingChartComponent,
    ReadingGoalsComponent,
    CategoryBreakdownComponent,
    RecentAchievementsComponent,
    AvatarBuilderComponent,
    MokaComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [ProfileGoalsService],
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  readonly profileStatistics = inject(ProfileStatisticsService);
  readonly avatarBuilderOpen = signal(false);
  readonly mokaMood = computed<MokaMood>(() => {
    const statistics = this.profileStatistics.statistics();
    if (statistics.currentStreak >= 7) return 'streak';
    if (statistics.completedBooks > 0) return 'love';
    return 'welcome';
  });

  @HostListener('document:keydown.escape')
  closeAvatarBuilder(): void {
    this.avatarBuilderOpen.set(false);
  }

  saveAvatar(avatar: string): void {
    if (this.auth.updateAvatar(avatar)) this.avatarBuilderOpen.set(false);
  }
}
