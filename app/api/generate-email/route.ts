import { NextRequest, NextResponse } from 'next/server';
import { DOMAINS } from '@/lib/config';

/**
 * GET /api/generate-email
 * Generate a random temporary email address.
 *
 * Query params:
 *   domain  - optional, specify which domain to use (must be in DOMAINS list)
 *   prefix  - optional, custom username prefix (alphanumeric + dots + dashes)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "email": "abc123@yourdomain.com",
 *     "username": "abc123",
 *     "domain": "yourdomain.com",
 *     "expires_in": null
 *   }
 * }
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomUsername(length = 8): string {
  return Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pick domain
  let domain = searchParams.get('domain')?.toLowerCase().trim();
  if (!domain || !DOMAINS.includes(domain)) {
    domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  }

  // Pick or generate username
  let username = searchParams.get('prefix')?.toLowerCase().replace(/[^a-z0-9._-]/g, '').trim() || '';
  if (!username) {
    username = randomUsername(8);
  }

  const email = `${username}@${domain}`;

  return NextResponse.json({
    success: true,
    data: {
      email,
      username,
      domain,
      expires_in: null,
    },
  });
}
