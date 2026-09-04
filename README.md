# Kasbon - Debt Tracker Web App

Web aplikasi sederhana untuk melacak utang piutang pribadi, dibangun dengan Next.js App Router, Supabase, dan Tailwind CSS.

## 🚀 Live Demo

[https://kasbon-five.vercel.app](https://kasbon-five.vercel.app)

**Akun Demo Tester:**
- **Email:** `galih@mail.com`
- **Password:** `12345678`
*(Atau Anda dapat mendaftar langsung karena Email Confirmation sudah dimatikan)*

## ✨ Fitur Utama

- **Pencatatan Utang & Piutang**: Lacak utang atau piutang dengan detail.
- **Kategori**: Kelompokkan catatan ke dalam kategori spesifik.
- **Riwayat Pembayaran (History)**: Lacak jejak perubahan dan riwayat cicilan/pembayaran utang.
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

1. **Clone repository ini**
   ```bash
   git clone <repo-url>
   cd kasbon
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database (Supabase)**
   - Buat project baru di Supabase.
   - Buka SQL Editor di dashboard Supabase.
   - Jalankan semua instruksi SQL yang ada di dalam file `supabase/migrations/20260903200000_create_debts_table.sql`. Script ini akan membuat tabel, tipe data, serta *Row Level Security* (RLS) yang ketat.

4. **Environment Variables**
   - Buat file `.env.local` di root proyek.
   - Isi dengan kredensial Supabase Anda:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
     ```

5. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000`.

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

Jika saya memiliki waktu 1 hari ekstra, saya akan mengimplementasikan hal-hal berikut:
- **Server-Side Pagination & Infinite Scroll**: Saat ini seluruh catatan di-*fetch* sekaligus, yang mana kurang ideal jika data sudah mencapai ribuan baris.
- **Group Multiple Debts**: Menyediakan tampilan yang mengelompokkan total utang berdasarkan `counterpart_name` (nama orang), sehingga pengguna bisa melihat total akumulasi per orang.
- **Dark Mode**: Menyempurnakan transisi dan palet warna khusus untuk mode gelap penuh menggunakan variabel Tailwind.
- **Global Toast Notification**: Mengganti inline error/success text saat ini dengan komponen toast global (seperti `sonner` atau `react-hot-toast`) agar *feedback* lebih terlihat jelas.

## ⏱️ Time Spent

Sekitar 3 Jam. Fokus terbesar dihabiskan pada penyusunan skema database yang aman dengan RLS dan pengintegrasian validasi Zod dari form (frontend) hingga ke *route handlers* (backend).
