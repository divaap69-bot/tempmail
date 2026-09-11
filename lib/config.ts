/**
 * Domains configuration
 * Tambahkan domain milikmu di sini.
 * Semua domain ini harus sudah dikonfigurasi di Cloudflare Email Routing.
 */
export const DOMAINS: string[] = (
  process.env.EMAIL_DOMAINS || 'domain.com'
).split(',').map(d => d.trim().toLowerCase());

export const DEFAULT_DOMAIN = DOMAINS[0];
