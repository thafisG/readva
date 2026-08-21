import { TestBed } from '@angular/core/testing';
import type { ReadingActivity } from '../../../../core/models/activity.model';
import { ActivityFeedComponent } from './activity-feed.component';

const activity: ReadingActivity = {
  id: 'activity-1',
  userId: 'reader@example.com',
  userName: 'Reader',
  userAvatar: 'reader.png',
  actionType: 'progress',
  bookId: 'book-1',
  bookTitle: 'Livro',
  bookAuthor: 'Autor',
  detail: 'Leu mais 10 páginas',
  timestamp: 'agora',
  likes: 0,
  commentsCount: 0,
  hasLiked: false,
  isOwner: true,
};

describe('ActivityFeedComponent', () => {
  it('emits user intentions without changing domain state', () => {
    const fixture = TestBed.createComponent(ActivityFeedComponent);
    fixture.componentRef.setInput('activeTab', 'meu-feed');
    fixture.componentRef.setInput('ownActivities', [activity]);
    fixture.componentRef.setInput('globalActivities', []);
    fixture.componentRef.setInput('following', []);
    const liked = vi.fn();
    fixture.componentInstance.ownActivityLiked.subscribe(liked);
    fixture.detectChanges();

    const likeButton = fixture.nativeElement.querySelector('.action-trigger') as HTMLButtonElement;
    likeButton.click();

    expect(liked).toHaveBeenCalledWith('activity-1');
    expect(activity.hasLiked).toBe(false);
  });
});
