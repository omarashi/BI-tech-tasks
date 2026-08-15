import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from '../models/user';
import { API_AUTH_URL } from '../shared/api-urls';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenKey = 'auth_token';
  private readonly roleKey = 'auth_role';
  private readonly userKey = 'auth_user';

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_AUTH_URL}/api/auth/login`, { username, password });
  }

  saveSession(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.roleKey, response.user.role);
    localStorage.setItem(this.userKey, response.user.username);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userKey);
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get role(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  get username(): string | null {
    return localStorage.getItem(this.userKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.role === 'Admin';
  }
}
