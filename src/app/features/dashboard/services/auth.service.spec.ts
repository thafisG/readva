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
});
