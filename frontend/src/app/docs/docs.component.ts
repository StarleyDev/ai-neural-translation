import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.css',
})
export class DocsComponent implements OnInit {
  @Output() back = new EventEmitter<void>();

  html = signal<SafeHtml | null>(null);
  loading = signal(true);
  error = signal<string>('');

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.http.get<{ html: string }>('/api/docs').subscribe({
      next: (data) => {
        this.html.set(this.sanitizer.bypassSecurityTrustHtml(data.html));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar a documentação.');
        this.loading.set(false);
      },
    });
  }
}
