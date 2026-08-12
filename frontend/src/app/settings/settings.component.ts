import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSettings, ProviderInfo, SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  settings = signal<AppSettings | null>(null);
  selectedProvider = signal<string>('');
  selectedModel = signal<string>('');
  apiKeyInput = '';
  saving = signal(false);
  saved = signal(false);
  error = signal<string>('');

  constructor(private readonly settingsService: SettingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.settingsService.get().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.selectedProvider.set(data.provider);
        this.selectedModel.set(data.model);
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
}
