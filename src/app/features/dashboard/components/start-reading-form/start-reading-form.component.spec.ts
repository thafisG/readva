import { TestBed } from '@angular/core/testing';
import { StartReadingFormComponent } from './start-reading-form.component';

describe('StartReadingFormComponent', () => {
  it('emits normalized form data and resets after submission', () => {
    const fixture = TestBed.createComponent(StartReadingFormComponent);
    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitted.subscribe(submitted);

    component.title = '  Dom Casmurro  ';
    component.author = '  Machado de Assis ';
    component.totalPages = 256;
    component.category = 'Literatura Clássica';
    component.submit();

    expect(submitted).toHaveBeenCalledWith({
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      totalPages: 256,
      category: 'Literatura Clássica',
    });
    expect(component.title).toBe('');
    expect(component.author).toBe('');
    expect(component.totalPages).toBe(100);
    expect(component.category).toBe('Literatura');
  });

  it('does not submit incomplete data', () => {
    const fixture = TestBed.createComponent(StartReadingFormComponent);
    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitted.subscribe(submitted);

    component.author = 'Autor';
    component.submit();

    expect(submitted).not.toHaveBeenCalled();
  });
});
