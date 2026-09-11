import { DOMAINS } from '@/lib/config';

interface EndpointParam {
  name: string;
  required: boolean;
  desc: string;
  inPath?: boolean;
}

export default function ApiDocsPage() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';


  const endpoints: { method: string; path: string; color: string; label: string; description: string; params: EndpointParam[]; response: string; example: string }[] = [

    {
      method: 'GET',
      path: '/api/generate-email',
      color: 'green',
      label: 'Generate Email',
      description: 'Generate alamat email sementara secara acak.',
      params: [
        { name: 'domain', required: false, desc: `Domain yang digunakan (default: acak). Pilihan: ${DOMAINS.join(', ')}` },
        { name: 'prefix', required: false, desc: 'Username kustom (huruf kecil, angka, titik, dan strip saja)' },
      ],
      response: JSON.stringify({
        success: true,
        data: {
          email: `abc123@${DOMAINS[0]}`,
          username: 'abc123',
          domain: DOMAINS[0],
          expires_in: null,
        },
      }, null, 2),
      example: `${base}/api/generate-email?domain=${DOMAINS[0]}`,
    },
    {
      method: 'GET',
      path: '/api/emails',
      color: 'green',
      label: 'Daftar Inbox',
      description: 'Ambil semua email yang masuk ke alamat tertentu.',
      params: [
        { name: 'email', required: true, desc: `Alamat email lengkap (contoh: user@${DOMAINS[0]})` },
        { name: 'page', required: false, desc: 'Halaman (default: 1)' },
        { name: 'limit', required: false, desc: 'Jumlah per halaman (default: 50, max: 100)' },
      ],
      response: JSON.stringify({
        success: true,
        data: {
          email: `user@${DOMAINS[0]}`,
          total: 2,
          page: 1,
          limit: 50,
          messages: [
            {
              id: 'uuid-here',
              from: 'sender@example.com',
              from_name: 'Sender Name',
              subject: 'Contoh Email',
              preview: 'Ini adalah isi email...',
              is_read: false,
              date: '2024-01-01T10:00:00Z',
              size: null,
            },
          ],
        },
      }, null, 2),
      example: `${base}/api/emails?email=user@${DOMAINS[0]}`,
    },
    {
      method: 'GET',
      path: '/api/email/{id}',
      color: 'green',
      label: 'Detail Email',
      description: 'Ambil isi lengkap satu email berdasarkan ID-nya.',
      params: [
        { name: 'id', required: true, desc: 'ID email (dari field "id" di daftar inbox)', inPath: true },
      ],
      response: JSON.stringify({
        success: true,
        data: {
          id: 'uuid-here',
          from: 'sender@example.com',
          from_name: 'Sender Name',
          to: `user@${DOMAINS[0]}`,
          subject: 'Contoh Email',
          html: '<p>Isi HTML email</p>',
          text: 'Isi teks email',
          size: 1234,
          is_read: true,
          date: '2024-01-01T10:00:00Z',
        },
      }, null, 2),
      example: `${base}/api/email/EMAIL_ID_DISINI`,
    },
    {
      method: 'DELETE',
      path: '/api/email/{id}',
      color: 'red',
      label: 'Hapus Email',
      description: 'Hapus satu email berdasarkan ID-nya.',
      params: [
        { name: 'id', required: true, desc: 'ID email', inPath: true },
      ],
      response: JSON.stringify({ success: true }, null, 2),
      example: `curl -X DELETE ${base}/api/email/EMAIL_ID_DISINI`,
    },
    {
      method: 'DELETE',
      path: '/api/emails/clear',
      color: 'red',
      label: 'Hapus Semua',
      description: 'Hapus semua email untuk satu alamat sekaligus.',
      params: [
        { name: 'email', required: true, desc: 'Alamat email yang ingin dibersihkan' },
      ],
      response: JSON.stringify({
        success: true,
        data: { email: `user@${DOMAINS[0]}`, deleted_count: 5 },
      }, null, 2),
      example: `curl -X DELETE "${base}/api/emails/clear?email=user@${DOMAINS[0]}"`,
    },
    {
      method: 'GET',
      path: '/api/domains',
      color: 'green',
      label: 'Daftar Domain',
      description: 'Ambil semua domain yang tersedia di layanan ini.',
      params: [],
      response: JSON.stringify({
        success: true,
        data: { count: DOMAINS.length, domains: DOMAINS },
      }, null, 2),
      example: `${base}/api/domains`,
    },
    {
      method: 'GET',
      path: '/api/stats',
      color: 'green',
      label: 'Statistik',
      description: 'Statistik global layanan (total email, domain aktif, dsb.).',
      params: [],
      response: JSON.stringify({
        success: true,
        data: {
          total_emails: 12345,
          unread_emails: 100,
          active_domains: DOMAINS.length,
          domain_count: DOMAINS.length,
          total_domains: DOMAINS.length,
        },
      }, null, 2),
      example: `${base}/api/stats`,
    },
  ];

  const methodColor: Record<string, string> = {
    green: 'bg-green-500/20 text-green-400 border border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Kembali ke Inbox</a>
            <h1 className="text-2xl font-bold mt-2">📡 Dokumentasi API</h1>
            <p className="text-gray-400 text-sm mt-1">
              Integrasikan email sementara ke aplikasi atau skrip otomatisasimu.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Base URL */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Base URL</h2>
          <code className="text-green-400 font-mono text-sm">{base}</code>
          <p className="text-xs text-gray-500 mt-2">
            Semua endpoint bersifat publik — tidak perlu autentikasi atau API key. Respons selalu dalam format JSON.
          </p>
        </div>

        {/* Response format */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Format Respons</h2>
          <p className="text-sm text-gray-400 mb-3">Semua respons mengikuti format standar berikut:</p>
          <pre className="bg-[#0d0d0d] rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">{`// Sukses
{ "success": true, "data": { ... } }

// Gagal
{ "success": false, "error": "Pesan error" }`}</pre>
        </div>

        {/* Endpoints */}
        <h2 className="text-lg font-semibold mt-8">Endpoint</h2>

        {endpoints.map((ep, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Endpoint header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${methodColor[ep.color]}`}>
                {ep.method}
              </span>
              <code className="font-mono text-sm text-white">{ep.path}</code>
              <span className="ml-auto text-sm text-gray-400">{ep.label}</span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">{ep.description}</p>

              {/* Params */}
              {ep.params.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parameter</h3>
                  <div className="rounded-xl overflow-hidden border border-white/5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Nama</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Wajib</th>
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ep.params.map((p, j) => (
                          <tr key={j}>
                            <td className="px-4 py-2.5">
                              <code className="font-mono text-yellow-300 text-xs">{p.name}</code>
                              {p.inPath && <span className="ml-1 text-xs text-gray-600">(path)</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              {p.required
                                ? <span className="text-red-400 text-xs font-medium">Ya</span>
                                : <span className="text-gray-600 text-xs">Tidak</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Example */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contoh Request</h3>
                <pre className="bg-[#0d0d0d] rounded-xl p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">{ep.example}</pre>
              </div>

              {/* Response */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contoh Respons</h3>
                <pre className="bg-[#0d0d0d] rounded-xl p-3 text-xs font-mono text-gray-300 overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          </div>
        ))}

        {/* Usage example */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contoh Penggunaan (JavaScript)</h2>
          <pre className="bg-[#0d0d0d] rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto">{`// 1. Generate email sementara
const { data } = await fetch('${base}/api/generate-email').then(r => r.json());
const email = data.email;
console.log('Email kamu:', email);

// 2. Tunggu email masuk, lalu cek inbox
const checkInbox = async () => {
  const res = await fetch(\`${base}/api/emails?email=\${email}\`);
  const { data } = await res.json();
  return data.messages;
};

// 3. Baca isi email
const readEmail = async (id) => {
  const res = await fetch(\`${base}/api/email/\${id}\`);
  const { data } = await res.json();
  return data;
};

// 4. Hapus inbox setelah selesai
await fetch(\`${base}/api/emails/clear?email=\${email}\`, { method: 'DELETE' });`}</pre>
        </div>

        {/* Rate limit note */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-200">
          <strong>⚠️ Catatan:</strong> API ini ditujukan untuk penggunaan wajar. Jangan lakukan polling lebih dari sekali per 5 detik. Tidak ada API key yang diperlukan, namun penyalahgunaan dapat menyebabkan pemblokiran IP.
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-600 border-t border-white/5 mt-10">
        API Email Sementara · DAPmail · Tidak ada registrasi · Gratis
      </footer>
    </div>
  );
}
