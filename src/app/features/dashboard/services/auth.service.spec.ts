import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('restores the server session and preserves a cached avatar', async () => {
    const avatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E';
    storage.setItem(
      STORAGE_KEYS.users,
      JSON.stringify([{ email: 'reader@example.com', name: 'Old name', avatar }]),
    );

    const initialization = service.ensureInitialized();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('/api/auth/session').flush({
      id: 'reader-id',
      email: 'reader@example.com',
      displayName: 'Reader',
    });

    expect(await initialization).toBe(true);
    expect(service.currentUser()).toEqual({
      id: 'reader-id',
      email: 'reader@example.com',
      name: 'Reader',
      avatar,
    });
  });

  it('registers through the API and stores no password locally', async () => {
    const registration = service.register('Nova Leitora', 'NOVA@example.com', 'SenhaSegura123');
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await Promise.resolve();
    await Promise.resolve();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      displayName: 'Nova Leitora',
      email: 'nova@example.com',
      password: 'SenhaSegura123',
    });
    request.flush({ id: 'new-id', email: 'nova@example.com', displayName: 'Nova Leitora' });
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('/api/auth/csrf').flush({ token: 'renewed' });

    expect((await registration).id).toBe('new-id');
    expect(storage.getItem(STORAGE_KEYS.activeSession)).not.toContain('SenhaSegura123');
    expect(storage.getItem(STORAGE_KEYS.users)).not.toContain('SenhaSegura123');
  });

  it('updates only safe avatar data for an authenticated reader', async () => {
    const initialization = service.ensureInitialized();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf' });
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('/api/auth/session').flush({
      id: 'reader-id',
      email: 'avatar@example.com',
      displayName: 'Avatar Reader',
    });
    await initialization;

    const avatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E';
    expect(service.updateAvatar(avatar)).toBe(true);
    expect(service.currentUser()?.avatar).toBe(avatar);
    expect(service.findUser('avatar@example.com')?.avatar).toBe(avatar);
    expect(service.updateAvatar('https://example.com/avatar.svg')).toBe(false);
  });
});
