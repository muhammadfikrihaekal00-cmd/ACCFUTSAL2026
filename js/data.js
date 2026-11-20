// data.js - Schema Kosong Turnamen ACC 2026 (ZERO data tetap/hardcoded!)
// Seluruh data Tim, Skuad Pemain, Jadwal Pertandingan, Klasemen, Momen, Berita, & Sponsor
// bersumber 100% dari Database Online (Supabase) agar tidak pernah bertabrakan dengan hasil input panitia.

const DEFAULT_DATA = {
  config: {
    tournamentName: 'Al-Fayyadh Champions Cup 2026',
    subTitle: "Turnamen Futsal Antar-Sekolah & Pesantren se-Sulawesi Selatan",
    edition: "ACC 2026",
    venue: "GOR Futsal Ma'had Tahfizhul Qur'an Al Fayyadh",
    pitch1Name: "Lapangan Utama",
    pitch2Name: "Lapangan 2",
    dates: "22 - 29 November 2026",
    adminPinHash: "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348",
    runningAnnouncement: "",
    contactCommittee: "0812-9876-5432 (Kak Harun - Sie. Pertandingan)",
    heroBannerImage: "assets/hero_banner.jpg",
    youtubeLiveUrl: "",
    youtubeLiveTitle: "",
    rulesText: `### A. IDENTITAS & WAKTU PELAKSANAAN
- Nama Kegiatan: Al Fayyadh Champions Cup 2026
- Slogan Resmi: "Maksimal dalam Perjuangan, Mulia dalam Persaudaraan"
- Kategori Turnamen: Kategori SD dan Kategori SMP
- Masa Pendaftaran: 19 Oktober - 17 November 2026
- Jadwal Verifikasi Berkas: Sabtu & Ahad, 14 - 15 November 2026
- Technical Meeting (TM): 19 November 2026, Pukul 16.00 WITA (Offline di Ma'had Al-Fayyadh)
- Waktu Pelaksanaan Turnamen: 22 - 29 November 2026

### B. TIMELINE & TANGGAL PENTING
- 19 Oktober - 17 November 2026: Masa pendaftaran dan penerimaan berkas peserta.
- 14 - 15 November 2026: Verifikasi berkas dipusatkan bagi seluruh perwakilan sekolah & pesantren.
- 19 November 2026 (16.00 WITA): Technical Meeting (TM) & drawing grup resmi secara offline.
- 21 November 2026: Acara Malam Pembukaan (Opening Ceremony).
- 22 - 26 November 2026: Fase Grup dan Babak 8 Besar (Perempat Final).
- 27 - 29 November 2026: Babak Semifinal, Grand Final, dan Upacara Penutupan.

### C. KETENTUAN PESERTA & VERIFIKASI
- Status Pemain: Peserta wajib berstatus siswa putra/santri aktif dari sekolah/pesantren yang sama. Dilarang keras menggunakan pemain cabutan atau alumni.
- Batas Usia: Batas usia peserta MAKSIMAL adalah 15 tahun (SMP) dan usia sekolah dasar (SD).
- Tim Medis: Setiap tim diwajibkan mendaftarkan tim kesehatan (medis) sendiri.
- Daftar Ulang Jarak Jauh: Bagi tim yang menempuh jarak kurang lebih 20 km atau lebih jauh dari lokasi, diharap hadir melakukan daftar ulang dan verifikasi berkas pada 14-15 November.
- Berkas Dokumen Wajib: 1) Formulir Daftar Susunan Pemain (DSP) resmi terisi lengkap, 2) Fotokopi Kartu Pelajar atau Rapor halaman biodata, 3) Salinan Akta Kelahiran (bukti batas usia), dan 4) Pas Foto 3x4 (2 lembar) berlatar belakang merah.
- Biaya Pendaftaran: Biaya pendaftaran Rp 250.000,- dialokasikan murni untuk kebutuhan administrasi operasional turnamen, bukan untuk hadiah pemenang.
- Ketentuan Technical Meeting (TM): Bersifat wajib dan dilaksanakan secara offline. Panitia menjelaskan Juknis, mengesahkan susunan pemain/ofisial, dan undian (drawing) grup. Tim yang tidak hadir dianggap menyetujui seluruh keputusan dan dilarang keras mengajukan protes setelah TM selesai.

### D. KETENTUAN OFISIAL TIM & ID CARD
- Kuota Pemain: Setiap tim terdiri dari minimal 8 pemain dan maksimal 12 pemain (termasuk penjaga gawang).
- ID Card Ofisial: Setiap tim mendapatkan 3 ID Card Official (1 ID Card Manajer Tim, 1 ID Card Pelatih/Asisten Pelatih, 1 ID Card Petugas Medis).
- Ketentuan Bench: Setiap perwakilan tim hanya diperkenankan memiliki maksimal 2 orang di bench (1 ofisial tim dan 1 petugas medis).
- Persyaratan Ofisial: Manajer tim (guru dari sekolah peserta) dan Asisten Pelatih wajib melampirkan surat mandat atau rekomendasi resmi dari sekolah. Untuk kategori SD dan SMP, Manajer wajib berasal dari guru/pembina sekolah.

### E. SISTEM PERTANDINGAN & WAKTU
- Sistem Kompetisi: Fase Grup (setengah kompetisi) dilanjutkan babak gugur. Peringkat 1 dan 2 dari setiap grup berhak lolos ke babak gugur.
- Sistem Poin: Menang = 3 Poin, Seri = 1 Poin, Kalah / Walk Out (WO) = 0 Poin.
- Jadwal Tanding Harian: Kategori SD dijadwalkan pagi hari (mulai 07.00 WITA). Kategori SMP bertanding setelah kategori SD selesai hingga malam hari.
- Durasi Waktu: Babak Penyisihan (Fase Grup) dimainkan 2 x 10 menit kotor. Babak Gugur dimainkan 2 x 15 menit kotor. Waktu istirahat antar babak adalah 5 menit.
- Penentuan Klasemen Grup (Tiebreaker): Jika poin seri, penentuan berurutan: 1) Head-to-Head -> 2) Selisih Gol (+) -> 3) Jumlah Gol Memasukkan -> 4) Tim dengan akumulasi kartu paling sedikit (Fair Play).
- Anti Match Fixing: Tim yang teridentifikasi melakukan pengaturan skor (match fixing) akan langsung didiskualifikasi oleh wasit dan panitia tanpa kompromi.
- Jeda Waktu Shalat Wajib: Saat azan berkumandang, seluruh pertandingan dihentikan. Seluruh peserta dan suporter wajib melaksanakan sholat berjamaah.

### F. REGULASI TEKNIS PERTANDINGAN (FIFA LAWS & KICK-IN)
- Regulasi FIFA: Kompetisi mengacu pada FIFA Futsal Laws of the Game resmi terbaru.
- Kick-off: Kick-off babak pertama atau kedua dapat diarahkan secara langsung ke segala arah lapangan dengan satu kali sentuhan.
- Pergantian Pemain: Sistem flying substitution. Pemain yang diganti harus keluar lapangan sepenuhnya melewati area tim terlebih dahulu sebelum pemain pengganti masuk (pelanggaran dikenakan kartu kuning).
- Waktu Eksekusi 4 Detik: Batas waktu eksekusi tendangan ke dalam (kick-in), tendangan pojok, dan pembersihan gawang (goal clearance) adalah 4 (empat) detik. Posisi bola saat kick-in wajib diletakkan tepat di atas garis pembatas dalam keadaan diam.
- Ketentuan Gol dari Tendangan ke Dalam (Kick-in): Jika tendangan ke dalam langsung masuk ke gawang lawan tanpa menyentuh pemain lain, maka GOL TIDAK SAH (dilanjutkan lemparan gawang oleh kiper lawan). Jika masuk langsung ke gawang sendiri, GOL TIDAK SAH (dilanjutkan sepak pojok untuk lawan). Bola wajib menyentuh pemain lain terlebih dahulu sebelum melewati garis gawang agar sah menjadi gol.
- Akumulasi Foul: Akumulasi pelanggaran ke-6 dalam satu babak dihukum dengan tendangan bebas langsung dari titik penalti kedua (jarak 10 meter).
- Timeout: 1 kali per tim setiap babak (waktu kotor terus berjalan; tidak dapat diajukan jika sisa waktu di bawah 3 menit).
- Hasil Imbang Babak Gugur: Jika berakhir seri, langsung adu penalti (3 penendang utama + 1 penendang cadangan). Jika tetap imbang, penentuan hak tendang/jaga melalui lempar koin (coin toss).
- Penjaga Gawang (Kiper): Maksimal menguasai bola 4 detik di area sendiri, dilarang menerima backpass sebelum bola menyentuh lawan, dilarang melempar bola langsung ke area pertahanan lawan kecuali dalam keadaan open play.

### G. ATURAN PAKAIAN & KETERTIBAN LINGKUNGAN PESANTREN
- Norma Kesopanan: Seluruh peserta dan pengunjung dipersilakan hadir dengan menjaga ketertiban serta norma kesopanan di lingkungan Pesantren.
- Pakaian Pemain: Pemain putra diwajibkan mengenakan pakaian olahraga yang sopan dan menutup aurat (celana training/panjang). Dilarang keras mengenakan celana pendek saat memasuki wilayah Pesantren.
- Pakaian Pengunjung & Peserta: Diwajibkan menggunakan pakaian yang menutup aurat dan tidak ketat. Dilarang keras memasuki pesantren menggunakan pakaian yang robek-robek.
- Seragam Jersey: Tim cukup menyiapkan 1 pasang seragam (jersey). Panitia menyediakan rompi cadangan jika warna jersey serupa dengan lawan.
- Perlengkapan Wajib: Pemain wajib memakai sepatu futsal dan shinguard (dekker) serta pelindung lutut bagi kiper. Dilarang keras memakai aksesoris atau menggunakan ikat rambut.

### H. SANKSI KARTU & KETERLAMBATAN (WO)
- Sanksi Keterlambatan: Terlambat 3 menit didenda 1 gol, telat 5 menit didenda 2 gol. Telat di atas 10 menit dinyatakan kalah WO (3-0). Untuk dinyatakan "hadir", tim harus memiliki minimal 3 pemain dan 1 orang ofisial di lapangan. Waktu berjalan mengikuti jadwal panitia.
- Denda Administrasi Kartu (Kategori SD): Kuning Rp 10.000, Merah Tidak Langsung Rp 15.000, Merah Langsung Rp 25.000, Kuning + Merah Langsung Rp 60.000.
- Denda Administrasi Kartu (Kategori SMP): Kuning Rp 20.000, Merah Tidak Langsung Rp 30.000, Merah Langsung Rp 50.000, Kuning + Merah Langsung Rp 60.000.
- Akumulasi Kartu: Mendapat 2 kartu kuning di pertandingan berbeda dilarang bermain pada 1 pertandingan berikutnya. Mendapat 2 kartu kuning di pertandingan yang sama berakibat kartu merah dan larangan 1 pertandingan.
- Sanksi Kartu Merah Langsung: Kartu merah langsung akibat pelanggaran berat berakibat sanksi larangan bermain pada 2 pertandingan berikutnya.
- Pemutihan Kartu: Pemutihan kartu TIDAK BERLAKU pada babak final.

### I. TATA TERTIB SUPORTER
- Pemisahan Tribun: Suporter putra maupun putri dipersilakan hadir dan diwajibkan menempati area tribun yang telah dipisahkan khusus oleh panitia.
- Syarat Mutlak Suporter/Penonton Putri: Wajib mengenakan busana muslimah yang longgar, memakai rok panjang, bermasker, serta menjaga ketertiban. Dilarang keras mengenakan pakaian ketat atau celana panjang.
- Sterilisasi Lapangan: Suporter dilarang memasuki area lapangan selama pertandingan berlangsung. Dilarang keras melempar benda apa pun (botol, koin, kertas) ke lapangan atau ke arah suporter lawan.
- Barang Terlarang: Dilarang keras membawa senjata tajam/api, minuman dalam botol kemasan keras, flare, kembang api, korek api, petasan, alat musik, maupun hewan peliharaan ke dalam area Pesantren.
- Tahapan Sanksi Pelanggaran Suporter: 1) Tahap 1: Peringatan lisan secara tegas (pelanggaran ke-1 & ke-2), 2) Tahap 2: Dikeluarkan paksa dari area GOR (pelanggaran ke-3), 3) Tahap 3: Tim yang didukung didiskualifikasi (pelanggaran berulang di pertandingan berikutnya).

### J. GANGGUAN, MEDIS, PROTES & FORCE MAJEURE
- Aturan Gangguan: Laga ditunggu maksimal 30 menit jika terjadi gangguan. Gangguan sebelum menit ke-8 babak 1 atau mulai menit ke-1 babak 2 dilanjutkan sisa waktu. Gangguan di 1 menit terakhir, skor dianggap sah (jika final seri, dilanjutkan penalti).
- Sanksi Perkelahian: Perkelahian 2 orang berakibat kartu merah langsung bagi kedua pemain. Perkelahian massal (â‰¥ 2 orang) berakibat kedua belah tim langsung didiskualifikasi.
- Prosedur Protes: Protes diajukan secara formal dan tertulis maksimal 1x24 jam pasca kejadian dengan menyetor biaya protes Rp 250.000,-. Protes tidak akan mengubah hasil pertandingan, kecuali terkait manipulasi pemain (usia) yang disertai bukti otentik.
- Force Majeure: Keadaan di luar kehendak manusia (sakit, kecelakaan, meninggal, bencana alam) harus disertai bukti tertulis dalam waktu 1 jam.
- Penanganan Medis: Untuk cedera saat bertanding, panitia HANYA bertanggung jawab pada pertolongan medis pertama (P3K dasar). Penanganan rumah sakit lanjutan ditanggung asuransi pribadi tim peserta.

### K. PENGHARGAAN DAN HADIAH RESMI
- Kategori SD:
  - Juara I: Trofi + Sertifikat + Uang Pembinaan Rp 1.500.000
  - Juara II: Sertifikat + Uang Pembinaan Rp 750.000
  - Juara III: Sertifikat + Uang Pembinaan Rp 500.000
  - Pemain Terbaik (Best Player): Rp 200.000 + Plakat
  - Top Scorer (Pencetak Gol Terbanyak): Rp 200.000 + Plakat
- Kategori SMP:
  - Juara I: Trofi + Sertifikat + Uang Pembinaan Rp 2.000.000
  - Juara II: Sertifikat + Uang Pembinaan Rp 1.000.000
  - Juara III: Sertifikat + Uang Pembinaan Rp 500.000
  - Pemain Terbaik (Best Player): Rp 250.000 + Plakat
  - Top Scorer (Pencetak Gol Terbanyak): Rp 250.000 + Plakat`
  },
  homeData: {
    mvp: null,
    news: [],
    moments: [],
    sponsors: {
      platinum: [],
      gold: [],
      media: []
    }
  },
  sponsors: {
    platinum: [
      { id: "sp_warkop", name: "WARKOP AL FAYYADH", role: "Mitra Resmi Turnamen", type: "Official Partner", icon: "☕", image: "" },
      { id: "sp_laundry", name: "AL-FAYYADH LAUNDRY", role: "Mitra Resmi Turnamen", type: "Official Partner", icon: "👕", image: "" }
    ],
    gold: [],
    media: []
  },
  moments: [],
  teams: [],
  matches: []
};

window.DEFAULT_DATA = DEFAULT_DATA;

