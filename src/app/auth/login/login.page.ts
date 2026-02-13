import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    // Basic validation
    if (!this.email || !this.password) {
      console.log('Please fill in all fields');
      return;
    }

    // Simulate login - in production, call authentication service
    console.log('Logging in with:', this.email);
    
    // Navigate to 2FA page
    this.router.navigate(['/auth/two-factor']);
  }

  socialLogin(provider: string) {
    console.log(`Social login with ${provider}`);
    // In production, implement OAuth flow
    this.router.navigate(['/auth/two-factor']);
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // Navigate to forgot password page or show modal
  }
}
