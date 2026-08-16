import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';
import { REMEMBER_KEY } from '../login/login.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent {
  currentUsername: string;

  usernamePassword = '';
  newUsername = '';
  savingUsername = signal(false);
  usernameSaved = signal(false);
  usernameError = signal<string>('');

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = signal(false);
  passwordSaved = signal(false);
  passwordError = signal<string>('');

  constructor(
    private readonly auth: AuthService,
    public readonly i18n: I18nService,
  ) {
    this.currentUsername = this.auth.user()?.username ?? '';
  }

  changeUsername(): void {
    this.usernameSaved.set(false);
    this.usernameError.set('');

    this.savingUsername.set(true);
    this.auth.changeUsername(this.usernamePassword, this.newUsername).subscribe({
      next: (user) => {
        this.savingUsername.set(false);
        this.usernameSaved.set(true);
        this.currentUsername = user.username;
        this.updateRememberedUsername(user.username);
        this.usernamePassword = '';
        this.newUsername = '';
      },
      error: (err) => {
        this.usernameError.set(err.error?.error || 'Falha ao alterar o usuário.');
        this.savingUsername.set(false);
      },
    });
  }

  changePassword(): void {
    this.passwordSaved.set(false);
    this.passwordError.set('');

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set(this.i18n.t('account.password.error.mismatch'));
      return;
    }

    this.savingPassword.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSaved.set(true);
        this.updateRememberedPassword(this.newPassword);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordError.set(err.error?.error || 'Falha ao alterar a senha.');
        this.savingPassword.set(false);
      },
    });
  }

  private updateRememberedUsername(username: string): void {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;

    try {
      const remembered = JSON.parse(raw);
      remembered.username = username;
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(remembered));
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }

  private updateRememberedPassword(newPassword: string): void {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;

    try {
      const remembered = JSON.parse(raw);
      remembered.password = newPassword;
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(remembered));
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
}
