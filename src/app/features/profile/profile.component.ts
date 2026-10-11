import { Component, HostListener, computed, inject, signal } from '@angular/core';
import type { AvatarConfig } from '../../core/models/avatar.model';
import { AuthService } from '../dashboard/services/auth.service';
import { MokaComponent, type MokaMood } from '../moka/moka.component';
import { AvatarBuilderComponent } from './components/avatar-builder/avatar-builder.component';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown.component';
import {
  ProfileIdentityEditorComponent,
  type ProfileIdentityChanges,
} from './components/profile-identity-editor/profile-identity-editor.component';
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
    ProfileIdentityEditorComponent,
    MokaComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  providers: [ProfileGoalsService],
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly profileStatistics = inject(ProfileStatisticsService);
  readonly avatarBuilderOpen = signal(false);
  readonly identityEditorOpen = signal(false);
  readonly profileError = signal('');
  readonly mokaMood = computed<MokaMood>(() => {
    const statistics = this.profileStatistics.statistics();
    if (statistics.currentStreak >= 7) return 'streak';
    if (statistics.completedBooks > 0) return 'love';
    return 'welcome';
  });

  @HostListener('document:keydown.escape')
  closeEditors(): void {
    this.avatarBuilderOpen.set(false);
    this.identityEditorOpen.set(false);
    this.profileError.set('');
  }

  async saveAvatar(config: AvatarConfig): Promise<void> {
    this.profileError.set('');
    if (await this.auth.updateAvatar(config)) {
      this.avatarBuilderOpen.set(false);
      return;
    }
    this.profileError.set('Não foi possível salvar o avatar. Verifique se o backend está ativo.');
  }

  async saveIdentity(changes: ProfileIdentityChanges): Promise<void> {
    this.profileError.set('');
    if (await this.auth.updateProfile(changes.displayName, changes.bio)) {
      this.identityEditorOpen.set(false);
      return;
    }
    this.profileError.set('Não foi possível salvar o perfil. Tente novamente.');
  }
}
