import { TestBed } from '@angular/core/testing';
import type { StoragePort } from './storage.port';
import { STORAGE_PORT } from './storage.port';
import { StorageService } from './storage.service';

class MemoryStorage implements StoragePort {
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

describe('StorageService', () => {
  let storage: StorageService;
  let port: MemoryStorage;

  beforeEach(() => {
    port = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [StorageService, { provide: STORAGE_PORT, useValue: port }],
    });
    storage = TestBed.inject(StorageService);
  });

  it('returns the fallback when stored JSON is invalid', () => {
    port.setItem('broken', '{');
    expect(storage.read('broken', ['fallback'])).toEqual(['fallback']);
  });

  it('isolates values by normalized user email', () => {
    storage.writeUser('books', ' ANA@Example.com ', ['a']);
    storage.writeUser('books', 'bia@example.com', ['b']);
    expect(storage.readUser('books', 'ana@example.com', [])).toEqual(['a']);
    expect(storage.readUser('books', 'bia@example.com', [])).toEqual(['b']);
  });

  it('migrates a legacy key without deleting the source', () => {
    port.setItem('legacy', JSON.stringify(['old']));
    expect(storage.readUser('books', 'ana@example.com', [], ['legacy'])).toEqual(['old']);
    expect(port.getItem('legacy')).not.toBeNull();
  });
});
