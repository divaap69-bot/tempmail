'use client';

import { useRouter } from 'next/navigation';
import { Menu, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight, MailOpen, Inbox } from 'lucide-react';
import { EmailListItem } from '@/lib/db';
import { formatEmailDate, getInitials, stringToColor, cn } from '@/lib/utils';

interface EmailListProps {
  emails: EmailListItem[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  onPageChange: (page: number) => void;
  onMenuClick: () => void;
  onRefresh: () => void;
}

export function EmailList({
  emails,
  total,
  page,
  totalPages,
  loading,
  search,
  onSearch,
  onPageChange,
  onMenuClick,
  onRefresh,
}: EmailListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onSearch(searchValue);
    }
  }

  function handleSearchClear() {
    setSearchValue('');
    onSearch('');
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
          />
          {searchValue && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title="Refresh"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 border-b border-gray-100">
        <span className="text-xs text-gray-500">
          {loading ? 'Memuat...' : `${total} email${total !== 1 ? '' : ''}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {loading && emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Memuat email...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Inbox className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Tidak ada email</p>
            <p className="text-xs mt-1 text-gray-400">
              {search ? 'Coba kata kunci lain' : 'Email masuk akan muncul di sini'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {emails.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                onClick={() => router.push(`/inbox/${email.id}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Internal subcomponent ──────────────────────────────────────────────────────

import { useState } from 'react';

function EmailRow({ email, onClick }: { email: EmailListItem; onClick: () => void }) {
  const displayName = email.from_name || email.from_address;
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(email.from_address);
  const isUnread = email.is_read === 0;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-4 py-3.5 hover:bg-blue-50/50 transition-colors group flex items-start gap-3',
          isUnread && 'bg-blue-50/30'
        )}
      >
        {/* Avatar */}
        <div className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold select-none',
          avatarColor
        )}>
          {initials || '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn(
              'text-sm truncate',
              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}>
              {displayName}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatEmailDate(email.received_at)}
            </span>
          </div>

          <p className={cn(
            'text-sm truncate',
            isUnread ? 'font-medium text-gray-800' : 'text-gray-600'
          )}>
            {email.subject}
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            {isUnread && (
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <p className="text-xs text-gray-400 truncate">{email.preview?.slice(0, 100)}</p>
          </div>
        </div>
      </button>
    </li>
  );
}
