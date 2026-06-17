import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChallengesService } from '../../services/challenges.service';
import { MokaComponent, MokaMood } from '../../../moka/moka.component';

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

  private mokaResetTimer: any = null;

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

  onCoffeeChanged(_count: number): void {}

  onCoffeeConfirmed(_count: number): void {}
}
