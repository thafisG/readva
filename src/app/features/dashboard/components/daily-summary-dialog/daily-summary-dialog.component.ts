import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SummaryCardExportService } from '../../services/summary-card-export.service';

export interface DailySummaryViewModel {
  readerName: string;
  dateLabel: string;
  minutesRead: number;
  goalMinutes: number;
  coffeeCount: number;
  streakDays: number;
}

@Component({
  selector: 'app-daily-summary-dialog',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './daily-summary-dialog.component.html',
  styleUrl: './daily-summary-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySummaryDialogComponent {
  readonly summary = input.required<DailySummaryViewModel>();
  readonly closed = output<void>();

  private readonly exporter = inject(SummaryCardExportService);

  readonly firstName = computed(() => this.summary().readerName.trim().split(/\s+/)[0] || 'Leitor');
  readonly initials = computed(
    () =>
      this.summary()
        .readerName.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'L',
  );
  readonly progressPercentage = computed(() => {
    const { minutesRead, goalMinutes } = this.summary();
    if (goalMinutes <= 0) return 0;
    return Math.min(Math.max((minutesRead / goalMinutes) * 100, 0), 100);
  });

  exportImage(): void {
    void this.exporter.export('daily-summary-card', 'meu-dia-readva.png');
  }
}
