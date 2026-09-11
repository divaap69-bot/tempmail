'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Trash2, Loader2, AlertCircle, Mail, Calendar, User, AtSign,
  FileText, Code2, ExternalLink
} from 'lucide-react';
import { Email } from '@/lib/db';
import { formatFullDate, formatRelativeDate, formatFileSize, getInitials, stringToColor, cn } from '@/lib/utils';

type ViewMode = 'html' | 'text';

export function EmailDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('html');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function fetchEmail() {
      try {
        const res = await fetch(`/api/emails/${id}`);
        if (res.status === 401) { router.push('/login'); return; }
        if (res.status === 404) { setError('Email tidak ditemukan.'); return; }
        const data = await res.json();
        setEmail(data);
        // Auto-choose view: prefer html
        setViewMode(data.html ? 'html' : 'text');
      } catch {
        setError('Gagal memuat email. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [id, router]);

  // Resize iframe to fit content
  useEffect(() => {
    if (viewMode !== 'html' || !email?.html || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Write sanitized HTML into iframe
    const safeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <base target="_blank">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; color: #111; font-size: 14px; line-height: 1.6; }
          img { max-width: 100%; height: auto; }
          a { color: #2563eb; }
          table { max-width: 100%; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>${email.html}</body>
      </html>
    `;
    doc.open();
    doc.write(safeHtml);
    doc.close();

    // Auto-resize
    const resize = () => {
      if (iframe.contentDocument?.body) {
        iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
      }
    };
    iframe.onload = resize;
    setTimeout(resize, 200);
  }, [viewMode, email?.html]);

  async function handleDelete() {
    if (!confirm('Hapus email ini secara permanen?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/emails/${id}`, { method: 'DELETE' });
      router.push('/inbox');
    } catch {
      alert('Gagal menghapus email.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Memuat email...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-gray-500">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm">{error || 'Email tidak ditemukan.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Kembali ke inbox
        </button>
      </div>
    );
  }

  const displayName = email.from_name || email.from_address;
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(email.from_address);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => router.push('/inbox')}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Inbox
        </button>

        <div className="flex-1" />

        {/* View mode toggle */}
        {email.html && email.text && (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('html')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'html'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <ExternalLink className="w-3 h-3" />
              HTML
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'text'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <FileText className="w-3 h-3" />
              Plain
            </button>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Hapus
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold text-gray-900 mb-5 leading-tight">
            {email.subject}
          </h1>

          {/* Metadata card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold select-none flex-shrink-0',
                avatarColor
              )}>
                {initials || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{displayName}</div>
                <div className="text-sm text-gray-500 mt-0.5">{email.from_address}</div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <AtSign className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      <span className="text-gray-400">Kepada: </span>
                      {email.to_address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span title={formatFullDate(email.received_at)}>
                      {formatRelativeDate(email.received_at)}
                    </span>
                  </div>
                  {email.raw_size > 0 && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatFileSize(email.raw_size)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full date */}
            <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
              {formatFullDate(email.received_at)}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {viewMode === 'html' && email.html ? (
              <iframe
                ref={iframeRef}
                title="Isi email"
                sandbox="allow-same-origin"
                className="w-full min-h-96 border-0"
                style={{ display: 'block' }}
              />
            ) : email.text ? (
              <div className="p-5">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {email.text}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Code2 className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Tidak ada isi email yang tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
