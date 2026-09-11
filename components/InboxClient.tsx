'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { EmailList } from './EmailList';
import { EmailListItem } from '@/lib/db';

interface ApiResponse {
  emails: EmailListItem[];
  total: number;
  page: number;
  totalPages: number;
  addresses: string[];
  stats: { total: number; unread: number };
}

export function InboxClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const toFilter = searchParams.get('to') || '';
  const unread = searchParams.get('unread') === 'true';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (toFilter) params.set('to', toFilter);
      if (unread) params.set('unread', 'true');
      params.set('page', String(page));

      const res = await fetch(`/api/emails?${params}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [search, toFilter, unread, page, router]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmails();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // reset pagination on filter change
    router.push(`/inbox?${params}`);
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          addresses={data?.addresses ?? []}
          stats={data?.stats ?? { total: 0, unread: 0 }}
          activeAddress={toFilter}
          showUnread={unread}
          onSelectAddress={(addr) => {
            updateFilter('to', addr);
            setSidebarOpen(false);
          }}
          onToggleUnread={() => updateFilter('unread', unread ? null : 'true')}
          onRefresh={fetchEmails}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <EmailList
          emails={data?.emails ?? []}
          total={data?.total ?? 0}
          page={page}
          totalPages={data?.totalPages ?? 1}
          loading={loading}
          search={search}
          onSearch={(v) => updateFilter('search', v || null)}
          onPageChange={(p) => updateFilter('page', String(p))}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={fetchEmails}
        />
      </div>
    </div>
  );
}
