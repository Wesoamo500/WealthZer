import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'auth/two-factor',
    loadComponent: () => import('./auth/two-factor/two-factor.page').then(m => m.TwoFactorPage)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'profile',
    redirectTo: 'tabs/profile',
    pathMatch: 'full'
  }
];
