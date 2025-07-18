import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import '@/types/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
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
          const { prisma } = await import('@/lib/prisma');

          // Get the user from database using Discord ID
          const dbUser = await prisma.user.findUnique({
            where: { discordId: account.providerAccountId },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.discordId = dbUser.discordId;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.discordId = token.discordId as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Store user in database on first sign in
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

          const { prisma } = await import('@/lib/prisma');

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { discordId: account.providerAccountId },
          });

          if (!existingUser) {
            console.log('➕ Creating new user');
            // Create new user (email omitted due to PII protection)
            const newUser = await prisma.user.create({
              data: {
                discordId: account.providerAccountId,
                name: (profile as any)?.username || 'Unknown',
                image: user.image,
              },
            });
            console.log('✅ New user created:', newUser.id);
            // Don't mutate user object directly - NextAuth will handle ID mapping
          } else {
            console.log('🔄 Updating existing user:', existingUser.id);
            // Update existing user data (email omitted due to PII protection)
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: (profile as any)?.username || existingUser.name,
                image: user.image || existingUser.image,
              },
            });
            console.log('✅ User updated');
            // Don't mutate user object directly - NextAuth will handle ID mapping
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
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: false, // Disable debug to reduce log noise
};

export default auth;
