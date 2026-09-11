import { DOMAINS } from '@/lib/config';
import { TempMailClient } from '@/components/TempMailClient';

/**
 * Public home page — temp mail UI.
 * No authentication required.
 */
export default function Home() {
  return <TempMailClient domains={DOMAINS} />;
}
