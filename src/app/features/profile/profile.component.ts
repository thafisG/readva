import { Component, inject } from '@angular/core';
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
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [ProfileGoalsService],
})
export class ProfileComponent {
  readonly profileStatistics = inject(ProfileStatisticsService);
}
