import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { MokaCelebration, MokaMood } from '../../moka.component';

const GOAL_MOODS = new Set<MokaMood>(['goal', 'mission', 'perfect-day']);

const GOAL_IMAGES: Partial<Record<MokaMood, string>> = {
  goal: 'assets/moka/moka-motiva.png',
  mission: 'assets/moka/moka-mission.png',
  'perfect-day': 'assets/moka/moka-perfeito.png',
};

export function isGoalCelebration(
  celebration: MokaCelebration | null,
): celebration is MokaCelebration {
  return celebration !== null && GOAL_MOODS.has(celebration.mood);
}

@Component({
  selector: 'app-moka-goal-celebration',
  standalone: true,
  templateUrl: './moka-goal-celebration.component.html',
  styleUrl: './moka-goal-celebration.component.scss',
})
export class MokaGoalCelebrationComponent {
  readonly celebration = input<MokaCelebration | null>(null);
  readonly dismissed = output<void>();
  readonly visible = signal(false);
  readonly image = signal(GOAL_IMAGES.goal!);

  private previousCelebration: MokaCelebration | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
    effect(() => {
      const celebration = this.celebration();
      untracked(() => {
        if (!isGoalCelebration(celebration) || celebration === this.previousCelebration) return;
        this.previousCelebration = celebration;
        this.image.set(GOAL_IMAGES[celebration.mood] ?? GOAL_IMAGES.goal!);
        this.visible.set(true);
        this.clearTimer();
        this.dismissTimer = setTimeout(() => this.dismiss(), 3600);
      });
    });
  }

  dismiss(): void {
    if (!this.visible()) return;
    this.clearTimer();
    this.visible.set(false);
    this.dismissed.emit();
  }

  private clearTimer(): void {
    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
  }
}
