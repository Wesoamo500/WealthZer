import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-two-factor',
  templateUrl: './two-factor.page.html',
  styleUrls: ['./two-factor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TwoFactorPage implements OnInit, OnDestroy {
  @ViewChild('hiddenInput') hiddenInputRef!: ElementRef<HTMLInputElement>;
  
  codeInput: string = '';
  email: string = 'joh***@gmail.com';
  timeLeft: number = 54; // seconds
  timerInterval: any;
  isFocused: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
    this.startTimer();
    setTimeout(() => this.focusInput(), 300);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get displayCode(): string[] {
    const digits = this.codeInput.split('');
    return Array(6).fill('').map((_, i) => digits[i] || '');
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  focusInput() {
    if (this.hiddenInputRef) {
      this.hiddenInputRef.nativeElement.focus();
    }
  }

  onInput() {
    // Only allow numbers
    this.codeInput = this.codeInput.replace(/[^0-9]/g, '');
    
    // Limit to 6 digits
    if (this.codeInput.length > 6) {
      this.codeInput = this.codeInput.substring(0, 6);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const numbers = pastedData.replace(/[^0-9]/g, '');
    this.codeInput = numbers.substring(0, 6);
  }

  resendCode() {
    console.log('Resending code...');
    // Reset timer
    this.timeLeft = 54;
    this.codeInput = '';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.startTimer();
    this.focusInput();
  }

  async verifyAndContinue() {
    if (this.codeInput.length !== 6) {
      console.log('Please enter complete 6-digit code');
      return;
    }

    const device = await Device.getId();

    this.authService.verify2fa(this.email, this.codeInput, device.identifier).subscribe({
      next: (res) => {
        console.log('2FA Verified', res);
        this.router.navigate(['/tabs']);
      },
      error: (err) => {
        console.error('2FA Verification failed', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
