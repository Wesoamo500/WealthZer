import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async createAccount() {
    // Validation
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

    // Simulate account creation
    console.log('Creating account for:', this.email);
    
    // Navigate to 2FA
    this.router.navigate(['/auth/two-factor']);
  }

  socialRegister(provider: string) {
    console.log(`Social register with ${provider}`);
    this.router.navigate(['/auth/two-factor']);
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
