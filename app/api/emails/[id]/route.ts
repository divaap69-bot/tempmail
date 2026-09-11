import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmailById, markAsRead, deleteEmail } from '@/lib/db';

// Next.js 15+ route handlers receive params as a Promise
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public access — email ID (UUID) acts as the access token.
  // No auth required; anyone with the ID can read the email.
  const { id } = await params;
  const email = await getEmailById(id);
  if (!email) {
    return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 404 });
  }

  await markAsRead(id);
  return NextResponse.json(email);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteEmail(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
