import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BookCatalogService {
  private http = inject(HttpClient);

  getBooks() {
    return this.http.get<any[]>('/assets/books.json');
  }
}
