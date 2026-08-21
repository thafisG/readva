import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import type { ReaderStatistics } from '../../../../core/models/profile-statistics.model';
import { ProfileGoalsService } from '../../services/profile-goals.service';

@Component({
  selector: 'app-reading-goals',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './reading-goals.component.html',
  styleUrl: './reading-goals.component.scss',
})
export class ReadingGoalsComponent {
  readonly stats = input.required<ReaderStatistics>();
  readonly goals = inject(ProfileGoalsService);
  readonly editing = signal(false);
  readonly saved = signal(false);
  dailyMinutes = this.goals.goals().dailyMinutes;
  monthlyBooks = this.goals.goals().monthlyBooks;
  toggle(): void {
    this.saved.set(false);
    this.editing.update((value) => !value);
  }
  save(): void {
    this.goals.update({ dailyMinutes: this.dailyMinutes, monthlyBooks: this.monthlyBooks });
    this.dailyMinutes = this.goals.goals().dailyMinutes;
    this.monthlyBooks = this.goals.goals().monthlyBooks;
    this.editing.set(false);
    this.saved.set(true);
  }
  progress(): number {
    return Math.min(
      100,
      Math.round((this.stats().month.completedBooks / this.goals.goals().monthlyBooks) * 100),
    );
  }
}
