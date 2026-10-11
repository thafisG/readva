import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { createAvatarDataUrl, DEFAULT_AVATAR_CONFIG } from '../../../core/domain/avatar-svg.rules';
import type { StoragePort } from '../../../core/storage/storage.port';
import { STORAGE_PORT } from '../../../core/storage/storage.port';
import { STORAGE_KEYS } from '../../../core/storage/storage.keys';
import { AuthService } from './auth.service';

class SessionStorageStub implements StoragePort {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('AuthService', () => {
  let http: HttpTestingController;
  let storage: SessionStorageStub;
  let service: AuthService;

  beforeEach(() => {
    storage = new SessionStorageStub();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: STORAGE_PORT, useValue: storage },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  it('does not trust a cached session before validating it with the server', () => {
    storage.setItem(
      STORAGE_KEYS.activeSession,
      JSON.stringify({ email: 'reader@example.com', name: 'Reader', avatar: 'avatar.svg' }),
    );

    expect(service.currentUser()).toBeNull();
  });

  it('restores the server session and migrates a cached avatar only once', async () => {
    const avatar = createAvatarDataUrl(DEFAULT_AVATAR_CONFIG);
    storage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([{ email: 'reader@example.com', name: 'Old name', avatar }]),
    );

    const initialization = service.ensureInitialized();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await settleRequests();
    http.expectOne('/api/auth/session').flush({
      id: 'reader-id',
      email: 'reader@example.com',
      displayName: 'Reader',
    });
    await settleRequests();
    http
      .expectOne('/api/readers/reader-id/profile')
      .flush(profileState({ localMigrationCompleted: false, avatar: null }));
    await settleRequests();
    const migration = http.expectOne('/api/readers/reader-id/profile/import');
    expect(migration.request.body.avatar).toEqual(DEFAULT_AVATAR_CONFIG);
    migration.flush(profileState({ avatar: DEFAULT_AVATAR_CONFIG }));

    expect(await initialization).toBe(true);
    expect(service.currentUser()).toEqual({
      id: 'reader-id',
      email: 'reader@example.com',
      name: 'Reader',
      avatar,
      avatarConfig: DEFAULT_AVATAR_CONFIG,
      bio: '',
    });
  });

  it('registers through the API and stores no password locally', async () => {
    const registration = service.register('Nova Leitora', 'NOVA@example.com', 'SenhaSegura123');
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await settleRequests();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      displayName: 'Nova Leitora',
      email: 'nova@example.com',
      password: 'SenhaSegura123',
    });
    request.flush({ id: 'new-id', email: 'nova@example.com', displayName: 'Nova Leitora' });
    await settleRequests();
    http.expectOne('/api/auth/csrf').flush({ token: 'renewed' });
    await settleRequests();
    http.expectOne('/api/readers/new-id/profile').flush(
      profileState({
        readerId: 'new-id',
        displayName: 'Nova Leitora',
        email: 'nova@example.com',
        localMigrationCompleted: true,
      }),
    );

    expect((await registration).id).toBe('new-id');
    expect(storage.getItem(STORAGE_KEYS.activeSession)).not.toContain('SenhaSegura123');
    expect(storage.getItem(STORAGE_KEYS.users)).not.toContain('SenhaSegura123');
  });

  it('persists only a validated avatar configuration', async () => {
    const initialization = service.ensureInitialized();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await settleRequests();
    http.expectOne('/api/auth/session').flush({
      id: 'reader-id',
      email: 'avatar@example.com',
      displayName: 'Avatar Reader',
    });
    await settleRequests();
    http
      .expectOne('/api/readers/reader-id/profile')
      .flush(profileState({ email: 'avatar@example.com', displayName: 'Avatar Reader' }));
    await initialization;

    const saving = service.updateAvatar(DEFAULT_AVATAR_CONFIG);
    const saveRequest = http.expectOne('/api/readers/reader-id/profile');
    expect(saveRequest.request.method).toBe('PUT');
    expect(saveRequest.request.body.avatar).toEqual(DEFAULT_AVATAR_CONFIG);
    saveRequest.flush(
      profileState({
        email: 'avatar@example.com',
        displayName: 'Avatar Reader',
        avatar: DEFAULT_AVATAR_CONFIG,
      }),
    );

    expect(await saving).toBe(true);
    expect(service.currentUser()?.avatar).toBe(createAvatarDataUrl(DEFAULT_AVATAR_CONFIG));
  });

  it('replaces an HTML parsing error with an actionable login message', async () => {
    const login = service.login('reader@example.com', 'Leitura@123');
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await settleRequests();
    http.expectOne('/api/auth/login').flush('<!doctype html>', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(login).rejects.toThrow('A API respondeu em um formato inválido');
  });

  function profileState(overrides: Record<string, unknown> = {}) {
    return {
      readerId: 'reader-id',
      displayName: 'Reader',
      email: 'reader@example.com',
      bio: null,
      avatar: null,
      localMigrationCompleted: true,
      updatedAt: '2026-09-10T12:00:00Z',
      ...overrides,
    };
  }

  async function settleRequests(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }
});
