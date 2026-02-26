import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService, User } from '../core/services/auth.service';
import { StorageService } from '../core/services/storage.service';
import { CurrencyService, SUPPORTED_CURRENCIES, CurrencyInfo } from '../core/services/currency.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  isLoading = true;
  
  // Settings & Form State
  settings = {
    biometrics: false,
    pushNotifications: false,
    aiAdvisorMode: 'Balanced',
    twoFactorEnabled: false,
    aiInsightsFrequency: 'Daily',
    preferredCurrency: 'USD'
  };

  // Modals Open State
  isPersonalDetailsOpen = false;
  isAiAdvisorOpen = false;
  isTwoFactorOpen = false;
  isInsightsOpen = false;
  isCurrencyOpen = false;

  // Temp Form Models (to hold data while modal is open before saving)
  editFullName = '';
  editAiMode = '';
  editTwoFactor = false;
  editInsightsFreq = '';
  editCurrency = 'USD';
  currencies = SUPPORTED_CURRENCIES;
  filteredCurrencies = SUPPORTED_CURRENCIES;
  searchTerm = '';

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.settings = {
          biometrics: profile.isBiometricsEnabled || false,
          pushNotifications: profile.pushNotificationsEnabled || false,
          aiAdvisorMode: profile.advisorMode || 'Balanced',
          twoFactorEnabled: profile.twoFactorEnabled || false,
          aiInsightsFrequency: profile.aiInsightsFrequency || 'Daily',
          preferredCurrency: profile.preferredCurrency || 'USD'
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.isLoading = false;
      }
    });
  }

  async updateSetting(key: string, value: any) {
    const updateData: any = {};
    if (key === 'biometrics') updateData.isBiometricsEnabled = value;
    if (key === 'pushNotifications') updateData.pushNotificationsEnabled = value;
    if (key === 'fullName') updateData.fullName = value;
    if (key === 'aiAdvisorMode') updateData.advisorMode = value;
    if (key === 'twoFactorEnabled') updateData.twoFactorEnabled = value;
    if (key === 'aiInsightsFrequency') updateData.aiInsightsFrequency = value;
    if (key === 'preferredCurrency') updateData.preferredCurrency = value;
    
    this.authService.updateProfile(updateData).subscribe({
      next: (updated) => {
        console.log('Profile updated:', updated);
      },
      error: (err) => console.error('Error updating profile:', err)
    });
  }
  openPersonalDetails() {
    this.editFullName = this.user?.fullName || '';
    this.isPersonalDetailsOpen = true;
  }

  savePersonalDetails() {
    this.updateSetting('fullName', this.editFullName);
    if (this.user) {
        this.user.fullName = this.editFullName;
    }
    this.isPersonalDetailsOpen = false;
  }

  openAiAdvisor() {
    this.editAiMode = this.settings.aiAdvisorMode;
    this.isAiAdvisorOpen = true;
  }

  saveAiAdvisor() {
    this.settings.aiAdvisorMode = this.editAiMode;
    this.updateSetting('aiAdvisorMode', this.editAiMode);
    this.isAiAdvisorOpen = false;
  }

  openTwoFactor() {
    this.editTwoFactor = this.settings.twoFactorEnabled;
    this.isTwoFactorOpen = true;
  }

  saveTwoFactor() {
    this.settings.twoFactorEnabled = this.editTwoFactor;
    this.updateSetting('twoFactorEnabled', this.editTwoFactor);
    this.isTwoFactorOpen = false;
  }

  openInsights() {
    this.editInsightsFreq = this.settings.aiInsightsFrequency;
    this.isInsightsOpen = true;
  }

  saveInsights() {
    this.settings.aiInsightsFrequency = this.editInsightsFreq;
    this.updateSetting('aiInsightsFrequency', this.editInsightsFreq);
    this.isInsightsOpen = false;
  }

  openCurrency() {
    this.editCurrency = this.settings.preferredCurrency;
    this.searchTerm = '';
    this.filteredCurrencies = SUPPORTED_CURRENCIES;
    this.isCurrencyOpen = true;
  }

  filterCurrencies() {
    const term = this.searchTerm.toLowerCase();
    this.filteredCurrencies = SUPPORTED_CURRENCIES.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.code.toLowerCase().includes(term)
    );
  }

  selectCurrency(code: string) {
    console.log('ProfilePage: Selecting currency', code);
    this.editCurrency = code;
    this.settings.preferredCurrency = code;
    this.currencyService.setCurrency(code, true);
    
    // Update user object to trigger currency service subscription
    if (this.user) {
      this.user.preferredCurrency = code;
    }
    
    this.isCurrencyOpen = false;
  }



  logout() {
    this.authService.logout();
  }
}
