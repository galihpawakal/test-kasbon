# Kasbon - Debt Tracker Web App

Web aplikasi sederhana untuk melacak utang piutang pribadi, dibangun dengan Next.js App Router, Supabase, dan Tailwind CSS.

## 🚀 Live Demo

[https://kasbon-five.vercel.app](https://kasbon-five.vercel.app)

<div style="position: relative; padding-bottom: 62.5%; height: 0;"><iframe src="https://www.loom.com/embed/eaae3a62a22747bcba6ef19befbf9a18" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

**Akun Demo Tester:**
- **Email:** `galih@mail.com`
- **Password:** `12345678`
*(Atau Anda dapat mendaftar langsung karena Email Confirmation sudah dimatikan)*

> **Catatan Penting:** Demo di atas terhubung dengan **Supabase Cloud project** (sudah jalan dan siap pakai). Sedangkan instruksi **Setup Lokal** di bawah ini menggunakan **Supabase CLI + Docker** agar Anda memiliki environment development sendiri (terisolasi) di komputer Anda.

## ✨ Fitur Utama

- **Pencatatan Utang & Piutang**: Lacak utang atau piutang dengan detail.
- **Kategori**: Kelompokkan catatan ke dalam kategori spesifik.
- **Riwayat Pembayaran (History)**: Lacak jejak perubahan dan riwayat cicilan/pembayaran utang.
- **Group Multiple Debts**: Secara otomatis mengelompokkan dan menjumlahkan total utang/piutang berdasarkan nama orang (khusus mata uang IDR).
- **Multi-Mata Uang (Currency)**: Mendukung berbagai jenis mata uang pada setiap pencatatan.
- **Kontak (WhatsApp/Telp)**: Simpan nomor telepon yang bersangkutan agar mudah dihubungi.
- **Keamanan Ketat (RLS)**: Data pengguna 100% terisolasi dan aman berkat Supabase RLS.
- **Optimistic Updates**: Interaksi UI terasa instan menggunakan SWR.

## 🛠️ Tech Stack & Library

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & `shadcn/ui` (Untuk aksesibilitas, konsistensi UI, dan efisiensi waktu)
- **Database & Auth**: Supabase (PostgreSQL, RLS ketat, Auth)
- **Data Fetching**: `swr` (Untuk kemudahan optimistic UI & caching state)
- **Forms & Validation**: `react-hook-form` & `zod`
- **Date Formatting**: `date-fns` (Untuk *relative time* dengan *locale* Indonesia)
- **Icons**: `lucide-react`

## 📦 Setup & Instalasi Lokal

### Prasyarat
- Node.js 20+
- Docker Desktop (harus running)
- Supabase CLI (`npm install -g supabase` atau lihat [docs](https://supabase.com/docs/guides/cli))

### Langkah-langkah
1. Clone repository:
   ```bash
   git clone <repo-url>
   cd kasbon
   npm install
   ```

2. Jalankan Supabase lokal (pastikan Docker Desktop sudah running):
   ```bash
   supabase start
   ```
   Perintah ini akan menjalankan seluruh container Supabase (Postgres, Auth, dll) dan otomatis menjalankan SEMUA file migration di `supabase/migrations/` secara berurutan.

3. Setelah `supabase start` selesai, copy nilai `API URL` dan `anon key` yang muncul di terminal ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi dengan nilai dari output `supabase start` (bukan project cloud).

4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000`.

5. (Opsional) Kalau ada perubahan schema baru dan ingin reset database lokal ke kondisi bersih + jalankan ulang semua migration:
   ```bash
   supabase db reset
   ```

## 🛡️ RLS Security Test (Manual)

Untuk memastikan bahwa data aman dan RLS bekerja, Anda dapat menjalankan *curl* test berikut. Ini akan mencoba menghapus data milik User A menggunakan token User B (yang akan gagal).

```bash
# Pastikan Anda mendapatkan $TOKEN_B (JWT dari User B) dan mengetahui $DEBT_ID milik User A.
curl -X DELETE "https://[SUPABASE-PROJECT-ID].supabase.co/rest/v1/debts?id=eq.$DEBT_ID" \
-H "apikey: [SUPABASE-ANON-KEY]" \
-H "Authorization: Bearer $TOKEN_B" \
-H "Prefer: return=representation"
```
*Output yang diharapkan adalah `[]` (Array kosong, tidak ada baris yang dihapus karena diblokir oleh RLS).*

## 🧠 Approach (Keputusan Teknis)

Pendekatan teknis yang paling saya banggakan pada proyek ini adalah perpaduan **Supabase RLS di level Backend** dengan **SWR Optimistic Updates di level Frontend**. Dengan mendelegasikan validasi keamanan secara mutlak ke RLS PostgreSQL (zero-trust architecture), endpoint API Next.js menjadi lebih tipis dan tangguh karena tidak perlu melakukan *double-checking* kepemilikan data. Di sisi lain, pada level UI, saya memanfaatkan *Optimistic UI* via `swr` (seperti saat menekan tombol "Tandai Lunas"). Hal ini memberikan sensasi instan bagi pengguna (*zero-latency perception*), namun jika terjadi kegagalan jaringan atau penolakan akses dari API/RLS, UI akan otomatis *rollback* ke status awal tanpa mengacaukan integritas data.

## ⚖️ Trade-offs & Future Polish

Jika saya memiliki waktu ekstra, saya akan mengimplementasikan hal-hal berikut:
- **Server-Side Pagination & Infinite Scroll**: Saat ini seluruh catatan di-*fetch* sekaligus, yang mana kurang ideal jika data sudah mencapai ribuan baris.
- **Dark Mode**: Menyempurnakan transisi dan palet warna khusus untuk mode gelap penuh menggunakan variabel Tailwind.
- **Global Toast Notification**: Mengganti inline error/success text saat ini dengan komponen toast global (seperti `sonner` atau `react-hot-toast`) agar *feedback* lebih terlihat jelas.

## ⏱️ Time Spent

Berlangsung selama **±15-20 jam kerja yang tersebar dalam 3 hari (24 commit)**. Scope pekerjaan cukup luas meliputi: 
- Setup infrastruktur (Docker + Supabase CLI).
- Penulisan 8 file migrasi database secara *idempotent* (termasuk skema tabel `debts`, `categories`, `installments`, dan `debt_history`).
- Pembuatan Trigger PL/pgSQL untuk auto-log history dan kalkulasi cicilan.
- Audit dan implementasi ketat Row Level Security (RLS) di semua tabel.
- Refactor frontend menggunakan TypeScript (Strict Mode) dan SWR untuk efek *Optimistic UI*.
- Pembuatan fitur CRUD komplit (dengan filter, search, form validasi Zod) dan desain responsif menggunakan TailwindCSS.
