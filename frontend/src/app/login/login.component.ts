import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

export const REMEMBER_KEY = 'ia-translate-remember';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loggedIn = output<void>();

  username = signal('');
  password = signal('');
  remember = signal(false);
  error = signal<string | null>(null);
  loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    public readonly i18n: I18nService,
  ) {
    this.loadRememberedCredentials();
  }

  submit(): void {
    if (!this.username() || !this.password() || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.username(), this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.saveRememberedCredentials();
        this.loggedIn.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || this.i18n.t('login.error'));
      },
    });
  }

  private loadRememberedCredentials(): void {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;

    try {
      const { username, password } = JSON.parse(raw);
      this.username.set(username ?? '');
      this.password.set(password ?? '');
      this.remember.set(true);
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }

  private saveRememberedCredentials(): void {
    if (this.remember()) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ username: this.username(), password: this.password() }),
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
}
