import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private _isListening = new BehaviorSubject<boolean>(false);
  private _transcript = new BehaviorSubject<string>('');
  private _isAvailable = new BehaviorSubject<boolean>(false);

  // Web Speech API instance (browser only)
  private webRecognition: any = null;

  isListening$ = this._isListening.asObservable();
  transcript$ = this._transcript.asObservable();
  isAvailable$ = this._isAvailable.asObservable();

  constructor(private zone: NgZone) {
    this.checkAvailability();
  }

  private async checkAvailability() {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      // Check browser Web Speech API
      const available = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      this.zone.run(() => this._isAvailable.next(available));
    } else {
      // Check native plugin
      try {
        const { available } = await SpeechRecognition.available();
        this.zone.run(() => this._isAvailable.next(available));
      } catch {
        this.zone.run(() => this._isAvailable.next(false));
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const platform = Capacitor.getPlatform();

      if (platform === 'web') {
        // Web: browser handles permission via getUserMedia prompt
        return true;
      }

      // Native: explicitly request permission
      const { speechRecognition } = await SpeechRecognition.requestPermissions();
      return speechRecognition === 'granted';
    } catch {
      return false;
    }
  }

  async startListening(language: string = 'en-US'): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Speech recognition permission denied');
      return;
    }

    this.zone.run(() => {
      this._isListening.next(true);
      this._transcript.next('');
    });

    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      this.startWebRecognition(language);
    } else {
      this.startNativeRecognition(language);
    }
  }

  private startWebRecognition(language: string) {
    try {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        console.error('Web Speech API not supported');
        this.zone.run(() => this._isListening.next(false));
        return;
      }

      this.webRecognition = new SpeechRecognitionAPI();
      this.webRecognition.lang = language;
      this.webRecognition.interimResults = true;
      this.webRecognition.continuous = true;
      this.webRecognition.maxAlternatives = 1;

      this.webRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        this.zone.run(() => {
          if (transcript) this._transcript.next(transcript);
        });
      };

      this.webRecognition.onerror = (event: any) => {
        console.error('Web Speech Recognition error:', event.error);
        if (event.error !== 'aborted') {
          this.zone.run(() => this._isListening.next(false));
        }
      };

      this.webRecognition.onend = () => {
        // Only update if we haven't already stopped manually
        if (this._isListening.getValue()) {
          this.zone.run(() => this._isListening.next(false));
        }
      };

      this.webRecognition.start();
    } catch (error) {
      console.error('Web Speech Recognition error:', error);
      this.zone.run(() => this._isListening.next(false));
    }
  }

  private async startNativeRecognition(language: string) {
    try {
      await SpeechRecognition.addListener('partialResults', (data: any) => {
        this.zone.run(() => {
          if (data.matches && data.matches.length > 0) {
            this._transcript.next(data.matches[0]);
          }
        });
      });

      await SpeechRecognition.start({
        language,
        maxResults: 5,
        prompt: 'Speak your financial question...',
        partialResults: true,
        popup: false,
      });
    } catch (error) {
      console.error('Native speech recognition error:', error);
      this.zone.run(() => this._isListening.next(false));
    }
  }

  async stopListening(): Promise<string> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      if (this.webRecognition) {
        this.webRecognition.stop();
        this.webRecognition = null;
      }
    } else {
      try {
        await SpeechRecognition.stop();
        await SpeechRecognition.removeAllListeners();
      } catch (error) {
        console.error('Error stopping native speech recognition:', error);
      }
    }

    const transcript = this._transcript.getValue();

    this.zone.run(() => {
      this._isListening.next(false);
    });

    return transcript;
  }

  get isListening(): boolean {
    return this._isListening.getValue();
  }
}
