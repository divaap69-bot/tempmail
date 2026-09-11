import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InboxClient } from '@/components/InboxClient';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return <InboxClient />;
}
