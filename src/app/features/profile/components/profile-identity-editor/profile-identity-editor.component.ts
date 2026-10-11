import { A11yModule } from '@angular/cdk/a11y';
import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface ProfileIdentityChanges {
  displayName: string;
  bio: string;
}

@Component({
  selector: 'app-profile-identity-editor',
  standalone: true,
  imports: [A11yModule, FormsModule, MatIconModule],
  templateUrl: './profile-identity-editor.component.html',
  styleUrl: './profile-identity-editor.component.scss',
})
export class ProfileIdentityEditorComponent {
  readonly initialName = input.required<string>();
  readonly initialBio = input<string>('');
  readonly saved = output<ProfileIdentityChanges>();
  readonly cancelled = output<void>();

  displayName = '';
  bio = '';

  constructor() {
    effect(() => {
      this.displayName = this.initialName();
      this.bio = this.initialBio();
    });
  }

  save(): void {
    const displayName = this.displayName.trim().replace(/\s+/g, ' ');
    const bio = this.bio.trim().replace(/\s+/g, ' ');
    if (displayName.length < 2 || displayName.length > 100 || bio.length > 280) return;
    this.saved.emit({ displayName, bio });
  }
}
