import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../core/models/activity.model';
import { ReaderActivityApiService } from './reader-activity-api.service';

const ACTIVITY: ReadingActivity = {
  id: 'activity-1',
  userId: 'reader@example.com',
  userName: 'Reader',
  userAvatar: 'avatar.png',
  actionType: 'progress',
  bookTitle: 'Duna',
  bookAuthor: 'Frank Herbert',
  bookId: 'book-1',
  bookCategory: 'Ficção Científica',
  detail: 'Leu mais 20 páginas • 15 min de leitura',
  occurredOn: '2026-08-19',
  createdAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:05:00.000Z',
  timestamp: '2026-08-20T12:00:00.000Z',
  likes: 0,
  commentsCount: 0,
  hasLiked: false,
  pagesRead: 20,
  minutesRead: 15,
};

describe('ReaderActivityApiService', () => {
  let service: ReaderActivityApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReaderActivityApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('saves a complete activity using its stable client id', () => {
    service.save('reader-1', ACTIVITY).subscribe();

    const request = http.expectOne('/api/readers/reader-1/activities/activity-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      id: 'activity-1',
      bookReference: 'book-1',
      bookAuthor: 'Frank Herbert',
      pagesRead: 20,
      minutesRead: 15,
      occurredOn: '2026-08-19',
    });
    request.flush({});
  });

  it('imports cached activities in one request', () => {
    service.importActivities('reader-1', [ACTIVITY]).subscribe();

    const request = http.expectOne('/api/readers/reader-1/activities/import');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toHaveLength(1);
    request.flush([]);
  });
});
