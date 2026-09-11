import { NextResponse } from 'next/server';
import { DOMAINS } from '@/lib/config';

/**
 * GET /api/domains
 * Returns list of all available email domains.
 *
 * No authentication required.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "count": 2,
 *     "domains": [
 *       "yourdomain.com",
 *       "mail.yourdomain.com"
 *     ]
 *   }
 * }
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      count: DOMAINS.length,
      domains: DOMAINS,
    },
  });
}
