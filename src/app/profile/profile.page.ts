// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { IonicModule } from '@ionic/angular';
// import { AuthService, User } from '../core/services/auth.service';
// import { StorageService } from '../core/services/storage.service';
// import { CurrencyService, SUPPORTED_CURRENCIES, CurrencyInfo } from '../core/services/currency.service';

// @Component({
//   selector: 'app-profile',
//   templateUrl: 'profile.page.html',
//   styleUrls: ['profile.page.scss'],
//   standalone: true,
//   imports: [IonicModule, CommonModule, FormsModule]
// })
// export class ProfilePage implements OnInit {
//   user: User | null = null;
//   isLoading = true;
  
//   // Settings & Form State
//   settings = {
//     biometrics: false,
//     pushNotifications: false,
//     aiAdvisorMode: 'Balanced',
//     twoFactorEnabled: false,
//     aiInsightsFrequency: 'Daily',
//     preferredCurrency: 'GHS'
//   };

//   // Modals Open State
//   isPersonalDetailsOpen = false;
//   isAiAdvisorOpen = false;
//   isTwoFactorOpen = false;
//   isInsightsOpen = false;
//   isCurrencyOpen = false;

//   // Temp Form Models (to hold data while modal is open before saving)
//   editFullName = '';
//   editAiMode = '';
//   editTwoFactor = false;
//   editInsightsFreq = '';
//   editCurrency = 'GHS';
//   currencies = SUPPORTED_CURRENCIES;
//   filteredCurrencies = SUPPORTED_CURRENCIES;
//   searchTerm = '';

//   constructor(
//     private authService: AuthService,
//     private storageService: StorageService,
//     public currencyService: CurrencyService
//   ) {}

//   ngOnInit() {
//     this.loadProfile();
    
//     // Subscribe to user changes to keep currency in sync
//     this.authService.currentUser.subscribe(user => {
//       if (user?.preferredCurrency) {
//         this.settings.preferredCurrency = user.preferredCurrency;
//         this.editCurrency = user.preferredCurrency;
//       }
//     });
//   }

//   loadProfile() {
//     this.isLoading = true;
//     this.authService.getProfile().subscribe({
//       next: (profile) => {
//         this.user = profile;
//         this.settings = {
//           biometrics: profile.isBiometricsEnabled || false,
//           pushNotifications: profile.pushNotificationsEnabled || false,
//           aiAdvisorMode: profile.advisorMode || 'Balanced',
//           twoFactorEnabled: profile.twoFactorEnabled || false,
//           aiInsightsFrequency: profile.aiInsightsFrequency || 'Daily',
//           preferredCurrency: profile.preferredCurrency || 'GHS'
//         };
        
//         // Update currency service with fresh profile data
//         if (profile.preferredCurrency) {
//           this.currencyService.setCurrency(profile.preferredCurrency, false);
//         }
        
//         this.isLoading = false;
//       },
//       error: (err) => {
//         console.error('Error loading profile:', err);
//         this.isLoading = false;
//       }
//     });
//   }

//   async updateSetting(key: string, value: any) {
//     const updateData: any = {};
//     if (key === 'biometrics') updateData.isBiometricsEnabled = value;
//     if (key === 'pushNotifications') updateData.pushNotificationsEnabled = value;
//     if (key === 'fullName') updateData.fullName = value;
//     if (key === 'aiAdvisorMode') updateData.advisorMode = value;
//     if (key === 'twoFactorEnabled') updateData.twoFactorEnabled = value;
//     if (key === 'aiInsightsFrequency') updateData.aiInsightsFrequency = value;
//     if (key === 'preferredCurrency') updateData.preferredCurrency = value;
    
//     this.authService.updateProfile(updateData).subscribe({
//       next: (updated) => {
//         console.log('Profile updated:', updated);
//       },
//       error: (err) => console.error('Error updating profile:', err)
//     });
//   }
//   openPersonalDetails() {
//     this.editFullName = this.user?.fullName || '';
//     this.isPersonalDetailsOpen = true;
//   }

//   savePersonalDetails() {
//     this.updateSetting('fullName', this.editFullName);
//     if (this.user) {
//         this.user.fullName = this.editFullName;
//     }
//     this.isPersonalDetailsOpen = false;
//   }

//   openAiAdvisor() {
//     this.editAiMode = this.settings.aiAdvisorMode;
//     this.isAiAdvisorOpen = true;
//   }

//   saveAiAdvisor() {
//     this.settings.aiAdvisorMode = this.editAiMode;
//     this.updateSetting('aiAdvisorMode', this.editAiMode);
//     this.isAiAdvisorOpen = false;
//   }

//   openTwoFactor() {
//     this.editTwoFactor = this.settings.twoFactorEnabled;
//     this.isTwoFactorOpen = true;
//   }

//   saveTwoFactor() {
//     this.settings.twoFactorEnabled = this.editTwoFactor;
//     this.updateSetting('twoFactorEnabled', this.editTwoFactor);
//     this.isTwoFactorOpen = false;
//   }

//   openInsights() {
//     this.editInsightsFreq = this.settings.aiInsightsFrequency;
//     this.isInsightsOpen = true;
//   }

//   saveInsights() {
//     this.settings.aiInsightsFrequency = this.editInsightsFreq;
//     this.updateSetting('aiInsightsFrequency', this.editInsightsFreq);
//     this.isInsightsOpen = false;
//   }

//   openCurrency() {
//     this.editCurrency = this.settings.preferredCurrency;
//     this.searchTerm = '';
//     this.filteredCurrencies = SUPPORTED_CURRENCIES;
//     this.isCurrencyOpen = true;
//   }

//   filterCurrencies() {
//     const term = this.searchTerm.toLowerCase();
//     this.filteredCurrencies = SUPPORTED_CURRENCIES.filter(c => 
//       c.name.toLowerCase().includes(term) || 
//       c.code.toLowerCase().includes(term)
//     );
//   }

//   selectCurrency(code: string) {
//     console.log('ProfilePage: Selecting currency', code);
//     this.editCurrency = code;
//     this.settings.preferredCurrency = code;
//     this.currencyService.setCurrency(code, true);
//     this.isCurrencyOpen = false;
//   }



//   logout() {
//     this.authService.logout();
//   }
// }
// ============================================================
// profile.page.ts — WealthZer · Page 8: Profile & Settings
// Sections: Profile Hero · Stats Strip · Account ·
//           Security · Notifications · Preferences ·
//           Support · Currency Selector · Sign Out
// ============================================================
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router }       from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  IonContent, IonModal, IonIcon,
  IonSkeletonText, AlertController, ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cardOutline, globeOutline, linkOutline,
  lockClosedOutline, fingerPrintOutline, shieldCheckmarkOutline,
  phonePortraitOutline, notificationsOutline, trendingUpOutline,
  mailOutline, moonOutline, languageOutline, chatbubbleOutline,
  documentTextOutline, starOutline, logOutOutline,
  chevronForwardOutline, createOutline, closeOutline,
  searchOutline, checkmarkOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

import { AuthService, User as AuthUser, ProfileStats as AuthProfileStats } from '../core/services/auth.service';
import { CurrencyService } from '../core/services/currency.service';

// ── Models ─────────────────────────────────────────────────
export interface UserProfile {
  firstName  : string;
  lastName   : string;
  fullName?  : string;
  email      : string;
  avatar?    : string;
  isPro      : boolean;
  proExpiresAt?: Date;
  joinedAt   : Date;
}

export interface ProfileStats {
  netWorth    : number;
  healthScore : number;
  assetCount  : number;
  txnCount    : number;
}

export interface UserPreferences {
  currency         : string;
  currencySymbol   : string;
  language         : string;
  darkMode         : boolean;
  biometrics       : boolean;
  twoFactor        : boolean;
  pushNotifications: boolean;
  budgetAlerts     : boolean;
  priceAlerts      : boolean;
  weeklyReport     : boolean;
}

export interface Currency {
  code  : string;
  name  : string;
  symbol: string;
  flag  : string;
}

interface SettingsSection {
  label: string;
  rows : SettingsRow[];
}

interface SettingsRow {
  id       : string;
  icon     : string;
  iconClass: string;
  label    : string;
  type     : 'nav' | 'toggle' | 'value';
  value?   : string;
  prefKey? : keyof UserPreferences;  // for toggle rows
  action?  : () => void;
  route?   : string;
  danger?  : boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonModal, IonIcon, IonSkeletonText,
  ],
})
export class ProfilePage implements OnInit {

  // ── State ────────────────────────────────────────────────
  isLoading          = true;
  showCurrencyModal  = false;
  currencySearch     = new FormControl('');
  filteredCurrencies : Currency[] = [];

  // ── Data ─────────────────────────────────────────────────
  profile   !: UserProfile;
  stats     !: ProfileStats;
  prefs     !: UserPreferences;

  // ── All currencies ────────────────────────────────────────
  allCurrencies: Currency[] = [
    { code:'USD', name:'US Dollar',           symbol:'$',  flag:'🇺🇸' },
    { code:'GHS', name:'Ghanaian Cedi',        symbol:'₵',  flag:'🇬🇭' },
    { code:'NGN', name:'Nigerian Naira',       symbol:'₦',  flag:'🇳🇬' },
    { code:'GBP', name:'British Pound',        symbol:'£',  flag:'🇬🇧' },
    { code:'EUR', name:'Euro',                 symbol:'€',  flag:'🇪🇺' },
    { code:'KES', name:'Kenyan Shilling',      symbol:'KSh',flag:'🇰🇪' },
    { code:'ZAR', name:'South African Rand',   symbol:'R',  flag:'🇿🇦' },
    { code:'JPY', name:'Japanese Yen',         symbol:'¥',  flag:'🇯🇵' },
    { code:'CAD', name:'Canadian Dollar',      symbol:'CA$',flag:'🇨🇦' },
    { code:'AUD', name:'Australian Dollar',    symbol:'A$', flag:'🇦🇺' },
    { code:'CHF', name:'Swiss Franc',          symbol:'Fr', flag:'🇨🇭' },
    { code:'CNY', name:'Chinese Yuan',         symbol:'¥',  flag:'🇨🇳' },
    { code:'INR', name:'Indian Rupee',         symbol:'₹',  flag:'🇮🇳' },
    { code:'BRL', name:'Brazilian Real',       symbol:'R$', flag:'🇧🇷' },
    { code:'EGP', name:'Egyptian Pound',       symbol:'E£', flag:'🇪🇬' },
    { code:'XOF', name:'West African CFA',     symbol:'CFA',flag:'🌍' },
    { code:'XAF', name:'Central African CFA',  symbol:'CFA',flag:'🌍' },
    { code:'RWF', name:'Rwandan Franc',        symbol:'FRw',flag:'🇷🇼' },
    { code:'TZS', name:'Tanzanian Shilling',   symbol:'TSh',flag:'🇹🇿' },
    { code:'UGX', name:'Ugandan Shilling',     symbol:'USh',flag:'🇺🇬' },
  ];

  // ── Settings sections ─────────────────────────────────────
  settingsSections: SettingsSection[] = [];

  get userInitials(): string {
    if (this.profile?.fullName) {
      const parts = this.profile.fullName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase();
    }
    return `${this.profile?.firstName?.[0] ?? ''}${this.profile?.lastName?.[0] ?? ''}`.toUpperCase();
  }

  private destroy$ = new Subject<void>();

  constructor(
    private router        : Router,
    private cdr           : ChangeDetectorRef,
    private alertCtrl     : AlertController,
    private actionCtrl    : ActionSheetController,
    private authService   : AuthService,
    private currencyService: CurrencyService,
  ) {
    addIcons({
      personOutline, cardOutline, globeOutline, linkOutline,
      lockClosedOutline, fingerPrintOutline, shieldCheckmarkOutline,
      phonePortraitOutline, notificationsOutline, trendingUpOutline,
      mailOutline, moonOutline, languageOutline, chatbubbleOutline,
      documentTextOutline, starOutline, logOutOutline,
      chevronForwardOutline, createOutline, closeOutline,
      searchOutline, checkmarkOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadProfile();
    this.buildSections();
    this.watchCurrencySearch();
    this.filteredCurrencies = [...this.allCurrencies];
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Load ─────────────────────────────────────────────────
  async loadProfile(): Promise<void> {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (res) => {
        const u = res.profile;
        const nameParts = (u.fullName || '').split(' ');
        
        this.profile = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          fullName: u.fullName,
          email: u.email,
          avatar: u.avatarUrl,
          isPro: u.isPro,
          proExpiresAt: u.proExpiresAt ? new Date(u.proExpiresAt) : undefined,
          joinedAt: new Date(u.createdAt)
        };

        this.stats = res.stats;

        this.prefs = {
          currency: u.preferredCurrency || 'USD',
          currencySymbol: this.allCurrencies.find(c => c.code === u.preferredCurrency)?.symbol || '$',
          language: u.language || 'English',
          darkMode: u.darkMode || false,
          biometrics: u.isBiometricsEnabled || false,
          twoFactor: false, // Map from logic if available
          pushNotifications: u.pushNotificationsEnabled || false,
          budgetAlerts: u.budgetAlerts || false,
          priceAlerts: u.priceAlerts || false,
          weeklyReport: u.weeklyReport || false,
        };

        this.applyDarkMode(this.prefs.darkMode);
        this.buildSections();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.seedMockData(); // Fallback for safety
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Settings section builder ──────────────────────────────
  private buildSections(): void {
    this.settingsSections = [
      {
        label: 'Account',
        rows: [
          { id:'personal',    icon:'person-outline',       iconClass:'si-teal',   label:'Personal Information', type:'nav',   route:'/tabs/profile/edit' },
          { id:'subscription',icon:'card-outline',         iconClass:'si-copper', label:'Subscription',         type:'value', value:'Pro' },
          { id:'currency',    icon:'globe-outline',        iconClass:'si-green',  label:'Currency',             type:'value', value:`${this.prefs.currency} · ${this.prefs.currencySymbol}`, action: () => this.openCurrencyModal() },
          { id:'connected',   icon:'link-outline',         iconClass:'si-blue',   label:'Connected Accounts',   type:'value', value:'2 linked', route:'/tabs/profile/connections' },
        ],
      },
      {
        label: 'Security',
        rows: [
          { id:'password',  icon:'lock-closed-outline',       iconClass:'si-teal',   label:'Change Password',   type:'nav',    route:'/auth/forgot-password' },
          { id:'biometrics',icon:'finger-print-outline',      iconClass:'si-copper', label:'Face ID / Touch ID',type:'toggle', prefKey:'biometrics' },
          { id:'twofa',     icon:'shield-checkmark-outline',  iconClass:'si-blue',   label:'Two-Factor Auth',   type:'toggle', prefKey:'twoFactor' },
          { id:'sessions',  icon:'phone-portrait-outline',    iconClass:'si-purple', label:'Active Sessions',   type:'value',  value:'1 device', route:'/tabs/profile/sessions' },
        ],
      },
      {
        label: 'Notifications',
        rows: [
          { id:'push',   icon:'notifications-outline', iconClass:'si-teal',   label:'Push Notifications', type:'toggle', prefKey:'pushNotifications' },
          { id:'budget', icon:'trending-up-outline',   iconClass:'si-copper', label:'Budget Alerts',      type:'toggle', prefKey:'budgetAlerts' },
          { id:'price',  icon:'trending-up-outline',   iconClass:'si-blue',   label:'Price Alerts',       type:'toggle', prefKey:'priceAlerts' },
          { id:'email',  icon:'mail-outline',          iconClass:'si-green',  label:'Weekly Email Report',type:'toggle', prefKey:'weeklyReport' },
        ],
      },
      {
        label: 'Preferences',
        rows: [
          { id:'darkmode', icon:'moon-outline',     iconClass:'si-teal',   label:'Dark Mode', type:'toggle', prefKey:'darkMode', action: () => this.toggleDarkMode() },
          { id:'language', icon:'language-outline', iconClass:'si-purple', label:'Language',  type:'value',  value:this.prefs.language, route:'/tabs/profile/language' },
        ],
      },
      {
        label: 'Support',
        rows: [
          { id:'help',    icon:'chatbubble-outline',   iconClass:'si-teal',  label:'Help & Support', type:'nav', route:'/tabs/profile/support' },
          { id:'privacy', icon:'document-text-outline',iconClass:'si-blue',  label:'Privacy Policy', type:'nav', route:'/tabs/profile/privacy' },
          { id:'rate',    icon:'star-outline',          iconClass:'si-green', label:'Rate WealthZer', type:'nav', action: () => this.rateApp() },
        ],
      },
    ];
    this.cdr.markForCheck();
  }

  // ── Toggle handler ────────────────────────────────────────
  async onToggle(row: SettingsRow): Promise<void> {
    if (!row.prefKey) return;
    await Haptics.impact({ style: ImpactStyle.Light });

    const current = this.prefs[row.prefKey] as boolean;
    const newVal = !current;
    (this.prefs as any)[row.prefKey] = newVal;

    const updateMap: any = {
      darkMode: 'darkMode',
      biometrics: 'isBiometricsEnabled',
      pushNotifications: 'pushNotificationsEnabled',
      budgetAlerts: 'budgetAlerts',
      priceAlerts: 'priceAlerts',
      weeklyReport: 'weeklyReport',
      twoFactor: 'twoFactorEnabled'
    };

    const backendKey = updateMap[row.prefKey] || row.prefKey;
    
    this.authService.updateProfile({ [backendKey]: newVal }).subscribe({
      next: () => console.log(`Persistence success: ${row.prefKey} -> ${newVal}`),
      error: (err) => console.error('Persistence failed:', err)
    });

    if (row.prefKey === 'darkMode') this.applyDarkMode(newVal);
    
    this.cdr.markForCheck();
  }

  // ── Row tap ───────────────────────────────────────────────
  async onRowTap(row: SettingsRow): Promise<void> {
    if (row.type === 'toggle') { await this.onToggle(row); return; }
    await Haptics.impact({ style: ImpactStyle.Light });
    if (row.action) { row.action(); return; }
    if (row.route)  { this.router.navigate([row.route]); }
  }

  // ── Navigation helper ─────────────────────────────────────
  async navigateTo(path: string): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate([path]);
  }

  // ── Currency modal ────────────────────────────────────────
  openCurrencyModal(): void {
    this.showCurrencyModal = true;
    this.currencySearch.setValue('');
    this.filteredCurrencies = [...this.allCurrencies];
    this.cdr.markForCheck();
  }

  closeCurrencyModal(): void {
    this.showCurrencyModal = false;
    this.cdr.markForCheck();
  }

  async selectCurrency(currency: Currency): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.prefs.currency       = currency.code;
    this.prefs.currencySymbol = currency.symbol;

    this.authService.updateProfile({ preferredCurrency: currency.code }).subscribe({
      next: () => {
        this.currencyService.setCurrency(currency.code, true);
        this.buildSections();
        this.closeCurrencyModal();
      },
      error: (err) => console.error('Currency update failed:', err)
    });
  }

  private watchCurrencySearch(): void {
    this.currencySearch.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      const query = (q ?? '').toLowerCase();
      this.filteredCurrencies = !query
        ? [...this.allCurrencies]
        : this.allCurrencies.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query)
          );
      this.cdr.markForCheck();
    });
  }

  // ── Dark mode ─────────────────────────────────────────────
  private async toggleDarkMode(): Promise<void> {
    this.prefs.darkMode = !this.prefs.darkMode;
    this.applyDarkMode(this.prefs.darkMode);
    this.cdr.markForCheck();
  }

  private applyDarkMode(dark: boolean): void {
    document.body.classList.toggle('dark', dark);
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    }
  }

  // ── Biometric enable verification ─────────────────────────
  private async verifyBiometricEnable(): Promise<void> {
    // await BiometricAuth.authenticate({ reason: 'Verify identity to enable Face ID' });
  }

  // ── Rate app ──────────────────────────────────────────────
  private async rateApp(): Promise<void> {
    // Use Capacitor Rate App plugin or open App Store URL
    // RateApp.requestReview();
  }

  // ── Sign out ──────────────────────────────────────────────
  async onSignOut(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header  : 'Sign Out',
      message : 'Are you sure you want to sign out of WealthZer?',
      buttons : [
        { text: 'Cancel', role: 'cancel' },
        {
          text   : 'Sign Out',
          role   : 'destructive',
          handler: async () => {
            await this.authService.logout();
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Helper: current value for toggle rows ─────────────────
  getPrefValue(row: SettingsRow): boolean {
    if (!row.prefKey) return false;
    return this.prefs[row.prefKey] as boolean;
  }

  trackBySection(_: number, s: SettingsSection): string { return s.label; }
  trackByRow    (_: number, r: SettingsRow)    : string { return r.id; }
  trackByCurrency(_: number, c: Currency)      : string { return c.code; }

  // ── Mock data ─────────────────────────────────────────────
  private seedMockData(): void {
    this.profile = {
      firstName: 'Kwame', lastName: 'Asante',
      email: 'kwame@example.com', isPro: true,
      joinedAt: new Date('2025-01-15'),
    };
    this.stats = { netWorth: 84250, healthScore: 78, assetCount: 6, txnCount: 142 };
    this.prefs = {
      currency: 'USD', currencySymbol: '$', language: 'English',
      darkMode: false, biometrics: true, twoFactor: true,
      pushNotifications: true, budgetAlerts: true,
      priceAlerts: false, weeklyReport: true,
    };
  }

  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}