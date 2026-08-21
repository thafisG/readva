import { Injectable, inject } from '@angular/core';
import { STORAGE_PORT } from './storage.port';

interface StorageEnvelope<T> {
  version: number;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(STORAGE_PORT);
  private readonly schemaVersion = 1;

  read<T>(key: string, fallback: T): T {
    const raw = this.storage.getItem(key);
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.isEnvelope<T>(parsed) ? parsed.value : (parsed as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    this.storage.setItem(
      key,
      JSON.stringify({ version: this.schemaVersion, value } satisfies StorageEnvelope<T>),
    );
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  userKey(key: string, email: string): string {
    const owner = email.trim().toLowerCase() || 'guest';
    return `@readva:v${this.schemaVersion}:${key}:${owner}`;
  }

  readUser<T>(key: string, email: string, fallback: T, legacyKeys: string[] = []): T {
    const scopedKey = this.userKey(key, email);
    if (this.storage.getItem(scopedKey) !== null) return this.read(scopedKey, fallback);
    for (const legacyKey of legacyKeys) {
      if (this.storage.getItem(legacyKey) === null) continue;
      const value = this.read(legacyKey, fallback);
      this.write(scopedKey, value);
      return value;
    }
    return fallback;
  }

  writeUser<T>(key: string, email: string, value: T): void {
    this.write(this.userKey(key, email), value);
  }

  private isEnvelope<T>(value: unknown): value is StorageEnvelope<T> {
    return typeof value === 'object' && value !== null && 'version' in value && 'value' in value;
  }
}
