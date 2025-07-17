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
      if (user) {
        token.id = user.id;
        token.username = (profile as any)?.username || user.name;
        token.discordId = account?.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.discordId = token.discordId as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Store user in database on first sign in
      if (account?.provider === 'discord') {
        try {
          const { prisma } = await import('@/lib/prisma');

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { discordId: account.providerAccountId },
          });

          if (!existingUser) {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                discordId: account.providerAccountId,
                username: (profile as any)?.username || user.name || 'Unknown',
                email: user.email,
                image: user.image,
              },
            });
            user.id = newUser.id;
          } else {
            // Update existing user data
            const updatedUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                username:
                  (profile as any)?.username ||
                  user.name ||
                  existingUser.username,
                email: user.email || existingUser.email,
                image: user.image || existingUser.image,
              },
            });
            user.id = existingUser.id;
          }
        } catch (error) {
          console.error('Error handling user sign in:', error);
          return false;
        }
      }
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
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: false, // Disable debug to reduce log noise
};

export default auth;
