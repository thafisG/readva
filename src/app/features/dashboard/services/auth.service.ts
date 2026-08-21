import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { UserSession } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly currentUserSignal = signal<UserSession | null>(this.loadSession());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  authenticate(email: string, name: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedName.length < 2) return false;

    const users = this.loadUsers();
    let user = users.find((candidate) => candidate.email === normalizedEmail);
    if (!user) {
      user = {
        email: normalizedEmail,
        name: normalizedName,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedName)}&backgroundColor=111827,6b7280`,
      };
      this.storage.write(STORAGE_KEYS.users, [...users, user]);
    }

    this.storage.write(STORAGE_KEYS.activeSession, user);
    this.currentUserSignal.set(user);
    void this.router.navigate(['/']);
    return true;
  }

  findUser(email: string): UserSession | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return this.loadUsers().find((user) => user.email === normalizedEmail);
  }

  updateAvatar(avatar: string): boolean {
    const current = this.currentUserSignal();
    if (!current || !avatar.startsWith('data:image/svg+xml')) return false;
    const updated = { ...current, avatar };
    const users = this.loadUsers();
    const nextUsers = users.some((user) => user.email === current.email)
      ? users.map((user) => (user.email === current.email ? updated : user))
      : [...users, updated];
    this.storage.write(STORAGE_KEYS.users, nextUsers);
    this.storage.write(STORAGE_KEYS.activeSession, updated);
    this.currentUserSignal.set(updated);
    return true;
  }

  logout(): void {
    this.storage.remove(STORAGE_KEYS.activeSession);
    this.currentUserSignal.set(null);
    void this.router.navigate(['/login']);
  }

  private loadSession(): UserSession | null {
    const candidate = this.storage.read<unknown>(STORAGE_KEYS.activeSession, null);
    return this.isUser(candidate) ? candidate : null;
  }

  private loadUsers(): UserSession[] {
    const candidates = this.storage.read<unknown>(STORAGE_KEYS.users, []);
    return Array.isArray(candidates)
      ? candidates.filter((candidate) => this.isUser(candidate))
      : [];
  }

  private isUser(value: unknown): value is UserSession {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate['email'] === 'string' &&
      EMAIL_PATTERN.test(candidate['email']) &&
      typeof candidate['name'] === 'string' &&
      candidate['name'].trim().length >= 2 &&
      typeof candidate['avatar'] === 'string'
    );
  }
}
