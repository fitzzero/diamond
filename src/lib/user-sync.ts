'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminCollections } from '@/lib/firebase-admin';
import { type FirestoreUser } from '@/lib/firebase';

/**
 * Sync NextAuth user to Firestore
 * Creates or updates user document in Firestore when user signs in
 */
export async function syncUserToFirestore(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  discordId?: string | null;
}) {
  try {
    const userRef = adminDb.collection(adminCollections.users).doc(user.id);

    // Check if user already exists
    const existingUser = await userRef.get();

    const userData: Partial<FirestoreUser> = {
      name: user.name || undefined,
      image: user.image || undefined,
      discordId: user.discordId || undefined,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    if (!existingUser.exists) {
      // Create new user
      await userRef.set({
        id: user.id,
        ...userData,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Created Firestore user: ${user.id}`);
    } else {
      // Update existing user (only non-PII fields)
      await userRef.set(userData, { merge: true });

      console.log(`✅ Updated Firestore user: ${user.id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user from Firestore by ID
 */
export async function getFirestoreUser(
  userId: string
): Promise<FirestoreUser | null> {
  try {
    const userRef = adminDb.collection(adminCollections.users).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      name: data?.name || null,
      email: undefined, // PII omitted
      image: data?.image || null,
      discordId: data?.discordId || null,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting Firestore user:', error);
    return null;
  }
}

/**
 * Ensure user exists in Firestore (create if needed)
 * Call this whenever you need to guarantee a user exists in Firestore
 */
export async function ensureUserExists(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  discordId?: string | null;
}) {
  const existingUser = await getFirestoreUser(user.id);

  if (!existingUser) {
    return await syncUserToFirestore(user);
  }

  return { success: true, user: existingUser };
}
