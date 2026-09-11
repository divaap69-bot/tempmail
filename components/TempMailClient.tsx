'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailListItem } from '@/lib/db';

interface TempMailClientProps {
  domains: string[];
  initialEmail?: string;
}

function randomUsername(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

export function TempMailClient({ domains, initialEmail }: TempMailClientProps) {
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState(domains[0] || '');
  const [domainOpen, setDomainOpen] = useState(false);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailListItem | null>(null);
  const [emailBody, setEmailBody] = useState<{ html: string | null; text: string | null } | null>(null);
  const [bodyLoading, setBodyLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDomainOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Pre-load inbox from URL (initialEmail prop)
  useEffect(() => {
    if (initialEmail) {
      const [u, d] = initialEmail.split('@');
      setUsername(u);
      if (domains.includes(d)) setDomain(d);
      setActiveEmail(initialEmail);
      setPage(1);
      fetchInbox(initialEmail, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  const fetchInbox = useCallback(async (address: string, pg = 1) => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox?address=${encodeURIComponent(address)}&page=${pg}`);
      const data = await res.json();
      setEmails(data.emails ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when active
  useEffect(() => {
    if (!activeEmail) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchInbox(activeEmail, page);
    }, 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeEmail, page, fetchInbox]);

  function generate() {
    const user = username.trim() || randomUsername();
    setUsername(user);
    const addr = `${user}@${domain}`;
    setActiveEmail(addr);
    setSelectedEmail(null);
    setEmailBody(null);
    setPage(1);
    fetchInbox(addr, 1);
    // Update URL supaya bisa dishare
    window.history.pushState(null, '', `/${encodeURIComponent(addr)}`);
  }

  function handleSearch() {
    const addr = searchInput.trim().toLowerCase();
    if (!addr.includes('@')) return;
    setActiveEmail(addr);
    const [u, d] = addr.split('@');
    setUsername(u);
    if (domains.includes(d)) setDomain(d);
    setSelectedEmail(null);
    setEmailBody(null);
    setPage(1);
    fetchInbox(addr, 1);
    // Update URL
    window.history.pushState(null, '', `/${encodeURIComponent(addr)}`);
  }


  function handleRefresh() {
    if (activeEmail) fetchInbox(activeEmail, page);
  }

  function handleCopy() {
    if (!activeEmail) return;
    navigator.clipboard.writeText(activeEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    setActiveEmail(null);
    setUsername('');
    setEmails([]);
    setTotal(0);
    setSelectedEmail(null);
    setEmailBody(null);
  }

  async function openEmail(item: EmailListItem) {
    setSelectedEmail(item);
    setBodyLoading(true);
    setEmailBody(null);
    try {
      const res = await fetch(`/api/emails/${item.id}`);
      const data = await res.json();
      setEmailBody({ html: data.html, text: data.text });
    } finally {
      setBodyLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="DAPmail logo"
              className="w-full h-full object-contain p-1"
            />
          </div>
          <span className="font-bold text-2xl tracking-tight">DAPmail</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/api-docs" className="text-xs text-gray-400 hover:text-white transition-colors">📡 API</a>
          <a href="/login" className="text-xs text-gray-400 hover:text-white transition-colors">Admin →</a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-4xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold mb-2">Email Sementara Gratis</h1>
          <p className="text-gray-400 text-sm">Buat email sekali pakai. Tidak perlu daftar. Langsung dapat inbox.</p>
        </div>

        {/* Generator card */}
        <div className="w-full bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 flex flex-col gap-3">
          {/* Row 1: username + domain + generate */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9._-]/gi, '').toLowerCase())}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              className="flex-1 bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors font-mono"
            />

            {/* Domain dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDomainOpen((o) => !o)}
                className="flex items-center gap-2 bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 hover:border-white/30 transition-colors whitespace-nowrap"
              >
                <span className="text-gray-500">@</span>
                <span className="font-mono">{domain}</span>
                <span className="text-gray-500 text-xs ml-1">▾</span>
              </button>
              {domainOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 min-w-[200px] bg-[#1e1e1e] border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/10 uppercase tracking-wider">
                    {domains.length} Domain · Scroll ↕
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {domains.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDomain(d); setDomainOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-white/5 transition-colors ${d === domain ? 'text-white font-semibold' : 'text-gray-300'}`}
                      >
                        @{d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generate}
              className="bg-white text-black font-semibold rounded-xl px-5 py-3 text-sm hover:bg-gray-200 transition-colors"
            >
              Generate
            </button>
          </div>

          {/* Row 2: search/paste */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#252525] border border-white/10 rounded-xl px-4 py-2.5">
              <span className="text-gray-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="paste email lengkap, misal user@domain.com"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#252525] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cek
            </button>
          </div>

          {/* Row 3: Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!activeEmail}
              className="flex-1 flex items-center justify-center gap-2 bg-[#252525] border border-white/10 rounded-xl py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? '✅ Disalin!' : '📋 Copy'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={!activeEmail || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#252525] border border-white/10 rounded-xl py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⟳ Muat...' : '↻ Refresh'}
            </button>
            <button
              onClick={handleDelete}
              disabled={!activeEmail}
              className="flex-1 flex items-center justify-center gap-2 bg-[#252525] border border-white/10 rounded-xl py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              🗑 Hapus
            </button>
          </div>

          {/* Active email display */}
          {activeEmail && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-gray-500">Email aktif:</span>
              <span className="text-sm font-mono text-green-400">{activeEmail}</span>
              <span className="text-xs text-gray-600 ml-auto">Auto-refresh 15d</span>
            </div>
          )}
        </div>

        {/* Inbox area */}
        <div className="w-full bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          {/* Inbox header */}
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium">Inbox</span>
            {activeEmail && <span className="text-xs text-gray-500">{total} pesan</span>}
          </div>

          {/* Email detail view */}
          {selectedEmail ? (
            <div className="p-5">
              <button
                onClick={() => { setSelectedEmail(null); setEmailBody(null); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
              >
                ← Kembali ke inbox
              </button>
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-1">{selectedEmail.subject}</h2>
                <div className="text-sm text-gray-400">
                  Dari: <span className="text-gray-300">{selectedEmail.from_name ? `${selectedEmail.from_name} <${selectedEmail.from_address}>` : selectedEmail.from_address}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Ke: <span className="text-gray-300">{selectedEmail.to_address}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{new Date(selectedEmail.received_at).toLocaleString('id-ID')}</div>
              </div>
              {bodyLoading ? (
                <div className="text-center py-12 text-gray-500">Memuat...</div>
              ) : emailBody?.html ? (
                <div className="bg-[#252525] rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={emailBody.html}
                    className="w-full min-h-[400px] rounded-xl"
                    sandbox="allow-same-origin"
                    title="Email content"
                  />
                </div>
              ) : (
                <pre className="bg-[#252525] rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {emailBody?.text || 'Konten kosong'}
                </pre>
              )}
            </div>
          ) : !activeEmail ? (
            /* Empty state - no email selected */
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="text-5xl opacity-20">✉️</div>
              <p className="text-gray-500 text-sm">Tidak ada inbox dipilih</p>
              <p className="text-gray-600 text-xs">Klik Generate di atas untuk memulai</p>
            </div>
          ) : loading && emails.length === 0 ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="text-3xl animate-spin">⟳</div>
              <p className="text-gray-500 text-sm">Memuat email...</p>
            </div>
          ) : emails.length === 0 ? (
            /* Empty inbox */
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="text-5xl opacity-20">📭</div>
              <p className="text-gray-400 text-sm font-medium">Inbox kosong</p>
              <p className="text-gray-600 text-xs">Email yang masuk ke <span className="font-mono text-gray-400">{activeEmail}</span> akan muncul di sini</p>
            </div>
          ) : (
            /* Email list */
            <div className="divide-y divide-white/5">
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => openEmail(email)}
                  className={`w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-start gap-3 ${!email.is_read ? 'bg-white/[0.02]' : ''}`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!email.is_read ? (
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                        {email.from_name || email.from_address}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(email.received_at)}</span>
                    </div>
                    <div className={`text-sm truncate mb-0.5 ${!email.is_read ? 'text-gray-200' : 'text-gray-400'}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-gray-600 truncate">{email.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !selectedEmail && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchInbox(activeEmail!, p); }}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">Hal {page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchInbox(activeEmail!, p); }}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">● Email Diterima</div>
            <div className="text-2xl font-bold">{total > 0 ? total.toLocaleString() : '—'}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">● Domain Aktif</div>
            <div className="text-2xl font-bold">{domains.length}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">● OTP & Verifikasi</div>
            <div className="text-2xl font-bold">Instan</div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-600 border-t border-white/5">
        Email sementara gratis · Tidak ada registrasi · Data terhapus otomatis
      </footer>
    </div>
  );
}
