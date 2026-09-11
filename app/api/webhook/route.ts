import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { insertEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { from, to, subject, html, text, messageId, date, size } = body;

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing required fields: from, to' }, { status: 400 });
  }

  const fromStr = String(from);
  let fromName: string | null = null;
  let fromAddress = fromStr;

  const match = fromStr.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    fromName = match[1].replace(/^"|"$/g, '').trim() || null;
    fromAddress = match[2].trim().toLowerCase();
  } else {
    fromAddress = fromStr.trim().toLowerCase();
  }

  const toAddress = String(to).trim().toLowerCase();
  const receivedAt = date ? new Date(String(date)).toISOString() : new Date().toISOString();
  const emailId = messageId ? String(messageId).replace(/[<>]/g, '') : randomUUID();

  try {
    await insertEmail({
      id: emailId,
      from_name: fromName,
      from_address: fromAddress,
      to_address: toAddress,
      subject: subject ? String(subject) : '(Tanpa Subjek)',
      html: html ? String(html) : null,
      text: text ? String(text) : null,
      raw_size: typeof size === 'number' ? size : 0,
      received_at: receivedAt,
    });
  } catch (err) {
    console.error('[webhook] DB insert error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: emailId }, { status: 201 });
}
