import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Simple query with Accelerate caching
    const users = await prisma.user.findMany({
      take: 1,
      cacheStrategy: {
        ttl: 30, // Cache for 30 seconds
        swr: 60, // Serve stale for 60 seconds
      },
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        userCount: users.length,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'x-response-time': `${responseTime}ms`,
          'x-accelerate-test': 'true',
        },
      }
    );
  } catch (error) {
    console.error('Accelerate test error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
