import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

// Helper function to get current user in server components
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

// Helper function to check if user is authenticated in server components
export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
}
