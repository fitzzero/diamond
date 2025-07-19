import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase config - get from Firebase Console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with optimizations for free tier
const db =
  getApps().length === 1
    ? initializeFirestore(app, {
        // Optimize for minimal reads/writes
        experimentalForceLongPolling: false, // Use WebSocket when possible
      })
    : getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Initialize Analytics (only in browser)
let analytics: any = null;
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('🔥 Firebase Analytics initialized');
    }
  });
}

// Development emulators (if needed)
if (
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Emulator already connected, ignore
  }
  // Note: Firestore emulator connection should be done carefully to avoid conflicts
}

export { db, auth, analytics };
export default app;

// Helper to go offline/online (useful for testing)
export const goOffline = () => disableNetwork(db);
export const goOnline = () => enableNetwork(db);

// Collection references with strong typing
export const collections = {
  users: 'users',
  matches: 'matches',
  games: 'games', // subcollection under matches
} as const;

// Helper types for Firestore documents
export interface FirestoreUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  discordId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreMatch {
  id: string;
  status: 'WAITING_FOR_PLAYER' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  player1Id: string;
  player2Id?: string;
  winnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreGame {
  id: string;
  gameNumber: number;
  status:
    | 'IN_PROGRESS'
    | 'CHECKMATE'
    | 'STALEMATE'
    | 'DRAW'
    | 'RESIGNATION'
    | 'TIMEOUT';
  currentTurn: 'WHITE' | 'BLACK';
  boardState: Record<string, any>; // Map as object for Firestore
  moveHistory: any[];
  whitePlayerId: string;
  blackPlayerId: string;
  startedAt: Date;
  completedAt?: Date;
  result?: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';
}
