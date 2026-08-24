import { TestBed } from '@angular/core/testing';
import { MokaCoffeeCheckInComponent } from './moka-coffee-check-in.component';

describe('MokaCoffeeCheckInComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MokaCoffeeCheckInComponent],
    }).compileComponents();
  });

  it('counts coffees and emits the selected amount', () => {
    const fixture = TestBed.createComponent(MokaCoffeeCheckInComponent);
    const component = fixture.componentInstance;
    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);

    component.increment();
    component.increment();
    component.decrement();
    component.confirm();

    expect(component.coffeeCount()).toBe(1);
    expect(confirmed).toHaveBeenCalledWith(1);
  });

  it('dismisses without registering coffee', () => {
    const fixture = TestBed.createComponent(MokaCoffeeCheckInComponent);
    const component = fixture.componentInstance;
    const dismissed = vi.fn();
    const confirmed = vi.fn();
    component.dismissed.subscribe(dismissed);
    component.confirmed.subscribe(confirmed);

    component.dismiss();

    expect(dismissed).toHaveBeenCalledOnce();
    expect(confirmed).not.toHaveBeenCalled();
  });
});
