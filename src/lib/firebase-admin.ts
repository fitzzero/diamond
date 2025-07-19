import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

let app: App;

if (getApps().length === 0) {
  try {
    // Use service account key if provided
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      let serviceAccount;

      // Check if it's a JSON string or file path
      if (serviceAccountKey.trim().startsWith('{')) {
        // It's a JSON string - parse it
        serviceAccount = JSON.parse(serviceAccountKey);
        console.log('🔑 Loading service account from JSON string');
      } else if (
        serviceAccountKey.startsWith('./') ||
        serviceAccountKey.startsWith('/')
      ) {
        // It's a file path - load from file
        const path = serviceAccountKey.startsWith('./')
          ? require('path').resolve(process.cwd(), serviceAccountKey)
          : serviceAccountKey;
        serviceAccount = require(path);
        console.log('🔑 Loading service account from file:', path);
      } else {
        throw new Error(
          'Invalid service account key format. Must be JSON string or file path.'
        );
      }

      app = initializeApp({
        credential: credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin initialized with service account');
    } else {
      // Fallback to application default credentials
      app = initializeApp({
        credential: credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
export const adminApp = app;

// Collection references
export const adminCollections = {
  users: 'users',
  matches: 'matches',
  games: 'games',
} as const;
