import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string;
      discordId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    name?: string;
    discordId?: string;
    email?: string | null;
    image?: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    name?: string;
    discordId?: string;
  }
}
