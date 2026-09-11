# 📬 Email Inbox Dashboard — Domain Sendiri

Dashboard monitoring email masuk untuk domain pribadi. Dibuat dengan **Next.js 14**, **SQLite**, dan **Cloudflare Email Worker**.

## 🏗️ Arsitektur

```
Email Masuk (@domain.com)
  → Cloudflare Email Routing
    → Cloudflare Email Worker (parse + forward)
      → POST /api/webhook (Next.js)
        → SQLite Database
          → Dashboard UI (auto-refresh 30s)
```

---

## 🚀 Cara Setup & Jalankan

### 1. Clone & Install Dependencies

```bash
# Install dependencies website
npm install

# Install dependencies cloudflare worker
cd cloudflare-worker
npm install
cd ..
```

### 2. Konfigurasi Environment Variables

```bash
# Salin file contoh
cp .env.local.example .env.local
```

Edit `.env.local` dan isi nilai-nilainya:

```env
NEXTAUTH_SECRET=<generate dengan: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=password-rahasia-kamu
WEBHOOK_SECRET=<string acak panjang>
DATABASE_PATH=./data/emails.db
```

### 3. Jalankan di Mode Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dan login.

---

## ☁️ Setup Cloudflare Email Worker

### Langkah 1 — Aktifkan Email Routing di Cloudflare

1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain kamu → **Email** → **Email Routing**
3. Klik **Enable Email Routing**
4. Tambahkan DNS record yang diminta (MX records)

### Langkah 2 — Deploy Worker

```bash
cd cloudflare-worker

# Install Wrangler (jika belum)
npm install -g wrangler

# Login ke Cloudflare
wrangler login

# Edit wrangler.toml — isi WEBHOOK_URL dan WEBHOOK_SECRET
# WEBHOOK_URL = URL website + /api/webhook
# Contoh: https://inbox.domain.com/api/webhook

# Deploy worker
wrangler deploy
```

> **Penting:** `WEBHOOK_SECRET` harus sama persis dengan yang ada di `.env.local`!

### Langkah 3 — Buat Routing Rule

1. Cloudflare Dashboard → **Email Routing** → **Routing Rules**
2. Klik **Create address** atau tambah **Catch-all rule**
3. Pilih action: **Send to a Worker**
4. Pilih worker: `email-inbox-worker`
5. Simpan

Sekarang semua email ke `*@domain.com` akan masuk ke dashboard!

---

## 🌐 Deploy ke Production

### Opsi A: VPS / Server Sendiri

```bash
# Build
npm run build

# Jalankan dengan PM2
npm install -g pm2
pm2 start npm --name "email-inbox" -- start
pm2 save
```

Nginx reverse proxy ke port 3000.

### Opsi B: Vercel (Gratis)

> ⚠️ **Catatan:** Vercel tidak support SQLite di serverless karena filesystem tidak persisten.
> Gunakan VPS untuk production.

---

## 📁 Struktur Proyek

```
email-inbox/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts      # Terima email dari Cloudflare Worker
│   │   ├── emails/route.ts       # GET daftar email
│   │   └── emails/[id]/route.ts  # GET/DELETE satu email
│   ├── login/page.tsx            # Halaman login
│   ├── inbox/page.tsx            # Inbox utama
│   └── inbox/[id]/page.tsx       # Detail email
├── components/
│   ├── InboxClient.tsx           # Orchestrator inbox
│   ├── Sidebar.tsx               # Sidebar navigasi
│   ├── EmailList.tsx             # Daftar email
│   └── EmailDetailClient.tsx     # Detail + baca email
├── lib/
│   ├── db.ts                     # Database SQLite
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # Helper functions
├── cloudflare-worker/
│   ├── index.js                  # Email Worker script
│   ├── wrangler.toml             # Worker config
│   └── package.json
└── data/
    └── emails.db                 # SQLite database (auto-created)
```

---

## 🧪 Test Webhook Manual

Setelah setup, test endpoint webhook dengan curl:

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <WEBHOOK_SECRET_kamu>" \
  -d '{
    "from": "Pengirim <pengirim@gmail.com>",
    "to": "inbox@domain.com",
    "subject": "Test Email Masuk",
    "text": "Halo! Ini email percobaan.",
    "html": "<p>Halo! Ini email percobaan.</p>",
    "date": "2026-09-10T10:00:00Z",
    "size": 1024
  }'
```

Kalau berhasil, email akan langsung muncul di dashboard!

---

## 🔒 Keamanan

- Webhook dilindungi **Bearer token** — hanya Cloudflare Worker yang tahu secret-nya
- Dashboard dilindungi **password login** via NextAuth
- HTML email dirender di **sandboxed iframe** — aman dari XSS
- Database SQLite hanya bisa diakses dari server

---

## 📜 Lisensi

MIT — bebas digunakan dan dimodifikasi.
