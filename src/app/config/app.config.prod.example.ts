/**
 * Production Configuration Example
 * 
 * This is an example file showing how to configure for production.
 * 
 * To use this for production builds:
 * 1. Copy this file to app.config.prod.ts
 * 2. Update the values with your production configuration
 * 3. Configure file replacement in angular.json production build configuration
 * 
 * Example angular.json configuration:
 *   "configurations": {
 *     "production": {
 *       "fileReplacements": [
 *         {
 *           "replace": "src/app/config/app.config.ts",
 *           "with": "src/app/config/app.config.prod.ts"
 *         }
 *       ]
 *     }
 *   }
 */
export const AppConfig = {
  firebase: {
    apiKey: 'YOUR_PRODUCTION_FIREBASE_API_KEY',
    authDomain: 'YOUR_PRODUCTION_FIREBASE_AUTH_DOMAIN',
    projectId: 'YOUR_PRODUCTION_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_PRODUCTION_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_PRODUCTION_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'YOUR_PRODUCTION_FIREBASE_APP_ID',
  },
  google: {
    clientId: 'YOUR_PRODUCTION_GOOGLE_CLIENT_ID',
  },
  recaptcha: {
    siteKey: 'YOUR_PRODUCTION_RECAPTCHA_SITE_KEY',
  },
  api: {
    // Production API base URL
    baseUrl: 'https://api.your-production-domain.com',
    apiBasePath: '/essayrater/api',
  },
};

/**
 * Validate configuration on app startup
 */
export function validateConfig(): void {
  const missing: string[] = [];

  if (!AppConfig.firebase.apiKey) missing.push('FIREBASE_API_KEY');
  if (!AppConfig.firebase.authDomain) missing.push('FIREBASE_AUTH_DOMAIN');
  if (!AppConfig.firebase.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!AppConfig.firebase.storageBucket) missing.push('FIREBASE_STORAGE_BUCKET');
  if (!AppConfig.firebase.messagingSenderId) missing.push('FIREBASE_MESSAGING_SENDER_ID');
  if (!AppConfig.firebase.appId) missing.push('FIREBASE_APP_ID');
  if (!AppConfig.google.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!AppConfig.recaptcha.siteKey) missing.push('RECAPTCHA_SITE_KEY');

  if (missing.length > 0) {
    console.warn('⚠️ Missing configuration keys:', missing.join(', '));
    console.warn('Please set these values in app.config.ts or environment variables');
  }
}

