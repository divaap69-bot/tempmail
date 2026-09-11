import { NextRequest, NextResponse } from 'next/server';
import { getEmailById, deleteEmail } from '@/lib/db';

/**
 * GET /api/inbox/[id]  — read one email (public, but must know the ID)
 * DELETE /api/inbox/[id]?address=user@domain.com  — delete (validates ownership by address)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await getEmailById(id);
  if (!email) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json(email);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const address = new URL(request.url).searchParams.get('address')?.toLowerCase().trim();

  if (!address) {
    return NextResponse.json({ error: 'Parameter address wajib diisi' }, { status: 400 });
  }

  // Validate the email belongs to the requested address before deleting
  const email = await getEmailById(id);
  if (!email) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  if (email.to_address !== address) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  await deleteEmail(id);
  return NextResponse.json({ ok: true });
}
