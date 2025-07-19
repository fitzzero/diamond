import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, collections } from '@/lib/firebase';
import { encode } from 'next-auth/jwt';

// =============================================================================
// 🔒 NETWORK SECURITY - Local Access Only
// =============================================================================

// Allowed IP ranges for authentication API access
const ALLOWED_NETWORK_RANGES = [
  // Localhost addresses
  '127.0.0.1',
  '::1',

  // Private network ranges (RFC 1918)
  '192.168.0.0/16', // 192.168.0.0 - 192.168.255.255
  '10.0.0.0/8', // 10.0.0.0 - 10.255.255.255
  '172.16.0.0/12', // 172.16.0.0 - 172.31.255.255

  // Additional development ranges
  '169.254.0.0/16', // Link-local addresses
];

/**
 * Parse CIDR notation and check if IP is in range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) {
    return ip === cidr;
  }

  const [network, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);

  const ipInt = ipToInt(ip);
  const networkInt = ipToInt(network);

  if (ipInt === null || networkInt === null) {
    return false;
  }

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

/**
 * Convert IPv4 address to integer
 */
function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let result = 0;
  for (let i = 0; i < 4; i++) {
    const part = parseInt(parts[i], 10);
    if (isNaN(part) || part < 0 || part > 255) return null;
    result = (result << 8) + part;
  }

  return result >>> 0;
}

/**
 * Get client IP address from Next.js request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (in case of proxies)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const xClientIP = request.headers.get('x-client-ip');

  // Use forwarded IP if available (take first one if multiple)
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  if (xRealIP) {
    return xRealIP.trim();
  }

  if (xClientIP) {
    return xClientIP.trim();
  }

  // Fall back to localhost if no headers available
  return '127.0.0.1';
}

/**
 * Check if IP address is allowed to access authentication API
 */
function isAllowedIP(ip: string): boolean {
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }

  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');

  // Check against all allowed ranges
  return ALLOWED_NETWORK_RANGES.some(range => isIPInCIDR(cleanIP, range));
}

/**
 * Network security check for authentication API
 */
function checkNetworkSecurity(request: NextRequest): NextResponse | null {
  const clientIP = getClientIP(request);
  const isAllowed = isAllowedIP(clientIP);

  if (!isAllowed) {
    console.warn('Authentication API access denied - external IP', {
      clientIP,
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      method: request.method,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Access denied',
        message:
          'Authentication API access is restricted to local network only',
      },
      { status: 403 }
    );
  }

  // Log allowed access for monitoring
  console.log('Authentication API access granted', {
    clientIP,
    path: request.nextUrl.pathname,
    method: request.method,
  });

  return null; // Access allowed
}

// =============================================================================
// 🔐 AUTHENTICATION API ROUTE
// =============================================================================

/**
 * Token-based authentication API route for Playwright testing
 *
 * Usage:
 * GET /api/token?role=admin&redirect=/
 * GET /api/token?role=user&redirect=/match/123
 * GET /api/token?role=tester  (defaults to home)
 */
export async function GET(request: NextRequest) {
  // 🔒 SECURITY CHECK: Only allow local network access
  const securityCheck = checkNetworkSecurity(request);
  if (securityCheck) {
    return securityCheck;
  }
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const redirect = searchParams.get('redirect') || '/';

  if (!role) {
    return NextResponse.json(
      { error: 'Role parameter is required' },
      { status: 400 }
    );
  }

  try {
    // For testing, create a simple test user based on role
    const testUserId = `test_${role}`;
    const testUser = {
      id: testUserId,
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      image: null,
      discordId: null,
    };

    // Note: In a real test environment, you would create test users in Firestore
    // For now, we'll just use the generated test user

    // Create response with test auth cookie for local development
    const response = NextResponse.redirect(new URL(redirect, request.url));

    // Set a simple test auth cookie that our useAuth hook can recognize
    response.cookies.set(
      'test-auth-user',
      JSON.stringify({
        id: testUser.id,
        email: null, // PII omitted
        name: testUser.name,
        image: testUser.image,
        username: testUser.name,
        discordId: testUser.discordId,
      }),
      {
        path: '/',
        httpOnly: false, // Allow client-side access for testing
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      }
    );

    return response;
  } catch (error) {
    console.error('Authentication API error:', error);
    return NextResponse.json(
      {
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
