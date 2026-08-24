import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { UserSession } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthenticatedReader {
  id: string;
  email: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly currentUserSignal = signal<UserSession | null>(null);
  private initialization: Promise<boolean> | null = null;

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  ensureInitialized(): Promise<boolean> {
    if (!this.initialization) this.initialization = this.restoreServerSession();
    return this.initialization;
  }

  async login(email: string, password: string): Promise<UserSession> {
    try {
      await this.refreshCsrfToken();
      const reader = await firstValueFrom(
        this.http.post<AuthenticatedReader>('/api/auth/login', {
          email: email.trim().toLowerCase(),
          password,
        }),
      );
      const user = this.setAuthenticatedReader(reader);
      this.initialization = Promise.resolve(true);
      await this.refreshCsrfToken();
      return user;
    } catch (error) {
      throw new Error(this.errorMessage(error), { cause: error });
    }
  }

  async register(name: string, email: string, password: string): Promise<UserSession> {
    try {
      await this.refreshCsrfToken();
      const reader = await firstValueFrom(
        this.http.post<AuthenticatedReader>('/api/auth/register', {
          displayName: name.trim().replace(/\s+/g, ' '),
          email: email.trim().toLowerCase(),
          password,
        }),
      );
      const user = this.setAuthenticatedReader(reader);
      this.initialization = Promise.resolve(true);
      await this.refreshCsrfToken();
      return user;
    } catch (error) {
      throw new Error(this.errorMessage(error), { cause: error });
    }
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

  async logout(): Promise<void> {
    try {
      await this.refreshCsrfToken();
      await firstValueFrom(this.http.post<void>('/api/auth/logout', null));
    } catch {
      // A sessão local deve poder ser encerrada mesmo com a API indisponível.
    } finally {
      this.clearLocalSession();
      this.initialization = Promise.resolve(false);
      try {
        await this.refreshCsrfToken();
      } catch {
        // O logout local continua válido mesmo se o backend já estiver indisponível.
      }
      await this.router.navigate(['/login']);
    }
  }

  private async restoreServerSession(): Promise<boolean> {
    try {
      await this.refreshCsrfToken();
      const reader = await firstValueFrom(this.http.get<AuthenticatedReader>('/api/auth/session'));
      this.setAuthenticatedReader(reader);
      return true;
    } catch {
      this.clearLocalSession();
      return false;
    }
  }

  private async refreshCsrfToken(): Promise<void> {
    await firstValueFrom(this.http.get('/api/auth/csrf'));
  }

  private setAuthenticatedReader(reader: AuthenticatedReader): UserSession {
    const email = reader.email.trim().toLowerCase();
    const cached = this.findUser(email);
    const user: UserSession = {
      id: reader.id,
      email,
      name: reader.displayName.trim(),
      avatar:
        cached?.avatar ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reader.displayName)}&backgroundColor=111827,6b7280`,
    };
    const users = this.loadUsers();
    const nextUsers = users.some((candidate) => candidate.email === email)
      ? users.map((candidate) => (candidate.email === email ? user : candidate))
      : [...users, user];
    this.storage.write(STORAGE_KEYS.users, nextUsers);
    this.storage.write(STORAGE_KEYS.activeSession, user);
    this.currentUserSignal.set(user);
    return user;
  }

  private clearLocalSession(): void {
    this.storage.remove(STORAGE_KEYS.activeSession);
    this.currentUserSignal.set(null);
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
      (candidate['id'] === undefined || typeof candidate['id'] === 'string') &&
      typeof candidate['email'] === 'string' &&
      EMAIL_PATTERN.test(candidate['email']) &&
      typeof candidate['name'] === 'string' &&
      candidate['name'].trim().length >= 2 &&
      typeof candidate['avatar'] === 'string'
    );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Não foi possível acessar o servidor. Confirme se o backend está iniciado.';
      }
      const apiMessage = (error.error as { message?: unknown } | null)?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
      if (error.status === 401) return 'E-mail ou senha inválidos.';
    }
    return 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}
