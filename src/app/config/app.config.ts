/**
 * Application Configuration
 * Placeholder values - replace with actual keys from environment or config
 */
export const AppConfig = {
  firebase: {
    apiKey: 'AIzaSyCgB0iZjQ8HFcKHXYmUjgnnHgnAqyPDoeo', // TODO: Set FIREBASE_API_KEY
    authDomain: 'ielts-learning-d80dc.firebaseapp.com', // TODO: Set FIREBASE_AUTH_DOMAIN
    projectId: 'ielts-learning-d80dc', // TODO: Set FIREBASE_PROJECT_ID
    storageBucket: 'ielts-learning-d80dc.firebasestorage.app', // TODO: Set FIREBASE_STORAGE_BUCKET
    messagingSenderId: '10789317916', // TODO: Set FIREBASE_MESSAGING_SENDER_ID
    appId: '1:10789317916:web:416febc7cf9f1b0ee69ed9', // TODO: Set FIREBASE_APP_ID
  },
  google: {
    clientId: '248911999918-09lg2liv7f0t4o1av081ubtr39bqsq5q.apps.googleusercontent.com', // TODO: Set GOOGLE_CLIENT_ID
  },
  recaptcha: {
    siteKey: '6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-', // TODO: Set RECAPTCHA_SITE_KEY
  },
  api: {
    baseUrl: 'http://localhost:8081', // Backend API base URL
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

