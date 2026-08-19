import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChallengesService } from '../../services/challenges.service';
import type { MokaMood } from '../../../moka/moka.component';
import { MokaComponent } from '../../../moka/moka.component';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, MatIconModule, MokaComponent],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.scss'],
})
export class ChallengesComponent {
  readonly challengesService = inject(ChallengesService);
  private readonly router = inject(Router);

  mokaMood = signal<MokaMood>('welcome');

  private mokaResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const mood = this.challengesService.justUnlockedMood();
      if (mood) {
        if (this.mokaResetTimer) clearTimeout(this.mokaResetTimer);
        this.mokaMood.set(mood);
        this.mokaResetTimer = setTimeout(() => {
          this.mokaMood.set('welcome');
        }, 6000);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  dismissUnlockToast(): void {
    this.challengesService.dismissJustUnlocked();
    if (this.mokaResetTimer) clearTimeout(this.mokaResetTimer);
    this.mokaMood.set('welcome');
  }

  onCoffeeChanged(count: number): void {
    void count;
  }

  onCoffeeConfirmed(count: number): void {
    void count;
  }
}
