import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProviderModel {
  id: string;
  name: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ProviderModel[];
  hasApiKey: boolean;
  apiKeyMasked: string | null;
}

export interface AppSettings {
  provider: string;
  model: string;
  providers: ProviderInfo[];
  appVersion: string;
}

export interface UpdateSettingsPayload {
  provider?: string;
  model?: string;
  apiKey?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<AppSettings> {
    return this.http.get<AppSettings>('/api/settings');
  }

  update(payload: UpdateSettingsPayload): Observable<AppSettings> {
    return this.http.put<AppSettings>('/api/settings', payload);
  }
}
