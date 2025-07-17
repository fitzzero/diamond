import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      discordId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username?: string;
    discordId?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    discordId?: string;
  }
}
