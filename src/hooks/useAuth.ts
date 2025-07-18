'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const [testUser, setTestUser] = useState(null);

  // Check for test auth cookie in development
  useEffect(() => {
    if (typeof window !== 'undefined' && status !== 'authenticated') {
      const testAuthCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('test-auth-user='));

      if (testAuthCookie) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(testAuthCookie.split('=')[1])
          );
          setTestUser(userData);
        } catch (error) {
          console.error('Error parsing test auth cookie:', error);
        }
      }
    }
  }, [status]);

  // Use test user if available and no NextAuth session
  const user = session?.user || testUser;
  const isAuthenticated = status === 'authenticated' || !!testUser;
  const isLoading = status === 'loading' && !testUser;

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut: () => {
      // Clear test cookie on sign out
      if (testUser) {
        document.cookie =
          'test-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setTestUser(null);
      }
      signOut();
    },
  };
}
