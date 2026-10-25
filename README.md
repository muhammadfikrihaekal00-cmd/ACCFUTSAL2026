# 🏆 ACC "Al-Fayyadh Champions Cup" 2026
### Aplikasi Resmi Turnamen Futsal Antar-Sekolah & Pesantren
**Ma'had Tahfizhul Qur'an Al Fayyadh**

Aplikasi turnamen futsal modern dengan fitur **Live Score Real-Time**, **Klasemen Otomatis**, **Bagan Fase Gugur**, **Papan Top Skor**, **Rekapitulasi Disiplin & Sanksi Kartu**, **Galeri Momen Turnamen**, dan **Dukungan Sponsor**. Dilengkapi antarmuka otomatis ramah smartphone (mobile-first) dan sistem keamanan tingkat tinggi.

---

## 🛡️ Arsitektur Keamanan Tingkat Tinggi (Anti-Hacker)

Aplikasi ini dibangun dengan standar keamanan berlapis untuk menjamin keaslian skor dan mencegah manipulasi pihak luar:

1. **Row Level Security (RLS) di Database PostgreSQL Supabase**:
   - Seluruh tabel (`matches`, `teams`, `moments`, `tournament_config`) diproteksi dengan kebijakan RLS.
   - Pengunjung publik / peserta hanya memiliki hak akses **READ-ONLY (SELECT)**.
   - Akses **INSERT, UPDATE, DELETE** dilarang langsung untuk publik. Sekalipun peretas mengetahui *Anon Key* publik dan mencoba mengirim request manipulasi lewat DevTools/Console, PostgreSQL Supabase akan **langsung menolak dengan kode 403 Forbidden**.
2. **Kriptografi Salted SHA-256 (Tanpa Sandi Terbuka di GitHub)**:
   - Tidak ada sandi atau PIN polos yang tertulis di kode sumber (*zero plain-text password*).
   - Validasi PIN panitia menggunakan hash satu arah SHA-256 dengan kombinasi garam rahasia (*salt*).
3. **Proteksi Anti Brute-Force & Rate Limiting**:
   - Sistem secara otomatis mencatat percobaan login yang salah.
   - 3x salah: throttle 30 detik.
   - 5x salah berturut-turut: **Sistem mengunci otomatis selama 5 menit**.
4. **Header Keamanan HTTP Enterprise di Vercel (`vercel.json`)**:
   - **Content Security Policy (CSP)**: Mencegah serangan injeksi skrip jahat (XSS).
   - **X-Frame-Options: DENY**: Mencegah serangan pembajakan klik (*Clickjacking*).
   - **Strict-Transport-Security (HSTS)**: Mewajibkan seluruh koneksi melalui enkripsi HTTPS.
   - **X-Content-Type-Options: nosniff**: Mencegah eksploitasi tipe MIME.

---

## ⚡ Langkah 1: Hubungkan ke Supabase (Database & Real-Time)

1. Buka [https://supabase.com](https://supabase.com) dan buat proyek baru gratis.
2. Di Dashboard Supabase, buka menu **SQL Editor** di bilah kiri.
3. Buka file [`supabase-schema.sql`](supabase-schema.sql) dari repositori ini, salin seluruh kodenya, tempel ke SQL Editor Supabase, lalu klik **Run**.
4. Selesai! Seluruh tabel, kebijakan RLS, relasi, dan fungsi keamanan otomatis aktif.
5. Untuk menghubungkan aplikasi:
   - Buka menu **Project Settings** > **API** di Supabase.
   - Salin **Project URL** dan **anon / public key**.
   - Masukkan ke dalam file konfigurasi atau atur di Environment Variables Vercel.

---

## 🐙 Langkah 2: Unggah ke GitHub (Aman & Tanpa Menampilkan Sandi)

Jalankan perintah berikut di terminal/PowerShell untuk menghubungkan ke akun GitHub Anda:

```bash
# 1. Pastikan Anda berada di folder proyek
git init

# 2. Tambahkan semua file (file rahasia .env otomatis diabaikan oleh .gitignore)
git add .

# 3. Buat commit pertama
git commit -m "feat: initial release ACC 2026 with high-security Supabase & mobile UI"

# 4. Ganti 'username' dan 'nama-repo' sesuai akun GitHub Anda:
git remote add origin https://github.com/username/nama-repo.git
git branch -M main
git push -u origin main
```

---

## ▲ Langkah 3: Hosting Gratis ke Vercel

1. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **Add New...** > **Project**.
3. Pilih repositori GitHub turnamen Anda yang baru saja diunggah, lalu klik **Import**.
4. Pada bagian **Framework Preset**, pilih **Other** (karena aplikasi ini adalah Vanilla HTML/CSS/JS yang ringan & super cepat).
5. Klik **Deploy**!
6. Dalam 30 detik, tautan resmi turnamen Anda sudah online di URL seperti:
   `https://acc-futsal-2026.vercel.app`

---

## 📱 Panduan Panitia
- **Login Panitia**: Klik ikon gembok 🔒 di pojok kanan atas header.
- **Input Skor Cepat**: Di tab **Jadwal**, klik tombol `✏️ Skor` pada laga yang sedang berlangsung untuk memasukkan skor langsung, pencetak gol, dan kartu.
- **Tampilan HP**: Saat link dibuka di smartphone peserta, tampilan langsung berubah otomatis menjadi navigasi bawah ala aplikasi Android/iOS tanpa perlu menekan tombol apapun.
