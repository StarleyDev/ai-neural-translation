import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '../services/i18n.service';

type Status = 'idle' | 'uploading' | 'translating' | 'done' | 'error' | 'cancelled';

@Component({
  selector: 'app-translate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './translate.component.html',
  styleUrl: './translate.component.css',
})
export class TranslateComponent {
  targetLanguage = 'pt-br';
  removeBrackets = true;
  status = signal<Status>('idle');
  errorMessage = signal<string>('');
  downloadUrl = signal<string | null>(null);
  downloadName = signal<string>('');

  currentBatch = signal(0);
  totalBatches = signal(0);
  progressPercent = signal(0);

  private selectedFile: File | null = null;
  private eventSource: EventSource | null = null;
  private currentJobId: string | null = null;

  constructor(private readonly http: HttpClient, public readonly i18n: I18nService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.resetProgress();
    this.clearDownload();
    this.errorMessage.set('');

    if (file && !file.name.toLowerCase().endsWith('.srt')) {
      this.selectedFile = null;
      input.value = '';
      this.errorMessage.set(this.i18n.t('translate.error.onlySrt'));
      this.status.set('error');
      return;
    }

    this.selectedFile = file;
    this.status.set('idle');
  }

  translate(): void {
    if (!this.selectedFile) {
      this.errorMessage.set(this.i18n.t('translate.error.selectFile'));
      this.status.set('error');
      return;
    }

    this.clearDownload();
    this.resetProgress();
    this.status.set('uploading');
    this.errorMessage.set('');

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('target', this.targetLanguage);
    formData.append('removeBrackets', String(this.removeBrackets));

    this.http.post<{ jobId: string }>('/api/subtitles/translate', formData).subscribe({
      next: ({ jobId }) => this.trackJob(jobId),
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err));
        this.status.set('error');
      },
    });
  }

  cancel(): void {
    if (!this.currentJobId) return;

    this.http.post(`/api/subtitles/translate/${this.currentJobId}/cancel`, {}).subscribe({
      error: () => {
        // se o job já tiver terminado no servidor, apenas ignoramos
      },
    });
  }

  private trackJob(jobId: string): void {
    this.currentJobId = jobId;
    this.status.set('translating');
    this.eventSource?.close();
    this.eventSource = new EventSource(`/api/subtitles/translate/${jobId}/events`);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        this.currentBatch.set(data.batch);
        this.totalBatches.set(data.totalBatches);
        this.progressPercent.set(
          data.totalBatches > 0 ? Math.round((data.batch / data.totalBatches) * 100) : 0
        );
      }

      if (data.type === 'done') {
        this.progressPercent.set(100);
        this.downloadUrl.set(`/api/subtitles/translate/${jobId}/download`);
        this.downloadName.set(data.downloadName);
        this.status.set('done');
        this.eventSource?.close();
      }

      if (data.type === 'cancelled') {
        this.status.set('cancelled');
        this.eventSource?.close();
      }

      if (data.type === 'error') {
        this.errorMessage.set(data.message || this.i18n.t('translate.error.generic'));
        this.status.set('error');
        this.eventSource?.close();
      }
    };

    this.eventSource.onerror = () => {
      if (this.status() === 'translating') {
        this.errorMessage.set(this.i18n.t('translate.error.connectionLost'));
        this.status.set('error');
      }
      this.eventSource?.close();
    };
  }

  private resetProgress(): void {
    this.currentBatch.set(0);
    this.totalBatches.set(0);
    this.progressPercent.set(0);
  }

  private clearDownload(): void {
    this.downloadUrl.set(null);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    return err.error?.error || err.message || this.i18n.t('translate.error.generic');
  }
}
