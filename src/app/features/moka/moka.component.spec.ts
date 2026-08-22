import { TestBed } from '@angular/core/testing';
import { MokaComponent } from './moka.component';

describe('MokaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MokaComponent] }).compileComponents();
  });

  it('stays present without opening the spotlight during normal navigation', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('mood', 'welcome');
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(true);
    expect(fixture.componentInstance.spotlightVisible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.moka-avatar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.moka-spotlight')).toBeNull();
  });

  it('opens the large spotlight when a reward is earned', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('celebration', { id: 1, mood: 'goal' });
    fixture.detectChanges();

    expect(fixture.componentInstance.spotlightVisible()).toBe(true);
    expect(fixture.componentInstance.spotlightConfig().title).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.moka-spotlight')).not.toBeNull();
  });

  it('does not open the large spotlight for a non-reward state', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('celebration', { id: 1, mood: 'welcome' });
    fixture.detectChanges();

    expect(fixture.componentInstance.spotlightVisible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.moka-spotlight')).toBeNull();
  });

  it('changes the message when the same reward happens again', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    const component = fixture.componentInstance;

    component.showSpotlight('goal');
    const firstTitle = component.spotlightConfig().title;
    component.showSpotlight('goal');

    expect(component.spotlightConfig().title).not.toBe(firstTitle);
  });
});
