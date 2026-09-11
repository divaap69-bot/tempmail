import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { DOMAINS } from '@/lib/config';

/**
 * GET /api/stats
 * Returns global statistics about this email service.
 *
 * No authentication required.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total_emails": 12345,
 *     "active_domains": 2,
 *     "domain_count": 2,
 *     "total_domains": 2,
 *     "unread_emails": 5
 *   }
 * }
 */
export async function GET() {
  const { total, unread } = await getStats();

  return NextResponse.json({
    success: true,
    data: {
      total_emails: total,
      unread_emails: unread,
      active_domains: DOMAINS.length,
      domain_count: DOMAINS.length,
      total_domains: DOMAINS.length,
    },
  });
}
