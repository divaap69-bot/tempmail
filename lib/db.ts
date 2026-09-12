/**
 * Database layer using Node.js built-in `node:sqlite` module.
 * Available in Node.js >= 22.5.0 — no installation needed!
 */
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'emails.db');

// Ensure the data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(/*turbopackIgnore: true*/ dbDir)) {
  fs.mkdirSync(/*turbopackIgnore: true*/ dbDir, { recursive: true });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Email {
  id: string;
  from_name: string | null;
  from_address: string;
  to_address: string;
  subject: string;
  html: string | null;
  text: string | null;
  raw_size: number;
  is_read: number;
  received_at: string;
}

export interface EmailListItem {
  id: string;
  from_name: string | null;
  from_address: string;
  to_address: string;
  subject: string;
  preview: string;
  is_read: number;
  received_at: string;
}

export interface EmailFilters {
  search?: string;
  to?: string;
  unread?: boolean;
  page?: number;
  limit?: number;
}

// ─── Singleton DB ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb(): Promise<any> {
  if (_db) return _db;

  // Use dynamic import so Turbopack treats it as an external module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sqlite = await import(/* webpackIgnore: true */ 'node:sqlite' as any);
  const { DatabaseSync } = sqlite;

  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id           TEXT PRIMARY KEY,
      from_name    TEXT,
      from_address TEXT NOT NULL,
      to_address   TEXT NOT NULL,
      subject      TEXT DEFAULT '(Tanpa Subjek)',
      html         TEXT,
      text         TEXT,
      raw_size     INTEGER DEFAULT 0,
      is_read      INTEGER DEFAULT 0,
      received_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_emails_to_address  ON emails(to_address);
    CREATE INDEX IF NOT EXISTS idx_emails_is_read     ON emails(is_read);
  `);

  return _db;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function insertEmail(email: Omit<Email, 'is_read'>) {
  const db = await getDb();
  db.prepare(`
    INSERT OR IGNORE INTO emails
      (id, from_name, from_address, to_address, subject, html, text, raw_size, received_at)
    VALUES
      (:id, :from_name, :from_address, :to_address, :subject, :html, :text, :raw_size, :received_at)
  `).run({
    ':id': email.id,
    ':from_name': email.from_name,
    ':from_address': email.from_address,
    ':to_address': email.to_address,
    ':subject': email.subject,
    ':html': email.html,
    ':text': email.text,
    ':raw_size': email.raw_size,
    ':received_at': email.received_at,
  });
}

export async function getEmails(
  filters: EmailFilters = {}
): Promise<{ emails: EmailListItem[]; total: number }> {
  const db = await getDb();
  const { search, to, unread, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (search) {
    conditions.push(`(subject LIKE :search OR from_address LIKE :search OR COALESCE(from_name,'') LIKE :search)`);
    params[':search'] = `%${search}%`;
  }
  if (to) {
    conditions.push(`to_address = :to`);
    params[':to'] = to;
  }
  if (unread) conditions.push(`is_read = 0`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM emails ${where}`).get(params) as { count: number };
  const total = Number(countRow?.count ?? 0);

  const rawEmails = db.prepare(
    `SELECT id, from_name, from_address, to_address, subject,
        COALESCE(text, html, '') as preview,
        is_read, received_at
     FROM emails ${where}
     ORDER BY received_at DESC
     LIMIT :limit OFFSET :offset`
  ).all({ ...params, ':limit': limit, ':offset': offset }) as (EmailListItem & { preview: string })[];

  // Strip HTML tags from preview for clean display
  const emails: EmailListItem[] = rawEmails.map((e) => ({
    ...e,
    preview: e.preview
      ? e.preview.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      : '',
  }));

  return { emails, total };
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  const db = await getDb();
  return db.prepare(`SELECT * FROM emails WHERE id = :id`).get({ ':id': id }) as Email | undefined;
}

export async function markAsRead(id: string) {
  const db = await getDb();
  db.prepare(`UPDATE emails SET is_read = 1 WHERE id = :id`).run({ ':id': id });
}

export async function deleteEmail(id: string): Promise<boolean> {
  const db = await getDb();
  const result = db.prepare(`DELETE FROM emails WHERE id = :id`).run({ ':id': id });
  return (result?.changes ?? 0) > 0;
}

export async function getDistinctToAddresses(): Promise<string[]> {
  const db = await getDb();
  const rows = db.prepare(`SELECT DISTINCT to_address FROM emails ORDER BY to_address`).all({}) as { to_address: string }[];
  return rows.map((r) => r.to_address);
}

export async function getStats(): Promise<{ total: number; unread: number }> {
  const db = await getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM emails`
  ).get({}) as { total: number; unread: number };
  return { total: Number(row?.total ?? 0), unread: Number(row?.unread ?? 0) };
}

/**
 * Hapus semua email yang lebih lama dari `hours` jam (default: 24 jam).
 * Dipanggil otomatis saat webhook menerima email baru, atau via /api/cleanup.
 */
export async function deleteOldEmails(hours = 24): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const result = db.prepare(
    `DELETE FROM emails WHERE received_at < :cutoff`
  ).run({ ':cutoff': cutoff });
  return result?.changes ?? 0;
}

