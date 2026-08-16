import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSettings, ProviderInfo, SettingsService } from '../services/settings.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  @Output() openDocs = new EventEmitter<void>();

  settings = signal<AppSettings | null>(null);
  selectedProvider = signal<string>('');
  selectedModel = signal<string>('');
  apiKeyInput = '';
  saving = signal(false);
  saved = signal(false);
  error = signal<string>('');

  promptDraft = '';
  savingPrompt = signal(false);
  promptSaved = signal(false);
  promptError = signal<string>('');

  constructor(
    private readonly settingsService: SettingsService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.settingsService.get().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.selectedProvider.set(data.provider);
        this.selectedModel.set(data.model);
        this.promptDraft = data.promptTemplate;
      },
      error: () => this.error.set('Não foi possível carregar as configurações.'),
    });
  }

  get currentProviderInfo(): ProviderInfo | undefined {
    return this.settings()?.providers.find((p) => p.id === this.selectedProvider());
  }

  onProviderChange(providerId: string): void {
    this.selectedProvider.set(providerId);
    const provider = this.settings()?.providers.find((p) => p.id === providerId);
    if (provider) {
      this.selectedModel.set(provider.models[0]?.id ?? '');
    }
    this.apiKeyInput = '';
    this.saved.set(false);
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');

    const payload: { provider: string; model: string; apiKey?: string } = {
      provider: this.selectedProvider(),
      model: this.selectedModel(),
    };
    if (this.apiKeyInput.trim()) {
      payload.apiKey = this.apiKeyInput.trim();
    }

    this.settingsService.update(payload).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.apiKeyInput = '';
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Falha ao salvar configurações.');
        this.saving.set(false);
      },
    });
  }

  savePrompt(): void {
    this.savingPrompt.set(true);
    this.promptSaved.set(false);
    this.promptError.set('');

    this.settingsService.update({ promptTemplate: this.promptDraft }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.promptDraft = data.promptTemplate;
        this.savingPrompt.set(false);
        this.promptSaved.set(true);
      },
      error: (err) => {
        this.promptError.set(err.error?.error || 'Falha ao salvar o prompt.');
        this.savingPrompt.set(false);
      },
    });
  }

  resetPrompt(): void {
    this.savingPrompt.set(true);
    this.promptSaved.set(false);
    this.promptError.set('');

    this.settingsService.update({ resetPromptTemplate: true }).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.promptDraft = data.promptTemplate;
        this.savingPrompt.set(false);
        this.promptSaved.set(true);
      },
      error: (err) => {
        this.promptError.set(err.error?.error || 'Falha ao restaurar o prompt.');
        this.savingPrompt.set(false);
      },
    });
  }
}
