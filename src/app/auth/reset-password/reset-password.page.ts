import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ResetPasswordPage implements OnInit {
  email: string = '';
  code: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  activeField: string = '';

  checks = {
    minLength: false,
    hasSymbol: false,
    hasCase: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      this.code = params['code'];

      if (!this.email || !this.code) {
        this.showToast('Invalid reset session. Please start over.', 'danger');
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }

  validatePassword() {
    const pwd = this.newPassword;
    this.checks.minLength = pwd.length >= 8;
    this.checks.hasSymbol = /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
    this.checks.hasCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
  }

  isFormValid() {
    return this.checks.minLength && 
           this.checks.hasSymbol && 
           this.checks.hasCase && 
           this.newPassword === this.confirmPassword;
  }

  resetPassword() {
    this.isLoading = true;
    this.authService.resetPassword({
      email: this.email,
      code: this.code,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showToast(res.message, 'success');
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast(err.error?.message || 'Error resetting password', 'danger');
      }
    });
  }

  async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
