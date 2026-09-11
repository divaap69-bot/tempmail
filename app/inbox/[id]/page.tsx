import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmailDetailClient } from '@/components/EmailDetailClient';

export const dynamic = 'force-dynamic';

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  return <EmailDetailClient id={id} />;
}
