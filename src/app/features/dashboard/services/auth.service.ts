import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  createAvatarDataUrl,
  isAvatarConfig,
  parseAvatarDataUrl,
} from '../../../core/domain/avatar-svg.rules';
import type { AvatarConfig } from '../../../core/models/avatar.model';
import type { UserSession } from '../../../core/models/user.model';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { StorageService } from '../../../core/storage/storage.service';
import {
  ReaderProfileApiService,
  type ReaderProfileState,
} from '../../profile/services/reader-profile-api.service';

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
  private readonly profileApi = inject(ReaderProfileApiService);
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
      return await this.synchronizeProfile(user);
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
      return await this.synchronizeProfile(user);
    } catch (error) {
      throw new Error(this.errorMessage(error), { cause: error });
    }
  }

  findUser(email: string): UserSession | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return this.loadUsers().find((user) => user.email === normalizedEmail);
  }

  async updateAvatar(avatarConfig: AvatarConfig): Promise<boolean> {
    const current = this.currentUserSignal();
    if (!current?.id || !isAvatarConfig(avatarConfig)) return false;
    return this.saveProfile({
      displayName: current.name,
      bio: current.bio ?? '',
      avatar: avatarConfig,
    });
  }

  async updateProfile(displayName: string, bio: string): Promise<boolean> {
    const current = this.currentUserSignal();
    const normalizedName = displayName.trim().replace(/\s+/g, ' ');
    const normalizedBio = bio.trim().replace(/\s+/g, ' ');
    if (
      !current?.id ||
      normalizedName.length < 2 ||
      normalizedName.length > 100 ||
      normalizedBio.length > 280
    ) {
      return false;
    }
    return this.saveProfile({
      displayName: normalizedName,
      bio: normalizedBio,
      avatar: current.avatarConfig ?? null,
    });
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
      const reader = this.requireAuthenticatedReader(
        await firstValueFrom(this.http.get<AuthenticatedReader>('/api/auth/session')),
      );
      await this.synchronizeProfile(this.setAuthenticatedReader(reader));
      return true;
    } catch {
      this.clearLocalSession();
      return false;
    }
  }

  private async refreshCsrfToken(): Promise<void> {
    await firstValueFrom(this.http.get('/api/auth/csrf'));
  }

  private requireAuthenticatedReader(value: unknown): AuthenticatedReader {
    if (typeof value === 'object' && value !== null) {
      const candidate = value as Record<string, unknown>;
      if (
        typeof candidate['id'] === 'string' &&
        typeof candidate['email'] === 'string' &&
        typeof candidate['displayName'] === 'string'
      ) {
        return candidate as unknown as AuthenticatedReader;
      }
    }
    throw new SyntaxError('A resposta de autenticação da API não é JSON válido.');
  }
  private setAuthenticatedReader(value: unknown): UserSession {
    const reader = this.requireAuthenticatedReader(value);
    const email = reader.email.trim().toLowerCase();
    const cached = this.findUser(email);
    const avatarConfig =
      cached?.avatarConfig ?? (cached?.avatar ? parseAvatarDataUrl(cached.avatar) : null);
    const user: UserSession = {
      id: reader.id,
      email,
      name: reader.displayName.trim(),
      avatar: avatarConfig
        ? createAvatarDataUrl(avatarConfig)
        : this.defaultAvatar(reader.displayName),
      avatarConfig,
      bio: cached?.bio ?? '',
    };
    this.persistUser(user);
    return user;
  }

  private async synchronizeProfile(user: UserSession): Promise<UserSession> {
    if (!user.id) return user;
    try {
      let profile = await firstValueFrom(this.profileApi.get(user.id));
      if (!profile.localMigrationCompleted) {
        profile = await firstValueFrom(
          this.profileApi.importLegacy(user.id, {
            bio: user.bio ?? '',
            avatar: user.avatarConfig ?? parseAvatarDataUrl(user.avatar),
          }),
        );
      }
      return this.applyServerProfile(user, profile);
    } catch {
      // A sessão continua utilizável com o cache local enquanto o perfil não sincroniza.
      return user;
    }
  }

  private async saveProfile(profile: {
    displayName: string;
    bio: string;
    avatar: AvatarConfig | null;
  }): Promise<boolean> {
    const current = this.currentUserSignal();
    if (!current?.id) return false;
    try {
      const saved = await firstValueFrom(this.profileApi.save(current.id, profile));
      this.applyServerProfile(current, saved);
      return true;
    } catch {
      return false;
    }
  }

  private applyServerProfile(user: UserSession, profile: ReaderProfileState): UserSession {
    const updated: UserSession = {
      ...user,
      name: profile.displayName.trim(),
      email: profile.email.trim().toLowerCase(),
      bio: profile.bio ?? '',
      avatarConfig: profile.avatar,
      avatar: profile.avatar
        ? createAvatarDataUrl(profile.avatar)
        : this.defaultAvatar(profile.displayName),
    };
    this.persistUser(updated);
    return updated;
  }

  private persistUser(user: UserSession): void {
    const users = this.loadUsers();
    const nextUsers = users.some((candidate) => candidate.email === user.email)
      ? users.map((candidate) => (candidate.email === user.email ? user : candidate))
      : [...users, user];
    this.storage.write(STORAGE_KEYS.users, nextUsers);
    this.storage.write(STORAGE_KEYS.activeSession, user);
    this.currentUserSignal.set(user);
  }

  private defaultAvatar(displayName: string): string {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=111827,6b7280`;
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
      typeof candidate['avatar'] === 'string' &&
      (candidate['avatarConfig'] === undefined ||
        candidate['avatarConfig'] === null ||
        isAvatarConfig(candidate['avatarConfig'])) &&
      (candidate['bio'] === undefined || typeof candidate['bio'] === 'string')
    );
  }

  private errorMessage(error: unknown): string {
    const errorRecord =
      typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;
    const technicalMessage = error instanceof Error ? error.message : String(error);
    if (
      error instanceof SyntaxError ||
      errorRecord?.['status'] === 200 ||
      technicalMessage.includes("Unexpected token '<'") ||
      technicalMessage.includes('Http failure during parsing')
    ) {
      return 'A API respondeu em um formato inválido. Reinicie o backend e o ng serve para reativar o proxy.';
    }
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
