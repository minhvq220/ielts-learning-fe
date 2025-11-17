import { Injectable, signal } from '@angular/core';
import { AppConfig, validateConfig } from '../config/app.config';

/**
 * Firebase Service
 * Handles Firebase initialization and authentication
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firebaseApp: any = null;
  private auth: any = null;
  private googleProvider: any = null;
  private isInitialized = signal(false);

  constructor() {
    validateConfig();
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase
   */
  private async initializeFirebase(): Promise<void> {
    try {
      // Dynamic import Firebase modules
      // Using type assertion to help TypeScript resolve the modules
      const firebaseApp = await import('firebase/app');
      const firebaseAuth = await import('firebase/auth');
      
      const { initializeApp } = firebaseApp;
      const { getAuth, GoogleAuthProvider } = firebaseAuth;

      // Check if config is set
      if (!AppConfig.firebase.apiKey) {
        console.warn('⚠️ Firebase API Key is not set. Firebase authentication will not work.');
        return;
      }

      // Initialize Firebase
      this.firebaseApp = initializeApp(AppConfig.firebase);
      this.auth = getAuth(this.firebaseApp);
      this.googleProvider = new GoogleAuthProvider();

      this.isInitialized.set(true);
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
    }
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth(): any {
    if (!this.isInitialized()) {
      console.warn('⚠️ Firebase is not initialized yet');
      return null;
    }
    return this.auth;
  }

  /**
   * Get Google Auth Provider
   */
  getGoogleProvider(): any {
    return this.googleProvider;
  }

  /**
   * Check if Firebase is initialized
   */
  isReady(): boolean {
    return this.isInitialized();
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error('Firebase is not initialized. Please check your configuration.');
    }

    try {
      const firebaseAuth = await import('firebase/auth');
      const { signInWithPopup } = firebaseAuth;
      const result = await signInWithPopup(this.auth, this.googleProvider);
      return result;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    if (!this.auth) return null;
    return this.auth.currentUser;
  }

  /**
   * Get ID Token
   */
  async getIdToken(): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.auth) return;

    try {
      const firebaseAuth = await import('firebase/auth');
      const { signOut: firebaseSignOut } = firebaseAuth;
      await firebaseSignOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}

