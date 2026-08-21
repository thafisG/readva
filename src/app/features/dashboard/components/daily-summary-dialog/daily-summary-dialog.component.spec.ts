import { TestBed } from '@angular/core/testing';
import { SummaryCardExportService } from '../../services/summary-card-export.service';
import { DailySummaryDialogComponent } from './daily-summary-dialog.component';

describe('DailySummaryDialogComponent', () => {
  it('derives presentation values and delegates image export', () => {
    const exporter = { export: vi.fn(async () => true) };
    TestBed.configureTestingModule({
      providers: [{ provide: SummaryCardExportService, useValue: exporter }],
    });
    const fixture = TestBed.createComponent(DailySummaryDialogComponent);
    fixture.componentRef.setInput('summary', {
      readerName: 'Maria Silva',
      dateLabel: 'sexta-feira, 21 de agosto',
      minutesRead: 30,
      goalMinutes: 60,
      coffeeCount: 2,
      streakDays: 7,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.initials()).toBe('MS');
    expect(fixture.componentInstance.firstName()).toBe('Maria');
    expect(fixture.componentInstance.progressPercentage()).toBe(50);
    fixture.componentInstance.exportImage();
    expect(exporter.export).toHaveBeenCalledWith('daily-summary-card', 'meu-dia-readva.png');
  });
});
