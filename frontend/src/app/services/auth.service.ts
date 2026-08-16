import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(null);

  constructor(private readonly http: HttpClient) {}

  checkSession(): Observable<AuthUser> {
    return this.http.get<AuthUser>('/api/auth/me').pipe(tap((user) => this.user.set(user)));
  }

  login(username: string, password: string): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/auth/login', { username, password })
      .pipe(tap((user) => this.user.set(user)));
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http
      .post<{ ok: boolean }>('/api/auth/logout', {})
      .pipe(tap(() => this.user.set(null)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>('/api/auth/password', { currentPassword, newPassword });
  }

  changeUsername(currentPassword: string, newUsername: string): Observable<AuthUser> {
    return this.http
      .put<AuthUser>('/api/auth/username', { currentPassword, newUsername })
      .pipe(tap((user) => this.user.set(user)));
  }
}
