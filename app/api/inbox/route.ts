import { NextRequest, NextResponse } from 'next/server';
import { getEmails } from '@/lib/db';

/**
 * GET /api/inbox?address=user@domain.com&page=1
 * Public endpoint — returns emails for a specific address (no auth).
 * Rate-limited by address specificity (must provide full address).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.toLowerCase().trim();
  const page = parseInt(searchParams.get('page') || '1');

  if (!address || !address.includes('@')) {
    return NextResponse.json({ error: 'Parameter address wajib diisi (contoh: user@domain.com)' }, { status: 400 });
  }

  const { emails, total } = await getEmails({ to: address, page, limit: 50 });

  return NextResponse.json({ emails, total, address });
}
