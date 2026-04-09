import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  isBiometricsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  aiAdvisorMode?: string;
  twoFactorEnabled?: boolean;
  aiInsightsFrequency?: string;
  preferredCurrency?: string;
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
  private refreshTimer?: any;

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.checkSession();
  }


  login(credentials: { email: string; password: string; deviceId?: string }): Observable<AuthResponse | { requires2fa: true; tempToken: string }> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      switchMap(async (res: any) => {
        if (!res.requires2fa) {
          await this.handleAuth(res);
        }
        return res;
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.apiService.post('auth/register', userData);
  }

  verify2fa(email: string, code: string, deviceId?: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/verify-2fa', { email, code, deviceId }).pipe(
      switchMap(async (res) => {
        await this.handleAuth(res);
        return res;
      })
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.apiService.post('auth/resend-otp', { email });
  }

  socialLogin(provider: 'GOOGLE' | 'APPLE', idToken: string, fullName?: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/social-login', { provider, idToken, fullName }).pipe(
      switchMap(async (res) => {
        await this.handleAuth(res);
        return res;
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('auth/forgot-password', { email });
  }

  verifyResetOtp(email: string, code: string): Observable<any> {
    return this.apiService.post('auth/verify-reset-otp', { email, code });
  }

  resetPassword(data: any): Observable<any> {
    return this.apiService.post('auth/reset-password', data);
  }

  getProfile(): Observable<any> {
    return this.apiService.get('auth/profile');
  }

  updateProfile(data: any): Observable<any> {
    console.log('AuthService: Updating profile with', data);
    return this.apiService.patch('auth/profile', data).pipe(
      tap(async (updatedUser: any) => {
        console.log('AuthService: Profile updated, response:', updatedUser);
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const newUser = { ...currentUser, ...updatedUser };
          console.log('AuthService: New user object:', newUser);
          await this.storageService.set('user', JSON.stringify(newUser));
          this.currentUserSubject.next(newUser as User);
        }
      })
    );
  }


  getAccessToken(): Promise<string | null> {
    return this.storageService.get('access_token');
  }

  getRefreshToken(): Promise<string | null> {
    return this.storageService.get('refresh_token');
  }

  refreshToken(): Observable<AuthResponse> {
    return from(this.getRefreshToken()).pipe(
      switchMap(token => {
        if (!token) throw new Error('No refresh token');
        return this.apiService.post<AuthResponse>('auth/refresh', { refreshToken: token });
      }),
      tap(async (res) => {
        await this.handleAuth(res);
      }),
      catchError((err: any) => {
        this.logout();
        throw err;
      })
    );
  }

  private scheduleRefresh(accessToken: string) {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    try {
      // 1. Decode token to get expiry
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expires = payload.exp * 1000; // to ms
      const now = Date.now();

      // 2. Calculate delay (refresh 2 minutes before expiry)
      // If token is already expired or expires in < 2 mins, refresh in 1 second
      const buffer = 2 * 60 * 1000;
      let delay = expires - now - buffer;
      
      if (delay < 0) delay = 1000; 

      console.log(`[Auth] Scheduling pre-emptive refresh in ${Math.round(delay/1000)}s`);

      this.refreshTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => console.log('[Auth] Pre-emptive refresh successful'),
          error: (err: any) => console.error('[Auth] Pre-emptive refresh failed', err)
        });
      }, delay);

    } catch (e) {
      console.error('[Auth] Error scheduling refresh', e);
    }
  }

  private async handleAuth(res: AuthResponse) {
    await this.storageService.set('access_token', res.accessToken);
    await this.storageService.set('refresh_token', res.refreshToken);
    await this.storageService.set('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    
    // Schedule the next background refresh
    this.scheduleRefresh(res.accessToken);
  }

  async logout() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    await this.storageService.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  async checkSession() {
    const userJson = await this.storageService.get('user');
    const token = await this.getAccessToken();
    
    if (userJson && token) {
      this.currentUserSubject.next(JSON.parse(userJson));
      
      // Schedule refresh for existing token
      this.scheduleRefresh(token);

      // Also refresh profile data
      this.getProfile().subscribe({
        next: (profile) => {
          this.storageService.set('user', JSON.stringify(profile));
          this.currentUserSubject.next(profile);
        },
        error: (err) => {
          console.warn('[Auth] Initial profile refresh failed, likely expired token.');
        }
      });
    }
  }
}
