import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateComponent } from './translate/translate.component';
import { SettingsComponent } from './settings/settings.component';
import { DocsComponent } from './docs/docs.component';
import { LoginComponent } from './login/login.component';
import { AccountComponent } from './account/account.component';
import { AppLang, I18nService } from './services/i18n.service';
import { AuthService } from './services/auth.service';

type View = 'translate' | 'settings' | 'account' | 'docs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TranslateComponent,
    SettingsComponent,
    DocsComponent,
    LoginComponent,
    AccountComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  view = signal<View>('translate');
  checkingSession = signal(true);

  constructor(
    public readonly i18n: I18nService,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.auth.checkSession().subscribe({
      next: () => this.checkingSession.set(false),
      error: () => this.checkingSession.set(false),
    });
  }

  setView(view: View): void {
    this.view.set(view);
  }

  setLang(lang: AppLang): void {
    this.i18n.setLang(lang);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.view.set('translate'));
  }
}
