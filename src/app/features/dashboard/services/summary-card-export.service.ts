import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SummaryCardExportService {
  private readonly document = inject(DOCUMENT);

  async export(elementId: string, filename: string): Promise<boolean> {
    const element = this.document.getElementById(elementId);
    if (!element) return false;

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      backgroundColor: '#fdf8f4',
      scale: 2,
    });
    const link = this.document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    return true;
  }
}
