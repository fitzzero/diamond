import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { syncUserToFirestore, getFirestoreUser } from '@/lib/user-sync';
import '@/types/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On first sign in, user data is available
      if (user && account?.provider === 'discord') {
        try {
          // Create a simple user ID from Discord ID for Firestore
          const userId = `discord_${account.providerAccountId}`;

          // Try to get user from Firestore
          const dbUser = await getFirestoreUser(userId);

          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.discordId = dbUser.discordId;
          } else {
            // User will be created during signIn callback
            token.id = userId;
            token.name = (profile as any)?.username || user.name;
            token.discordId = account.providerAccountId;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // ✅ THIS WAS MISSING! Send properties to the client
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.discordId = token.discordId as string;
      } else {
        console.error('🚨 Session callback: No token.id found');
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Store user in Firestore on first sign in
      if (account?.provider === 'discord') {
        try {
          console.log('🔐 SignIn callback - Discord OAuth');
          console.log('👤 User:', {
            id: user.id,
            email: user.email,
            image: user.image,
          });
          console.log('📋 Profile:', { username: (profile as any)?.username });
          console.log('🔗 Account:', {
            providerAccountId: account.providerAccountId,
          });

          // Create consistent user ID for Firestore
          const userId = `discord_${account.providerAccountId}`;

          // Sync user to Firestore (creates or updates)
          const syncResult = await syncUserToFirestore({
            id: userId,
            name: (profile as any)?.username || user.name || 'Unknown',
            email: null, // PII omitted
            image: user.image,
            discordId: account.providerAccountId,
          });

          if (syncResult.success) {
            console.log('✅ User synced to Firestore:', userId);
          } else {
            console.error(
              '❌ Failed to sync user to Firestore:',
              syncResult.error
            );
            return false;
          }

          console.log('🎉 SignIn callback completed successfully');
          return true;
        } catch (error) {
          console.error('❌ Error handling user sign in:', error);
          return false;
        }
      }

      console.log('✅ Non-Discord signIn callback completed');
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: false, // Disable debug to reduce log noise
});

export const authConfig = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: false, // Disable debug to reduce log noise
};

export default auth;
