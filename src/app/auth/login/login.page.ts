import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FinancialService } from '../../core/services/financial.service';
import { forkJoin, catchError, of } from 'rxjs';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private financialService: FinancialService
  ) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.email || !this.password) {
      // In a real app, use a toast or alert
      console.log('Please fill in all fields');
      return;
    }

    const device = await Device.getId();
    
    this.authService.login({
      email: this.email,
      password: this.password,
      deviceId: device.identifier
    }).subscribe({
      next: (res) => {
        // If the backend returns a user but requires 2FA, 
        // we might still navigate to 2FA if that's the flow.
        // Assuming the current login returns tokens and user.
        console.log('Login successful', res);
        this.router.navigate(['/auth/two-factor'], { 
          queryParams: { email: this.email } 
        });
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }

  async socialLogin(provider: 'GOOGLE' | 'APPLE') {
    console.log(`Social login with ${provider}`);
    // In a real app, use Capacitor Google/Apple Sign-in plugins to get the idToken
    const idToken = 'SIMULATED_TOKEN'; 
    
    this.authService.socialLogin(provider, idToken).subscribe({
      next: (res) => {
        // Fetch data to determine if we should show the welcome page
        forkJoin({
          transactions: this.financialService.getTransactions().pipe(catchError(() => of([]))),
          portfolio: this.financialService.getPortfolio().pipe(catchError(() => of([])))
        }).subscribe(data => {
          if (data.transactions.length === 0 && data.portfolio.length === 0) {
            this.router.navigate(['/welcome']);
          } else {
            this.router.navigate(['/tabs']);
          }
        });
      },
      error: (err) => {
        console.error('Social login failed', err);
      }
    });
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // Navigate to forgot password page or show modal
  }
}
