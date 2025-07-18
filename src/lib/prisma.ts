import { PrismaClient } from '@/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Completely silence Prisma's verbose logging
const createPrismaClient = () => {
  return new PrismaClient({
    // DISABLE ALL LOGGING - Prisma is way too verbose
    log: [], // Empty array = no logs at all

    // PII protection as per memory
    omit: {
      user: {
        email: true,
        emailVerified: true,
      },
    },

    // Additional options to reduce noise
    errorFormat: 'minimal', // Reduce error verbosity
  }).$extends(withAccelerate());
};

// Wrap client creation in try-catch to prevent initialization dumps
let prismaClient: ReturnType<typeof createPrismaClient>;

try {
  prismaClient = globalForPrisma.prisma ?? createPrismaClient();
} catch (error) {
  console.error(
    '❌ Prisma client initialization failed:',
    error instanceof Error ? error.message : 'Unknown error'
  );
  throw error;
}

// Custom error wrapper to prevent console dumps
const createSafeClient = (client: any) => {
  return new Proxy(client, {
    get(target, prop) {
      const originalMethod = target[prop];

      if (typeof originalMethod === 'object' && originalMethod !== null) {
        // Recursively wrap nested objects (like prisma.user, prisma.match, etc.)
        return createSafeClient(originalMethod);
      }

      if (typeof originalMethod === 'function') {
        return async (...args: any[]) => {
          try {
            return await originalMethod.apply(target, args);
          } catch (error) {
            // Log a clean, minimal error instead of Prisma's dump
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Database operation failed';
            console.error(`🚨 Prisma Error [${String(prop)}]:`, errorMessage);

            // Re-throw with clean message (no stack traces or verbose info)
            throw new Error(errorMessage);
          }
        };
      }

      return originalMethod;
    },
  });
};

export const prisma = createSafeClient(prismaClient);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient; // Store original for development
}

export default prisma;
