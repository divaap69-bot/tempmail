import { DOMAINS } from '@/lib/config';
import { TempMailClient } from '@/components/TempMailClient';

/**
 * Route: /[username@domain.com]
 * Contoh: https://dapmail.my.id/test@tradingview.my.id
 *
 * Otomatis pre-fill dan load inbox untuk email tersebut.
 */
export default async function EmailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  // Gabungkan slug array jadi string (misal: ['test@tradingview.my.id'])
  const raw = decodeURIComponent(slug.join('/'));

  // Validasi format email
  const emailMatch = raw.match(/^([^@]+)@([^@]+)$/);
  let initialEmail: string | undefined;

  if (emailMatch) {
    const [, username, domain] = emailMatch;
    if (DOMAINS.includes(domain.toLowerCase())) {
      initialEmail = `${username.toLowerCase()}@${domain.toLowerCase()}`;
    }
  }

  return <TempMailClient domains={DOMAINS} initialEmail={initialEmail} />;
}
