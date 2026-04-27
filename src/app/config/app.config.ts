/**
 * Application Configuration
 * 
 * ⚠️  NOTE: For production deployment, update these values before building:
 *   1. Change the default values below to your production values, OR
 *   2. Use Angular's file replacement in angular.json to replace this file
 * 
 * Configuration values:
 * - Default values below are for development (localhost)
 * - For production, update the values in this file or use file replacement
 * 
 * Example file replacement in angular.json:
 *   "fileReplacements": [
 *     {
 *       "replace": "src/app/config/app.config.ts",
 *       "with": "src/app/config/app.config.prod.ts"
 *     }
 *   ]
 */
export const AppConfig = {
  firebase: {
    apiKey: 'AIzaSyCgB0iZjQ8HFcKHXYmUjgnnHgnAqyPDoeo',
    authDomain: 'ielts-learning-d80dc.firebaseapp.com',
    projectId: 'ielts-learning-d80dc',
    storageBucket: 'ielts-learning-d80dc.firebasestorage.app',
    messagingSenderId: '10789317916',
    appId: '1:10789317916:web:416febc7cf9f1b0ee69ed9',
  },
  google: {
    clientId: '248911999918-09lg2liv7f0t4o1av081ubtr39bqsq5q.apps.googleusercontent.com',
  },
  recaptcha: {
    siteKey: '6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-',
  },
  api: {
    // Backend API base URL (scheme + host + port, no trailing slash)
    // Development: http://localhost:8081
    // Production: Update this to your production API URL (e.g., https://api.yourdomain.com)
    baseUrl: 'http://localhost:8081',
    /** Must match backend ApiConstants.API_BASE */
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

