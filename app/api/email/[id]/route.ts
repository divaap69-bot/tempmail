import { NextRequest, NextResponse } from 'next/server';
import { getEmailById, markAsRead, deleteEmail } from '@/lib/db';

/**
 * GET /api/email/{id}
 * Fetch a single email message by its ID (no auth required — ID is the access token).
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "from": "sender@example.com",
 *     "from_name": "Sender Name",
 *     "to": "user@domain.com",
 *     "subject": "Hello",
 *     "html": "<p>HTML body</p>",
 *     "text": "Plain text body",
 *     "size": 1234,
 *     "is_read": true,
 *     "date": "2024-01-01T00:00:00Z"
 *   }
 * }
 *
 * DELETE /api/email/{id}
 * Delete a single email by its ID (no auth required — ID is the access token).
 *
 * Response:
 * { "success": true }
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await getEmailById(id);
  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email tidak ditemukan' },
      { status: 404 }
    );
  }

  await markAsRead(id);

  return NextResponse.json({
    success: true,
    data: {
      id: email.id,
      from: email.from_address,
      from_name: email.from_name || null,
      to: email.to_address,
      subject: email.subject,
      html: email.html || null,
      text: email.text || null,
      size: email.raw_size,
      is_read: true, // just marked as read
      date: email.received_at,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteEmail(id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: 'Email tidak ditemukan' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
