'use client';

import { signOut } from 'next-auth/react';
import {
  Mail, Inbox, Filter, RefreshCw, LogOut, AtSign, MailOpen, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  addresses: string[];
  stats: { total: number; unread: number };
  activeAddress: string;
  showUnread: boolean;
  onSelectAddress: (addr: string) => void;
  onToggleUnread: () => void;
  onRefresh: () => void;
}

export function Sidebar({
  addresses,
  stats,
  activeAddress,
  showUnread,
  onSelectAddress,
  onToggleUnread,
  onRefresh,
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 bg-blue-500/20 border border-blue-400/30 rounded-xl">
          <Mail className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight">Inbox</h1>
          <p className="text-xs text-slate-400">Domain Sendiri</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total</div>
        </div>
        <div className="flex-1 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.unread}</div>
          <div className="text-xs text-slate-400 mt-0.5">Belum dibaca</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {/* All emails */}
        <button
          onClick={() => onSelectAddress('')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left',
            !activeAddress && !showUnread
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-white/8 hover:text-white'
          )}
        >
          <Inbox className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Semua Email</span>
          {stats.total > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              !activeAddress && !showUnread ? 'bg-white/20' : 'bg-white/10 text-slate-400'
            )}>
              {stats.total}
            </span>
          )}
        </button>

        {/* Unread filter */}
        <button
          onClick={onToggleUnread}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left',
            showUnread
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-white/8 hover:text-white'
          )}
        >
          <MailOpen className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Belum Dibaca</span>
          {stats.unread > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              showUnread ? 'bg-white/20' : 'bg-blue-500/80 text-white'
            )}>
              {stats.unread}
            </span>
          )}
        </button>

        {/* Addresses section */}
        {addresses.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-3 pt-4 pb-1">
              <Filter className="w-3 h-3 text-slate-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Filter Alamat
              </span>
            </div>
            {addresses.map((addr) => (
              <button
                key={addr}
                onClick={() => onSelectAddress(activeAddress === addr ? '' : addr)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group',
                  activeAddress === addr
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                )}
              >
                <AtSign className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{addr}</span>
                <ChevronRight className={cn(
                  'w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
                  activeAddress === addr && 'opacity-100'
                )} />
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <button
          onClick={onRefresh}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/8 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
