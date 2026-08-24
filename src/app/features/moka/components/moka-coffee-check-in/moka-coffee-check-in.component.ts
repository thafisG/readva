import { A11yModule } from '@angular/cdk/a11y';
import { Component, HostListener, output, signal } from '@angular/core';

@Component({
  selector: 'app-moka-coffee-check-in',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './moka-coffee-check-in.component.html',
  styleUrl: './moka-coffee-check-in.component.scss',
})
export class MokaCoffeeCheckInComponent {
  readonly confirmed = output<number>();
  readonly dismissed = output<void>();

  readonly coffeeCount = signal(0);

  @HostListener('document:keydown.escape')
  dismiss(): void {
    this.dismissed.emit();
  }

  increment(): void {
    this.coffeeCount.update((count) => Math.min(count + 1, 9));
  }

  decrement(): void {
    this.coffeeCount.update((count) => Math.max(count - 1, 0));
  }

  confirm(): void {
    this.confirmed.emit(this.coffeeCount());
  }
}
