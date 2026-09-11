import { NextRequest, NextResponse } from 'next/server';
import { getEmails } from '@/lib/db';
import { DOMAINS } from '@/lib/config';

/**
 * GET /api/emails?email=user@domain.com&page=1&limit=50
 * Fetch all emails for a given address (public, no auth required).
 *
 * Query params:
 *   email   - required, full email address (e.g. user@domain.com)
 *   page    - optional, page number (default: 1)
 *   limit   - optional, results per page (default: 50, max: 100)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "email": "user@domain.com",
 *     "total": 5,
 *     "page": 1,
 *     "limit": 50,
 *     "messages": [
 *       {
 *         "id": "...",
 *         "from": "sender@example.com",
 *         "from_name": "Sender Name",
 *         "subject": "Hello",
 *         "preview": "First 200 chars of body...",
 *         "is_read": false,
 *         "date": "2024-01-01T00:00:00Z",
 *         "size": 1234
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const email = searchParams.get('email')?.toLowerCase().trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

  // Validate email
  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Parameter "email" wajib diisi (contoh: user@domain.com)' },
      { status: 400 }
    );
  }
  if (!email.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Format email tidak valid' },
      { status: 400 }
    );
  }

  const [, domain] = email.split('@');
  if (!DOMAINS.includes(domain)) {
    return NextResponse.json(
      { success: false, error: `Domain "${domain}" tidak dikenal. Domain yang tersedia: ${DOMAINS.join(', ')}` },
      { status: 400 }
    );
  }

  const { emails, total } = await getEmails({ to: email, page, limit });

  return NextResponse.json({
    success: true,
    data: {
      email,
      total,
      page,
      limit,
      messages: emails.map((e) => ({
        id: e.id,
        from: e.from_address,
        from_name: e.from_name || null,
        subject: e.subject,
        preview: e.preview,
        is_read: e.is_read === 1,
        date: e.received_at,
        size: null, // not stored in list query
      })),
    },
  });
}
