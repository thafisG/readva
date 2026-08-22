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
  it('loads a valid legacy session during service initialization', () => {
    const storage = new SessionStorageStub();
    storage.setItem(
      STORAGE_KEYS.activeSession,
      JSON.stringify({
        email: 'reader@example.com',
        name: 'Reader',
        avatar: 'avatar.svg',
      }),
    );
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: STORAGE_PORT, useValue: storage }],
    });

    expect(TestBed.inject(AuthService).currentUser()?.email).toBe('reader@example.com');
  });

  it('ignores an invalid saved session', () => {
    const storage = new SessionStorageStub();
    storage.setItem(STORAGE_KEYS.activeSession, JSON.stringify({ email: 'invalid' }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: STORAGE_PORT, useValue: storage }],
    });

    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
  });

  it('persists a generated avatar in the user and active session', () => {
    const storage = new SessionStorageStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: STORAGE_PORT, useValue: storage }],
    });
    const service = TestBed.inject(AuthService);
    service.authenticate('avatar@example.com', 'Avatar Reader');

    const avatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E';
    expect(service.updateAvatar(avatar)).toBe(true);
    expect(service.currentUser()?.avatar).toBe(avatar);
    expect(service.findUser('avatar@example.com')?.avatar).toBe(avatar);
  });

  it('rejects an external avatar update', () => {
    const storage = new SessionStorageStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: STORAGE_PORT, useValue: storage }],
    });
    const service = TestBed.inject(AuthService);
    service.authenticate('avatar@example.com', 'Avatar Reader');

    expect(service.updateAvatar('https://example.com/avatar.svg')).toBe(false);
  });
});
