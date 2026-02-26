import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
];

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private _currencyCode = new BehaviorSubject<string>('USD');
  private _exchangeRate = new BehaviorSubject<number>(1);
  private _rates: Record<string, number> = {};

  currencyCode$ = this._currencyCode.asObservable();
  exchangeRate$ = this._exchangeRate.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private storageService: StorageService
  ) {
    // Default fallback rates
    this._rates = {
      USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, JPY: 149.5,
      CAD: 1.36, AUD: 1.53, CHF: 0.88, CNY: 7.24, INR: 83.1,
      BRL: 4.97, ZAR: 18.5, AED: 3.67, SAR: 3.75, KES: 153,
    };

    // Initialize from stored user immediately
    this.initializeCurrency();

    // Listen for user profile changes
    this.authService.currentUser.subscribe(user => {
      console.log('CurrencyService: User loaded', user);
      if (user?.preferredCurrency && this._currencyCode.getValue() !== user.preferredCurrency) {
        console.log('CurrencyService: Setting currency from profile', user.preferredCurrency);
        this._currencyCode.next(user.preferredCurrency);
        this.updateRate();
      }
    });

    // Fetch rates on init
    this.fetchRates();
  }

  private async initializeCurrency() {
    const userJson = await this.storageService.get('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.preferredCurrency) {
        console.log('CurrencyService: Initializing with stored currency', user.preferredCurrency);
        this._currencyCode.next(user.preferredCurrency);
        this.updateRate();
      }
    }
  }

  get currencyCode(): string {
    return this._currencyCode.getValue();
  }

  get rate(): number {
    return this._exchangeRate.getValue();
  }

  fetchRates() {
    this.apiService.get<Record<string, number>>('financial/exchange-rates').subscribe(
      (rates) => {
        console.log('CurrencyService: Rates fetched successfully', rates);
        this._rates = { ...this._rates, ...rates };
        this.updateRate();
      },
      (err) => console.error('CurrencyService: Error fetching exchange rates:', err)
    );
  }

  setCurrency(code: string, persist: boolean = true) {
    console.log('CurrencyService: Setting currency to', code);
    this._currencyCode.next(code);
    this.updateRate();

    if (persist) {
      this.authService.updateProfile({ preferredCurrency: code }).subscribe({
        next: (res) => console.log('CurrencyService: Profile updated with currency', code),
        error: (err) => console.error('CurrencyService: Error updating profile with currency', err)
      });
    }
  }

  convert(amountInUSD: number): number {
    return amountInUSD * this._exchangeRate.getValue();
  }

  private updateRate() {
    const code = this._currencyCode.getValue();
    console.log('CurrencyService: Updating rate for', code, 'Available rates:', !!this._rates[code]);
    if (this._rates[code]) {
      this._exchangeRate.next(this._rates[code]);
    } else if (code === 'USD') {
      this._exchangeRate.next(1);
    }
  }

  getCurrencyInfo(code?: string): CurrencyInfo {
    const target = code || this.currencyCode;
    return SUPPORTED_CURRENCIES.find(c => c.code === target) || SUPPORTED_CURRENCIES[0];
  }
}
