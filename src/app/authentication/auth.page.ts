// ============================================================
// auth.page.ts  — WealthZer · Page 2: Authentication
// Covers: Login · Register (3-step) · 2FA OTP
// ============================================================
import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { Router }              from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonIcon,
  IonSpinner, IonNote, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  fingerPrintOutline, logoGoogle, arrowForwardOutline,
  chevronBackOutline, phonePortraitOutline,
} from 'ionicons/icons';
import { interval, Subscription, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Device } from '@capacitor/device';
import {
  trigger, transition, style, animate,
} from '@angular/animations';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

// ── Real services ──────────────────────────────────────────
import { AuthService } from '../core/services/auth.service';
import { StorageService } from '../core/services/storage.service';

// ── Password strength scorer (lightweight, no zxcvbn dep) ─
function scorePassword(pw: string): { score: number; hint: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const hints = [
    'Too short',
    'Weak — add uppercase letters',
    'Fair — add numbers',
    'Good — add a symbol to strengthen',
    'Strong',
    'Very strong',
  ];
  return { score: Math.min(score, 5), hint: hints[Math.min(score, 5)] };
}

// ── Password match validator ───────────────────────────────
function passwordsMatch(group: AbstractControl) {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw === cpw ? null : { mismatch: true };
}

// ── Auth view states ───────────────────────────────────────
export type AuthView = 'login' | 'register' | 'twofa';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonButton, IonInput, IonIcon, IonSpinner, IonNote,
  ],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('350ms var(--wz-ease-out)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(8px)' })),
      ]),
    ]),
  ],
})
export class AuthPage implements OnInit, OnDestroy {

  // ── View state ──────────────────────────────────────────
  view: AuthView = 'login';
  registerStep = 1;           // 1 | 2 | 3
  totalSteps   = 3;

  // ── UI toggles ──────────────────────────────────────────
  showPassword        = false;
  showConfirmPassword = false;
  isLoading           = false;
  biometricAvailable  = false;

  // ── 2FA state ───────────────────────────────────────────
  otpValues: string[] = ['', '', '', '', '', ''];
  resendSeconds       = 60;
  canResend           = false;
  private timerSub?   : Subscription;

  // ── Password strength ───────────────────────────────────
  passwordScore = 0;
  passwordHint  = '';

  // ── OTP input refs for auto-focus ───────────────────────
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLIonInputElement>>;

  // ── Forms ───────────────────────────────────────────────
  loginForm!    : FormGroup;
  registerForm! : FormGroup;

  constructor(
    private fb       : FormBuilder,
    private router   : Router,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private storage  : StorageService,
  ) {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      fingerPrintOutline, logoGoogle, arrowForwardOutline,
      chevronBackOutline, phonePortraitOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForms();
    this.checkBiometrics();
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  // ── Form builders ───────────────────────────────────────
  private buildForms(): void {
    this.loginForm = this.fb.group({
      email   : ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.registerForm = this.fb.group({
      // Step 1
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName : ['', [Validators.required, Validators.minLength(2)]],
      email    : ['', [Validators.required, Validators.email]],
      // Step 2
      password       : ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms    : [false, Validators.requiredTrue],
      // Step 3
      currency       : ['USD'],
    }, { validators: passwordsMatch });

    // Live password strength
    this.registerForm.get('password')?.valueChanges.subscribe(val => {
      const { score, hint } = scorePassword(val ?? '');
      this.passwordScore = score;
      this.passwordHint  = hint;
    });
  }

  // ── Biometric check ─────────────────────────────────────
  private async checkBiometrics(): Promise<void> {
    try {
      const result = await BiometricAuth.checkBiometry();
      this.biometricAvailable = result.isAvailable;
    } catch {
      this.biometricAvailable = false;
    }
  }

  // ── Navigation between views ────────────────────────────
  goTo(view: AuthView): void { this.view = view; }

  // ── Login ───────────────────────────────────────────────
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      const { email, password } = this.loginForm.value;
      const { identifier: deviceId } = await Device.getId();

      const res = await firstValueFrom(this.authService.login({ email, password, deviceId }));

      if ('requires2fa' in res && res.requires2fa) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        this.view = 'twofa';
        this.startResendTimer();
      } else {
        await Haptics.notification({ type: NotificationType.Success });
        await this.navigateToDashboard();
      }
    } catch (err: any) {
      console.error('Login error', err);
      this.showToast(err.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: 'danger' | 'success' = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: 'wz-toast',
    });
    await toast.present();
  }

  // ── Biometric login ─────────────────────────────────────
  async onBiometricLogin(): Promise<void> {
    try {
      await BiometricAuth.authenticate({
        reason: 'Sign in to your WealthZer account',
        cancelTitle: 'Cancel',
      });
      await this.navigateToDashboard();
    } catch (error) {
      console.warn('Biometric authentication cancelled or failed', error);
    }
  }

  // ── Register (multi-step) ───────────────────────────────
  async onRegisterNext(): Promise<void> {
    const stepFields: Record<number, string[]> = {
      1: ['firstName', 'lastName', 'email'],
      2: ['password', 'confirmPassword', 'acceptTerms'],
      3: ['currency'],
    };

    // Validate only current step fields
    const fields = stepFields[this.registerStep];
    const invalid = fields.some(f => {
      const ctrl = this.registerForm.get(f);
      ctrl?.markAsTouched();
      return ctrl?.invalid;
    });

    if (this.registerStep === 2 && this.registerForm.hasError('mismatch')) return;
    if (invalid) return;

    if (this.registerStep < this.totalSteps) {
      await Haptics.impact({ style: ImpactStyle.Light });
      this.registerStep++;
      return;
    }

    // Final step — submit
    this.isLoading = true;
    try {
      const registrationData = this.registerForm.value;
      await firstValueFrom(this.authService.register(registrationData));

      await Haptics.notification({ type: NotificationType.Success });
      await this.showToast('Account created successfully!', 'success');

      // Generally registration leads to login or auto-login with 2FA
      this.view = 'login';
    } catch (err: any) {
      console.error('Register error', err);
      this.showToast(err.error?.message || 'Registration failed. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  onRegisterBack(): void {
    if (this.registerStep > 1) this.registerStep--;
    else this.view = 'login';
  }

  // ── 2FA ─────────────────────────────────────────────────
  onOtpInput(index: number, event: Event): void {
    const input  = event.target as HTMLInputElement;
    const digit  = input.value.replace(/\D/g, '').slice(-1);
    this.otpValues[index] = digit;

    if (digit && index < 5) {
      this.focusOtpBox(index + 1);
    }

    if (this.otpValues.every(v => v !== '')) {
      this.verifyOtp();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otpValues[index] && index > 0) {
      this.focusOtpBox(index - 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => { this.otpValues[i] = d; });
    if (digits.length === 6) this.verifyOtp();
    event.preventDefault();
  }

  private focusOtpBox(index: number): void {
    const inputs = this.otpInputs.toArray();
    inputs[index]?.nativeElement?.setFocus();
  }

  private async verifyOtp(): Promise<void> {
    const code = this.otpValues.join('');
    this.isLoading = true;
    try {
      const email = this.loginForm.get('email')?.value || this.registerForm.get('email')?.value;
      const { identifier: deviceId } = await Device.getId();

      await firstValueFrom(this.authService.verify2fa(email, code, deviceId));

      await Haptics.notification({ type: NotificationType.Success });
      await this.navigateToDashboard();
    } catch (err: any) {
      console.error('OTP Verification failed', err);
      this.showToast(err.error?.message || 'Invalid code. Please try again.');
      this.otpValues = ['', '', '', '', '', ''];
      this.focusOtpBox(0);
    } finally {
      this.isLoading = false;
    }
  }

  async resendCode(): Promise<void> {
    if (!this.canResend) return;
    try {
      const email = this.loginForm.get('email')?.value || this.registerForm.get('email')?.value;
      await firstValueFrom(this.authService.resendOtp(email));

      this.canResend = false;
      this.resendSeconds = 60;
      this.startResendTimer();
      this.showToast('Verification code resent!', 'success');
    } catch (err: any) {
      this.showToast('Failed to resend code.');
    }
  }

  private startResendTimer(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).pipe(take(60)).subscribe({
      next : () => { this.resendSeconds--; },
      complete: () => { this.canResend = true; },
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  get progressPercent(): number {
    return ((this.registerStep - 1) / (this.totalSteps - 1)) * 100;
  }

  get strengthBars(): { active: boolean; level: string }[] {
    return Array.from({ length: 4 }, (_, i) => ({
      active: this.passwordScore > i + 1,
      level : this.passwordScore <= 2 ? 'weak'
             : this.passwordScore <= 3 ? 'medium'
             : 'strong',
    }));
  }

  fieldError(form: FormGroup, field: string, error = 'required'): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.touched && ctrl?.hasError(error));
  }

  private navigateToDashboard(): Promise<boolean> {
    return this.router.navigate(['/tabs/home'], { replaceUrl: true });
  }

  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
