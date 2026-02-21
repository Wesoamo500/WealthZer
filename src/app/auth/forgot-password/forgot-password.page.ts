import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ForgotPasswordPage implements OnInit, OnDestroy {
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  step: number = 1;
  email: string = '';
  codeInput: string = '';
  isLoading: boolean = false;
  isFocused: boolean = false;
  timeLeft: number = 900; // 15 minutes for reset OTP
  resendCooldown: number = 0;
  cooldownInterval: any;

  constructor(
    private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.stopCooldown();
  }

  get displayCode(): string[] {
    const digits = this.codeInput.split('');
    return Array(6).fill('').map((_, i) => digits[i] || '');
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  sendOtp() {
    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showToast(res.message, 'success');
        this.step = 2;
        this.timeLeft = 900;
        this.startCooldown();
        setTimeout(() => this.focusInput(), 300);
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast(err.error?.message || 'Error sending reset code', 'danger');
      }
    });
  }

  verifyOtp() {
    this.isLoading = true;
    this.authService.verifyResetOtp(this.email, this.codeInput).subscribe({
      next: () => {
        this.isLoading = false;
        // Navigate to reset password page with email and code
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { 
            email: this.email,
            code: this.codeInput
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast(err.error?.message || 'Invalid verification code', 'danger');
        this.codeInput = '';
      }
    });
  }

  onInput() {
    // Only allow numbers
    this.codeInput = this.codeInput.replace(/[^0-9]/g, '');
    
    // Limit to 6 digits
    if (this.codeInput.length > 6) {
      this.codeInput = this.codeInput.substring(0, 6);
    }

    if (this.codeInput.length === 6) {
      this.verifyOtp();
    }
  }

  focusInput() {
    if (this.hiddenInput) {
      this.hiddenInput.nativeElement.focus();
    }
  }

  startCooldown() {
    this.resendCooldown = 60;
    this.stopCooldown();
    this.cooldownInterval = setInterval(() => {
      if (this.timeLeft > 0) this.timeLeft--;
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      }
      
      if (this.timeLeft <= 0 && this.resendCooldown <= 0) {
        this.stopCooldown();
      }
    }, 1000);
  }

  stopCooldown() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
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
