import { Component, computed, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  createAvatarDataUrl,
  DEFAULT_AVATAR_CONFIG,
} from '../../../../core/domain/avatar-svg.rules';
import type {
  AvatarAccessory,
  AvatarConfig,
  AvatarHairColor,
  AvatarHairStyle,
  AvatarShirtColor,
  AvatarSkinTone,
} from '../../../../core/models/avatar.model';

interface AvatarOption<T> {
  value: T;
  label: string;
  color?: string;
  icon?: string;
}

@Component({
  selector: 'app-avatar-builder',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './avatar-builder.component.html',
  styleUrl: './avatar-builder.component.scss',
})
export class AvatarBuilderComponent {
  readonly saved = output<string>();
  readonly cancelled = output<void>();
  readonly config = signal<AvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  readonly previewUrl = computed(() => createAvatarDataUrl(this.config()));

  readonly skinOptions: readonly AvatarOption<AvatarSkinTone>[] = [
    { value: 'light', label: 'Claro', color: '#f6d6bd' },
    { value: 'warm', label: 'Quente', color: '#e9b68f' },
    { value: 'tan', label: 'Moreno', color: '#bd7d57' },
    { value: 'deep', label: 'Escuro', color: '#70462f' },
  ];
  readonly hairStyleOptions: readonly AvatarOption<AvatarHairStyle>[] = [
    { value: 'short', label: 'Curto', icon: 'face' },
    { value: 'curly', label: 'Cacheado', icon: 'filter_vintage' },
    { value: 'long', label: 'Longo', icon: 'person' },
    { value: 'bun', label: 'Coque', icon: 'account_circle' },
  ];
  readonly hairColorOptions: readonly AvatarOption<AvatarHairColor>[] = [
    { value: 'espresso', label: 'Café', color: '#382821' },
    { value: 'chestnut', label: 'Castanho', color: '#70452f' },
    { value: 'golden', label: 'Dourado', color: '#c08b47' },
    { value: 'black', label: 'Preto', color: '#1f2024' },
  ];
  readonly shirtOptions: readonly AvatarOption<AvatarShirtColor>[] = [
    { value: 'coffee', label: 'Café', color: '#7c5c45' },
    { value: 'rose', label: 'Rosa', color: '#b76e79' },
    { value: 'sage', label: 'Sálvia', color: '#6f947d' },
    { value: 'blue', label: 'Azul', color: '#657f9f' },
  ];
  readonly accessoryOptions: readonly AvatarOption<AvatarAccessory>[] = [
    { value: 'none', label: 'Nenhum', icon: 'block' },
    { value: 'glasses', label: 'Óculos', icon: 'visibility' },
    { value: 'headphones', label: 'Fones', icon: 'headset' },
    { value: 'earrings', label: 'Brincos', icon: 'star' },
  ];

  update<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]): void {
    this.config.update((current) => ({ ...current, [key]: value }));
  }

  save(): void {
    this.saved.emit(this.previewUrl());
  }
}
