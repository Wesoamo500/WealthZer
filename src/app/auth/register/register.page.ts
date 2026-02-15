import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class RegisterPage implements OnInit {
  fullName: string = '';
  email: string = '';
  password: string = '';
  referralCode: string = '';
  agreeToTerms: boolean = false;
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async createAccount() {
    if (!this.fullName || !this.email || !this.password) {
      console.log('Please fill in all required fields');
      return;
    }

    if (this.password.length < 8) {
      console.log('Password must be at least 8 characters');
      return;
    }

    if (!this.agreeToTerms) {
      console.log('Please agree to the Terms of Service');
      return;
    }

    this.authService.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      referralCode: this.referralCode
    }).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
      }
    });
  }

  socialRegister(provider: 'GOOGLE' | 'APPLE') {
    console.log(`Social register with ${provider}`);
    // Similar to socialLogin
    const idToken = 'SIMULATED_TOKEN';
    this.authService.socialLogin(provider, idToken, this.fullName).subscribe({
      next: (res) => {
        // Since it's a new social registration, user has no data yet
        this.router.navigate(['/welcome']);
      },
      error: (err) => {
        console.error('Social registration failed', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
