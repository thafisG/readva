import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  MokaGoalCelebrationComponent,
  isGoalCelebration,
} from '../../../moka/components/moka-goal-celebration/moka-goal-celebration.component';
import type { MokaMood } from '../../../moka/moka.component';
import { MokaComponent } from '../../../moka/moka.component';
import { ChallengesService } from '../../services/challenges.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, MatIconModule, MokaComponent, MokaGoalCelebrationComponent],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.scss'],
})
export class ChallengesComponent {
  readonly challengesService = inject(ChallengesService);
  private readonly router = inject(Router);

  readonly mokaMood = signal<MokaMood>('welcome');
  readonly newMissionIds = signal<ReadonlySet<string>>(new Set());
  readonly goalCelebration = computed(() => {
    const celebration = this.challengesService.celebration();
    return isGoalCelebration(celebration) ? celebration : null;
  });
  readonly spotlightCelebration = computed(() => {
    const celebration = this.challengesService.celebration();
    return isGoalCelebration(celebration) ? null : celebration;
  });

  private mokaResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.mokaResetTimer) clearTimeout(this.mokaResetTimer);
    });

    const unseenMissionIds = this.challengesService.unseenMissionIds();
    this.newMissionIds.set(new Set(unseenMissionIds));
    if (unseenMissionIds.length > 0) {
      queueMicrotask(() => this.challengesService.markMissionUpdatesSeen());
    }

    effect(() => {
      const mood = this.challengesService.justUnlockedMood();
      if (!mood) return;
      if (this.mokaResetTimer) clearTimeout(this.mokaResetTimer);
      this.mokaMood.set(mood);
      this.mokaResetTimer = setTimeout(() => this.mokaMood.set('welcome'), 6000);
    });
  }

  isNewMission(missionId: string): boolean {
    return this.newMissionIds().has(missionId);
  }

  dismissGoalCelebration(): void {
    this.challengesService.dismissJustUnlocked();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
