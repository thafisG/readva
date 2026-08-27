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

  it('lets the reader hide the floating companion with a double click', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.detectChanges();

    const companion: HTMLButtonElement = fixture.nativeElement.querySelector('.moka-btn');
    companion.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.moka-floating')).toBeNull();

    fixture.destroy();
    const nextPageFixture = TestBed.createComponent(MokaComponent);
    nextPageFixture.detectChanges();

    expect(nextPageFixture.nativeElement.querySelector('.moka-floating')).toBeNull();
  });

  it('hides the floating companion after a horizontal drag', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.startCompanionDrag(pointerEvent(100, 20));
    component.moveCompanionDrag(pointerEvent(25, 22));
    component.finishCompanionDrag(pointerEvent(25, 22));
    fixture.detectChanges();

    expect(component.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.companion-close')).toBeNull();
  });
  it('temporarily suppresses the companion while a separate celebration is visible', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('companionSuppressed', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.moka-floating')).toBeNull();

    fixture.componentRef.setInput('companionSuppressed', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.moka-floating')).not.toBeNull();
  });
  it('opens the large spotlight when a reward is earned', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('celebration', { id: 1, mood: 'goal' });
    fixture.detectChanges();

    expect(fixture.componentInstance.spotlightVisible()).toBe(true);
    expect(fixture.componentInstance.spotlightConfig().title).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.moka-spotlight')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.moka-floating')).toBeNull();
  });

  it('does not open the large spotlight for a non-reward state', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    fixture.componentRef.setInput('celebration', { id: 1, mood: 'welcome' });
    fixture.detectChanges();

    expect(fixture.componentInstance.spotlightVisible()).toBe(false);
    expect(fixture.nativeElement.querySelector('.moka-spotlight')).toBeNull();
  });

  it('shows distinct celebrations when different sources reuse the same numeric id', () => {
    const fixture = TestBed.createComponent(MokaComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('celebration', { id: 1, mood: 'mission' });
    fixture.detectChanges();
    component.dismissSpotlight();

    fixture.componentRef.setInput('celebration', { id: 1, mood: 'goal' });
    fixture.detectChanges();

    expect(component.spotlightVisible()).toBe(true);
    expect(component.spotlightConfig().badge).toContain('Meta');
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

function pointerEvent(clientX: number, clientY: number): PointerEvent {
  return {
    button: 0,
    clientX,
    clientY,
    pointerId: 1,
    currentTarget: document.createElement('button'),
    preventDefault: () => undefined,
  } as unknown as PointerEvent;
}
