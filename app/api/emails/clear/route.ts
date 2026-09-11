import { NextRequest, NextResponse } from 'next/server';
import { getEmails, deleteEmail, getEmailById } from '@/lib/db';
import { DOMAINS } from '@/lib/config';

/**
 * DELETE /api/emails/clear?email=user@domain.com
 * Delete ALL emails for a given address.
 *
 * Query params:
 *   email - required, full email address
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "email": "user@domain.com",
 *     "deleted_count": 5
 *   }
 * }
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Parameter "email" wajib diisi' },
      { status: 400 }
    );
  }

  const [, domain] = email.split('@');
  if (!DOMAINS.includes(domain)) {
    return NextResponse.json(
      { success: false, error: `Domain "${domain}" tidak dikenal` },
      { status: 400 }
    );
  }

  // Get all emails for this address and delete them
  const { emails } = await getEmails({ to: email, limit: 1000 });
  let deleted_count = 0;
  for (const e of emails) {
    const ok = await deleteEmail(e.id);
    if (ok) deleted_count++;
  }

  return NextResponse.json({
    success: true,
    data: {
      email,
      deleted_count,
    },
  });
}

/**
 * Also allow GET to check count before clearing (optional convenience endpoint)
 * GET /api/emails/clear?email=user@domain.com  →  returns count only, doesn't delete
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Parameter "email" wajib diisi' },
      { status: 400 }
    );
  }

  const { total } = await getEmails({ to: email, limit: 1 });

  return NextResponse.json({
    success: true,
    data: { email, count: total },
  });
}
