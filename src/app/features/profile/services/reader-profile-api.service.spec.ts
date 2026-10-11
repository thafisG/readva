import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { AvatarConfig } from '../../../core/models/avatar.model';
import { ReaderProfileApiService } from './reader-profile-api.service';

describe('ReaderProfileApiService', () => {
  let service: ReaderProfileApiService;
  let http: HttpTestingController;

  const avatar: AvatarConfig = {
    skinTone: 'tan',
    hairStyle: 'bun',
    hairColor: 'black',
    shirtColor: 'blue',
    accessory: 'glasses',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReaderProfileApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads, saves and imports a reader profile through its own endpoint', () => {
    service.get('reader/id').subscribe();
    http.expectOne('/api/readers/reader%2Fid/profile').flush({});

    service.save('reader-id', { displayName: 'Leitora', bio: 'Café e livros', avatar }).subscribe();
    const saveRequest = http.expectOne('/api/readers/reader-id/profile');
    expect(saveRequest.request.method).toBe('PUT');
    expect(saveRequest.request.body.avatar).toEqual(avatar);
    saveRequest.flush({});

    service.importLegacy('reader-id', { bio: '', avatar }).subscribe();
    const importRequest = http.expectOne('/api/readers/reader-id/profile/import');
    expect(importRequest.request.method).toBe('POST');
    expect(importRequest.request.body).toEqual({ bio: '', avatar });
    importRequest.flush({});
  });
});
