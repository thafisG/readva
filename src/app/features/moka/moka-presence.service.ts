import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MokaPresenceService {
  private readonly companionHidden = signal(false);

  readonly isCompanionHidden = this.companionHidden.asReadonly();

  hideCompanion(): void {
    this.companionHidden.set(true);
  }
}
