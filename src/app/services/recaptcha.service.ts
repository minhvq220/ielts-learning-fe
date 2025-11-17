import { Injectable } from '@angular/core';
import { AppConfig, validateConfig } from '../config/app.config';

/**
 * reCAPTCHA v3 Service
 * Handles reCAPTCHA token generation
 */
@Injectable({
  providedIn: 'root',
})
export class RecaptchaService {
  private grecaptcha: any = null;
  private isLoaded = false;

  constructor() {
    validateConfig();
    this.loadRecaptcha();
  }

  /**
   * Load reCAPTCHA script
   */
  private loadRecaptcha(): void {
    if (this.isLoaded) return;

    if (!AppConfig.recaptcha.siteKey) {
      console.warn('⚠️ reCAPTCHA Site Key is not set. reCAPTCHA will not work.');
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="recaptcha"]')) {
      this.grecaptcha = (window as any).grecaptcha;
      this.isLoaded = true;
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${AppConfig.recaptcha.siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.grecaptcha = (window as any).grecaptcha;
      this.isLoaded = true;
      console.log('✅ reCAPTCHA loaded successfully');
    };

    script.onerror = () => {
      console.error('❌ Error loading reCAPTCHA script');
    };

    document.head.appendChild(script);
  }

  /**
   * Execute reCAPTCHA and get token
   * @param action Action name (e.g., 'login', 'signup')
   */
  async execute(action: string = 'submit'): Promise<string> {
    if (!this.isLoaded || !this.grecaptcha) {
      throw new Error('reCAPTCHA is not loaded. Please check your configuration.');
    }

    if (!AppConfig.recaptcha.siteKey) {
      throw new Error('reCAPTCHA Site Key is not set.');
    }

    try {
      const token = await this.grecaptcha.execute(AppConfig.recaptcha.siteKey, { action });
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      throw error;
    }
  }

  /**
   * Check if reCAPTCHA is ready
   */
  isReady(): boolean {
    return this.isLoaded && !!this.grecaptcha;
  }
}

