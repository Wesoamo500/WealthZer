import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService, User } from '../core/services/auth.service';
import { StorageService } from '../core/services/storage.service';

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
  settings = {
    biometrics: true,
    pushNotifications: true
  };

  constructor(
    private authService: AuthService,
    private storageService: StorageService
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
          biometrics: profile.isBiometricsEnabled,
          pushNotifications: profile.pushNotificationsEnabled
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
    
    this.authService.updateProfile(updateData).subscribe({
      next: (updated) => {
        console.log('Profile updated:', updated);
      },
      error: (err) => console.error('Error updating profile:', err)
    });
  }

  logout() {
    this.authService.logout();
  }
}
