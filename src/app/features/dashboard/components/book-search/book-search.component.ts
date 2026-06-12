import { Component, Output, EventEmitter, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, from, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface BookSearchResult {
  title: string;
  author: string;
  totalPages: number;
  coverUrl: string;
  category: string;
}

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  cover_i?: number;
}

const CATEGORY_MAP: [string, string][] = [
  ['action and adventure', 'Aventura'],
  ['science fiction', 'Ficção Científica'],
  ['literary fiction', 'Drama'],
  ['crime fiction', 'Crime'],
  ['criminal justice', 'Crime'],
  ['true crime', 'Crime'],
  ['classic literature', 'Literatura Clássica'],
  ['classical literature', 'Literatura Clássica'],
  ['historical fiction', 'História'],
  ['world history', 'História'],
  ['ancient history', 'História'],
  ['epic fantasy', 'Fantasia'],
  ['urban fantasy', 'Fantasia'],
  ['high fantasy', 'Fantasia'],
  ['space opera', 'Ficção Científica'],
  ['short stories', 'Ficção'],
  ['love stories', 'Romance'],
  ['romantic fiction', 'Romance'],
  ['self-help', 'Autoajuda'],
  ['self help', 'Autoajuda'],
  ['personal growth', 'Autoajuda'],
  ['personal development', 'Desenvolvimento Pessoal'],
  ['career development', 'Carreira'],
  ['professional development', 'Carreira'],
  ['data science', 'Ciência de Dados'],
  ['machine learning', 'Ciência de Dados'],
  ['data analysis', 'Ciência de Dados'],
  ['artificial intelligence', 'Inteligência Artificial'],
  ['deep learning', 'Inteligência Artificial'],
  ['neural networks', 'Inteligência Artificial'],
  ['human behavior', 'Comportamento Humano'],
  ['social psychology', 'Comportamento Humano'],
  ['cognitive psychology', 'Psicologia'],
  ['behavioral psychology', 'Psicologia'],
  ['cognitive science', 'Neurociência'],
  ['brain science', 'Neurociência'],
  ['computer science', 'Programação'],
  ['software engineering', 'Programação'],
  ['digital marketing', 'Marketing'],
  ['cozy mystery', 'Mistério'],
  ['business strategy', 'Negócios'],
  ['business & economics', 'Negócios'],
  ['financial markets', 'Investimentos'],
  ['financial literacy', 'Finanças'],
  ['stock market', 'Investimentos'],
  ['time management', 'Produtividade'],
  ['getting things done', 'Produtividade'],
  ['habit formation', 'Hábitos'],
  ['19th century', 'Literatura Clássica'],
  ['psychological thriller', 'Suspense'],
  ['legal thriller', 'Thriller'],
  ['medical thriller', 'Thriller'],
  ['action thriller', 'Thriller'],
  ['adventure', 'Aventura'],
  ['exploration', 'Aventura'],
  ['biography', 'Biografia'],
  ['autobiography', 'Biografia'],
  ['memoir', 'Biografia'],
  ['biographies', 'Biografia'],
  ['career', 'Carreira'],
  ['leadership', 'Carreira'],
  ['management', 'Carreira'],
  ['physics', 'Ciência'],
  ['chemistry', 'Ciência'],
  ['biology', 'Ciência'],
  ['astronomy', 'Ciência'],
  ['mathematics', 'Ciência'],
  ['statistics', 'Ciência de Dados'],
  ['analytics', 'Ciência de Dados'],
  ['sociology', 'Comportamento Humano'],
  ['anthropology', 'Comportamento Humano'],
  ['behavior', 'Comportamento Humano'],
  ['crime', 'Crime'],
  ['detective', 'Crime'],
  ['dystopia', 'Distopia'],
  ['dystopian', 'Distopia'],
  ['drama', 'Drama'],
  ['education', 'Educação'],
  ['teaching', 'Educação'],
  ['learning', 'Educação'],
  ['pedagogy', 'Educação'],
  ['entrepreneurship', 'Empreendedorismo'],
  ['entrepreneur', 'Empreendedorismo'],
  ['startup', 'Empreendedorismo'],
  ['innovation', 'Empreendedorismo'],
  ['fantasy', 'Fantasia'],
  ['magic', 'Fantasia'],
  ['fiction', 'Ficção'],
  ['novel', 'Ficção'],
  ['literature', 'Ficção'],
  ['philosophy', 'Filosofia'],
  ['ethics', 'Filosofia'],
  ['logic', 'Filosofia'],
  ['metaphysics', 'Filosofia'],
  ['finance', 'Finanças'],
  ['economics', 'Finanças'],
  ['money', 'Finanças'],
  ['habits', 'Hábitos'],
  ['routine', 'Hábitos'],
  ['history', 'História'],
  ['investing', 'Investimentos'],
  ['investment', 'Investimentos'],
  ['trading', 'Investimentos'],
  ['classics', 'Literatura Clássica'],
  ['poetry', 'Literatura Clássica'],
  ['marketing', 'Marketing'],
  ['advertising', 'Marketing'],
  ['branding', 'Marketing'],
  ['mystery', 'Mistério'],
  ['whodunit', 'Mistério'],
  ['business', 'Negócios'],
  ['strategy', 'Negócios'],
  ['corporate', 'Negócios'],
  ['neuroscience', 'Neurociência'],
  ['neurology', 'Neurociência'],
  ['productivity', 'Produtividade'],
  ['efficiency', 'Produtividade'],
  ['programming', 'Programação'],
  ['coding', 'Programação'],
  ['software', 'Programação'],
  ['javascript', 'Programação'],
  ['python', 'Programação'],
  ['psychology', 'Psicologia'],
  ['psychiatry', 'Psicologia'],
  ['romance', 'Romance'],
  ['thriller', 'Suspense'],
  ['suspense', 'Suspense'],
  ['technology', 'Tecnologia'],
  ['tech', 'Tecnologia'],
  ['internet', 'Tecnologia'],
  ['digital', 'Tecnologia'],
  ['art', 'Arte'],
  ['painting', 'Arte'],
  ['sculpture', 'Arte'],
  ['drawing', 'Arte'],
  ['design', 'Arte'],
  ['motivation', 'Autoajuda'],
  ['mindfulness', 'Autoajuda'],
  ['wellbeing', 'Autoajuda'],
  ['science', 'Ciência'],
  ['nature', 'Ciência'],
  ['math', 'Ciência'],
  ['ai', 'Inteligência Artificial'],
  ['cyberpunk', 'Ficção Científica'],
  ['scifi', 'Ficção Científica'],
];

function mapSubjectsToCategory(subjects: string[] = []): string {
  const lower = subjects.map((s) => s.toLowerCase());
  for (const [key, category] of CATEGORY_MAP) {
    if (lower.some((s) => s.includes(key))) {
      return category;
    }
  }
  return 'Ficção';
}

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
})
export class BookSearchComponent implements OnDestroy {
  @Output() bookSelected = new EventEmitter<BookSearchResult>();

  query = signal('');
  results = signal<BookSearchResult[]>([]);
  isLoading = signal(false);
  private searched = signal(false);

  noResults = computed(
    () =>
      this.searched() &&
      !this.isLoading() &&
      this.results().length === 0 &&
      this.query().length > 1,
  );

  private search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.results.set([]);
            this.isLoading.set(false);
            this.searched.set(false);
            return of([]);
          }
          this.isLoading.set(true);
          this.searched.set(false);
          return from(this.fetchBooks(q));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((books) => {
        this.results.set(books);
        this.isLoading.set(false);
        this.searched.set(true);
      });
  }

  ngOnDestroy() {}

  onQueryChange(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  selectBook(book: BookSearchResult): void {
    this.bookSelected.emit(book);
    this.query.set('');
    this.results.set([]);
    this.searched.set(false);
  }

  clear(): void {
    this.query.set('');
    this.results.set([]);
    this.searched.set(false);
    this.isLoading.set(false);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/no-cover.png';
  }

  private async fetchBooks(query: string): Promise<BookSearchResult[]> {
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=title,author_name,number_of_pages_median,subject,cover_i&limit=7`;
      const res = await fetch(url);
      const data = await res.json();

      return (data.docs as OpenLibraryDoc[])
        .filter((d) => d.title && d.author_name?.length)
        .map((d) => ({
          title: d.title,
          author: d.author_name?.[0] ?? 'Autor desconhecido',
          totalPages: d.number_of_pages_median ?? 0,
          coverUrl: d.cover_i
            ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
            : 'assets/no-cover.png',
          category: mapSubjectsToCategory(d.subject),
        }));
    } catch {
      return [];
    }
  }
}
