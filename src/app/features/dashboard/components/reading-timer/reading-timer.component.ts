import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ReadingTimerService } from '../../services/reading-timer.service';

@Component({
  selector: 'app-reading-timer',
  standalone: true,
  templateUrl: './reading-timer.component.html',
  styleUrl: './reading-timer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingTimerComponent {
  readonly hasActiveBook = input(false);
  readonly manageRequested = output<void>();
  readonly timer = inject(ReadingTimerService);

  readonly minuteDigits = computed(() => {
    const minutes = Math.floor(this.timer.elapsedSeconds() / 60);
    return minutes.toString().padStart(2, '0').split('');
  });
  readonly secondDigits = computed(() =>
    (this.timer.elapsedSeconds() % 60).toString().padStart(2, '0').split(''),
  );

  openManager(): void {
    if (this.hasActiveBook()) this.manageRequested.emit();
  }
}
