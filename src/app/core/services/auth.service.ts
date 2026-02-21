import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  public isAuthenticated = this.currentUser.pipe(map(user => !!user));

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.checkSession();
  }

  private async checkSession() {
    const userJson = await this.storageService.get('user');
    if (userJson) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
  }

  login(credentials: { email: string; password: string; deviceId?: string }): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/login', credentials).pipe(
      tap(async (res) => await this.handleAuth(res))
    );
  }

  register(userData: any): Observable<any> {
    return this.apiService.post('auth/register', userData);
  }

  verify2fa(email: string, code: string, deviceId?: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/verify-2fa', { email, code, deviceId }).pipe(
      tap(async (res) => await this.handleAuth(res))
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.apiService.post('auth/resend-otp', { email });
  }

  socialLogin(provider: 'GOOGLE' | 'APPLE', idToken: string, fullName?: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/social-login', { provider, idToken, fullName }).pipe(
      tap(async (res) => await this.handleAuth(res))
    );
  }

  private async handleAuth(res: AuthResponse) {
    await this.storageService.set('access_token', res.accessToken);
    await this.storageService.set('refresh_token', res.refreshToken);
    await this.storageService.set('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  async logout() {
    await this.storageService.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  getAccessToken(): Promise<string | null> {
    return this.storageService.get('access_token');
  }
}
