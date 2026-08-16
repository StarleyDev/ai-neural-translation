import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateComponent } from './translate/translate.component';
import { SettingsComponent } from './settings/settings.component';
import { DocsComponent } from './docs/docs.component';
import { AppLang, I18nService } from './services/i18n.service';

type View = 'translate' | 'settings' | 'docs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TranslateComponent, SettingsComponent, DocsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  view = signal<View>('translate');

  constructor(public readonly i18n: I18nService) {}

  setView(view: View): void {
    this.view.set(view);
  }

  setLang(lang: AppLang): void {
    this.i18n.setLang(lang);
  }
}
