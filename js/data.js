// data.js - Initial Default Tournament Data (32 Teams: 16 SMP + 16 SD)
const DEFAULT_DATA = {
  config: {
    tournamentName: 'ACC "Al-Fayyadh Champions Cup" 2026',
    subTitle: "Turnamen Futsal Antar-Sekolah & Pesantren â€¢ Ma'had Tahfizhul Qur'an Al Fayyadh",
    edition: "ACC Edisi 2026",
    venue: "GOR Futsal Ma'had Tahfizhul Qur'an Al Fayyadh",
    pitch1Name: "Lapangan Utama (Vinyl)",
    pitch2Name: "Lapangan Utama (Vinyl)",
    dates: "15 - 20 November 2026",
    adminPinHash: "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348",
    runningAnnouncement: "ðŸ† Selamat Datang di ACC 'Al-Fayyadh Champions Cup' 2026 Ma'had Tahfizhul Qur'an Al Fayyadh! Total 32 Tim (16 SMP & 16 SD). Junjung tinggi sportivitas, ukhuwah Islamiyah, dan fair play. Registrasi line-up maksimal 30 menit sebelum kick-off.",
    contactCommittee: "0812-9876-5432 (Panitia ACC - Sie. Pertandingan)",
    heroBannerImage: "assets/hero_banner.jpg",
    rulesText: \
### 1. FORMAT & KATEGORI TURNAMEN
- Turnamen diselenggarakan dalam 2 Kategori Resmi: **Kategori SMP (U-15)** dan **Kategori SD (U-12)**.
- Setiap kategori diikuti oleh **16 Tim Sekolah/Pesantren** yang dibagi ke dalam 4 Grup (**Grup A, B, C, D**), masing-masing grup berisi 4 tim.
- Babak Penyisihan menggunakan sistem setengah kompetisi (round-robin).
- **Juara dan Runner-up** dari masing-masing grup (total 8 tim per kategori) melaju ke Babak 8 Besar (Perempat Final).
- Babak Gugur (Perempat Final, Semifinal, Perebutan Juara 3, dan Grand Final) menggunakan sistem gugur tunggal (knockout).

### 2. DURASI PERTANDINGAN & SISTEM POIN
- Fase Grup & Perempat Final: 2 x 15 Menit (Waktu Kotor), istirahat 3 menit.
- Semifinal & Grand Final: 2 x 20 Menit (Waktu Kotor), istirahat 5 menit.
- Poin Fase Grup: Menang = 3 Poin, Seri = 1 Poin, Kalah = 0 Poin.
- Jika babak gugur berakhir imbang pada waktu normal, dilanjutkan adu tendangan penalti (3 penendang, lalu sudden death).

### 3. PENENTUAN KLASEMEN GRUP (TIEBREAKER)
1. Poin tertinggi
2. Selisih Gol (SG) terbaik
3. Jumlah Gol Memasukkan (GM) terbanyak
4. Pertemuan Langsung (Head-to-head)
5. Rekor Disiplin / Poin Fair Play (kartu paling sedikit)
6. Undian koin oleh Pengawas Pertandingan resmi

### 4. REGULASI DISIPLIN & KARTU
- 2 Kartu Kuning pada pertandingan berbeda mengakibatkan larangan bermain 1 pertandingan berikutnya.
- 1 Kartu Merah Langsung mengakibatkan larangan bertanding 1 pertandingan berikutnya.
- Pemutihan kartu kuning dilakukan saat memasuki babak Semifinal.
\
  },
  homeData: {
    mvp: {
      name: "Aiman Muzaffar",
      number: 10,
      team: "SD MTQ Al-Fayyadh",
      teamShort: "AL-FAYYADH",
      position: "Pivot",
      photo: "assets/mvp_player.jpg",
      goals: 4,
      assists: 3,
      rating: "9.6",
      motmCount: 2,
      quote: "Bermain bukan hanya sekadar mengejar piala, tetapi menjaga adab, ukhuwah, dan sportivitas santri di atas lapangan."
    },
    news: [
      {
        id: "N1",
        tag: "KILAS PEMBUKAAN",
        title: "Technical Meeting 32 Sekolah Peserta ACC 2026 Sukses Digelar",
        desc: "Dihadiri official 16 tim SMP dan 16 tim SD se-wilayah Jabodetabek dan Jawa Barat. Komitmen fair play disepakati bersama.",
        date: "14 November 2026",
        badge: "Resmi"
      },
      {
        id: "N2",
        tag: "PERBURUAN TIKET 8 BESAR",
        title: "Persaingan Sengit Menuju Babak Gugur di Kategori SMP & SD",
        desc: "Masing-masing 4 grup di kategori SMP dan SD bersaing ketat memperebutkan 2 tiket teratas menuju perempat final.",
        date: "16 November 2026",
        badge: "Sorotan"
      },
      {
        id: "N3",
        tag: "AKHLAK & SPORTIVITAS",
        title: "Himbauan Ketertiban Suporter & Waktu Shalat Berjamaah",
        desc: "Panitia mengapresiasi antusiasme suporter sekolah luar dan mengingatkan jeda pertandingan saat kumandang adzan berkumandang.",
        date: "16 November 2026",
        badge: "Tata Tertib"
      }
    ],
    moments: [
      {
        id: "M1",
        title: "Selebrasi Tiket Semifinal",
        player: "Aiman Muzaffar (#10)",
        team: "SD MTQ Al-Fayyadh",
        tag: "NEW",
        badge: "ðŸ”¥ MATCHDAY HIGHLIGHT",
        image: "assets/moment_celebration.jpg",
        caption: "Selebrasi penuh emosi skuad Al-Fayyadh usai memastikan tiket babak gugur dengan kemenangan dramatis di menit akhir."
      },
      {
        id: "M2",
        title: "Penyelamatan Heroik Menit 30'",
        player: "Farhan Maulana (#1)",
        team: "SMP Islam Al-Azhar",
        tag: "NEW",
        badge: "ðŸ§¤ SAVE OF THE DAY",
        image: "assets/moment_gk_save.jpg",
        caption: "Aksi terbang spektakuler menepis tembakan keras tepat di garis gawang demi mengamankan cleansheet pertandingan."
      },
      {
        id: "M3",
        title: "Tendangan Roket Voli Spektakuler",
        player: "Athar Barra (#9)",
        team: "SMP Islam Al-Azhar",
        tag: "NEW",
        badge: "ðŸš€ GOAL OF THE TOURNAMENT",
        image: "assets/moment_strike.jpg",
        caption: "Sepakan first-time voli keras meluncur kencang merobek jala atas gawang dan disambut gemuruh suporter di GOR Futsal."
      },
      {
        id: "M4",
        title: "Momen Trofi Bergilir ACC 2026",
        player: "Sang Juara Turnamen",
        team: "Pondok Futsal Arena",
        tag: "HOT",
        badge: "ðŸ† CHAMPION MOMENT",
        image: "assets/moment_trophy.jpg",
        caption: "Penyerahan piala bergilir ACC 2026 diiringi kilauan konfeti emas lambang supremasi olahraga santri se-wilayah."
      }
    ],
    sponsors: {
      platinum: [
        { name: "Bank Syariah Al-Barakah", type: "Official Banking Partner", icon: "ðŸ¦" },
        { name: "Al-Fayyadh Sportswear", type: "Official Apparel & Kit", icon: "ðŸ‘•" }
      ],
      gold: [
        { name: "Specs & Molten Futsal", type: "Official Match Ball Partner", icon: "âš½" },
        { name: "Air Mineral Sehat Kh-Q", type: "Official Hydration Partner", icon: "ðŸ’§" },
        { name: "RS Islam Medika Care", type: "Official Medical & First Aid", icon: "ðŸ¥" }
      ],
      media: [
        { name: "Media Santri Nusantara", type: "Official Media Partner", icon: "ðŸ“¡" },
        { name: "Info Futsal Indonesia", type: "Digital Coverage Partner", icon: "ðŸ“±" },
        { name: "Suara Pesantren TV", type: "Live Streaming & Broadcast", icon: "ðŸŽ¥" }
      ]
    }
  },

  // 32 TEAMS: 16 SMP + 16 SD
  teams: [
    // ==========================================
    // KATEGORI SMP (16 TIM: T01 - T16)
    // ==========================================
    // GRUP A SMP
    {
      id: "T01",
      name: "SMP Islam Al-Azhar",
      shortName: "AL-AZHAR",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#10b981",
      city: "Jakarta Timur",
      official: { manager: "Ust. M. Ridwan, S.Pd", coach: "Coach Bayu Saputra", coachPhoto: "assets/coach_bayu.jpg", phone: "0812-1122-3344", jerseyHome: "Hijau - Putih", jerseyAway: "Hitam - Emas" },
      players: [
        { no: 1, name: "Farhan Maulana", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/moment_gk_save.jpg" },
        { no: 4, name: "Zaidan Al-Fatih", pos: "Anchor", goals: 1, yc: 1, rc: 0 },
        { no: 7, name: "Rizky Ramadhan (C)", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 9, name: "Athar Barra", pos: "Pivot", goals: 2, yc: 0, rc: 0, photo: "assets/player_athar.jpg" },
        { no: 10, name: "Ilyas Hakim", pos: "Flank", goals: 1, yc: 1, rc: 0 },
        { no: 12, name: "Fathir Ar-Rasyid", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Dimas Anggara", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Naufal Hilmi", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T02",
      name: "MTs Darul Ulum",
      shortName: "DARUL ULUM",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#3b82f6",
      city: "Bogor",
      official: { manager: "Drs. H. Ahmad Fauzi", coach: "Coach Fajar Pratama", phone: "0813-2233-4455", jerseyHome: "Biru - Putih", jerseyAway: "Kuning - Biru" },
      players: [
        { no: 1, name: "Habibi Rahman", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Syamil Basayev", pos: "Anchor", goals: 0, yc: 2, rc: 0 },
        { no: 8, name: "Hamzah Fansuri (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Fadillah Akbar", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Azka Robbani", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 20, name: "Salman Al-Farisi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Taufiq Hidayat", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 19, name: "Rayhan Ghani", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T03",
      name: "SMP Bina Taruna",
      shortName: "BINA TARUNA",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#f59e0b",
      city: "Bekasi",
      official: { manager: "Bambang Sudibyo, S.T", coach: "Coach Hendra Wijaya", phone: "0856-3344-5566", jerseyHome: "Oranye - Hitam", jerseyAway: "Putih - Oranye" },
      players: [
        { no: 1, name: "Yusuf Habibie", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Deni Saputra", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 6, name: "Bagus Prasetyo", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Gilang Ramadhan (C)", pos: "Pivot", goals: 2, yc: 1, rc: 0 },
        { no: 11, name: "Eko Wahyudi", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 13, name: "Andra Maulana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Bima Arya", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Rendi Pangestu", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T04",
      name: "SMP Muhammadiyah 1",
      shortName: "SMPM 1",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#8b5cf6",
      city: "Tangerang",
      official: { manager: "H. Suryono, M.Pd", coach: "Coach Ardiansyah", phone: "0815-4455-6677", jerseyHome: "Ungu - Kuning", jerseyAway: "Abu-abu - Putih" },
      players: [
        { no: 1, name: "Gibran Rakabuming", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Arya Wirasena (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 7, name: "Khaidir Ali", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Zuhdi Alwan", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Haidar Musyaffa", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Alif Baihaqi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Rafi Shidqi", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 21, name: "Wildan Mubarok", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP B SMP
    {
      id: "T05",
      name: "SMP IT Asy-Syifa",
      shortName: "ASY-SYIFA",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#06b6d4",
      city: "Subang",
      official: { manager: "Ust. Deden Saepulloh", coach: "Coach Rudi Hartono", phone: "0812-5566-7788", jerseyHome: "Cyan - Hitam", jerseyAway: "Putih - Cyan" },
      players: [
        { no: 1, name: "Dzaky Fairuz", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Ammar Zoni", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Fathur Rahman (C)", pos: "Flank", goals: 4, yc: 0, rc: 0 },
        { no: 9, name: "Tariq Ziyad", pos: "Pivot", goals: 3, yc: 1, rc: 0, photo: "assets/player_tariq.jpg" },
        { no: 11, name: "Khalid Basalamah", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Raja Alamsyah", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Muzakki Adnan", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Izzatullah", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T06",
      name: "MTs Husnul Khotimah",
      shortName: "HUSNUL KHOTIMAH",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#ec4899",
      city: "Kuningan",
      official: { manager: "Ust. M. Syukron", coach: "Coach Dedi Kusnandar", phone: "0813-6677-8899", jerseyHome: "Magenta - Hitam", jerseyAway: "Hitam - Perak" },
      players: [
        { no: 1, name: "Hilman Syah", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Rifky Al-Ghifari", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 8, name: "Al-Barra (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Ghazi Al-Ghazi", pos: "Pivot", goals: 2, yc: 0, rc: 0, photo: "assets/player_ghazi.jpg" },
        { no: 12, name: "Fikri Haikal", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Ihsan Pratama", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Umar Faruq", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Zuhair Haris", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T07",
      name: "SMPN 1 Pembangunan",
      shortName: "SMPN 1 KOTA",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#14b8a6",
      city: "Depok",
      official: { manager: "Drs. Suherman", coach: "Coach Wahyu Hidayat", phone: "0857-7788-9900", jerseyHome: "Hijau Toska - Putih", jerseyAway: "Biru Dongker" },
      players: [
        { no: 1, name: "Rio Ferdian", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Satria Dewa (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Arif Kurniawan", pos: "Flank", goals: 1, yc: 1, rc: 0 },
        { no: 9, name: "Yoga Pratama", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Wahyu Tri", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Rico Sanjaya", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Bintang Pratama", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Aldi Taher", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T08",
      name: "SMP Al-Irsyad Al-Islamiyyah",
      shortName: "AL-IRSYAD",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#eab308",
      city: "Cirebon",
      official: { manager: "Ust. Abdullah Ba'asyir", coach: "Coach Firman Utina", phone: "0819-8899-0011", jerseyHome: "Kuning - Hitam", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Ali Ridho", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Fuad Hasan", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 6, name: "Thoriq Husein", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Husain Al-Kaff (C)", pos: "Pivot", goals: 2, yc: 1, rc: 0 },
        { no: 14, name: "Nizar Al-Attas", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Sadam Husein", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Mahdi Al-Jufri", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Fawwaz Assegaf", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP C SMP
    {
      id: "T09",
      name: "MTs Pondok Modern Darussalam",
      shortName: "DARUSSALAM",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#059669",
      city: "Bogor",
      official: { manager: "K.H. Lukman Hakim", coach: "Coach Anang Ma'ruf", phone: "0812-3344-5577", jerseyHome: "Hijau Tua - Emas", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Zaidan Nabil", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Izzan Al-Hafidz (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Fawwaz Rabbani", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Habibi Robbani", pos: "Pivot", goals: 3, yc: 1, rc: 0 },
        { no: 11, name: "M. Zaky Pratama", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Daffa Ramadhan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Irfan Hakim", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Rayyan Al-Faris", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T10",
      name: "SMP IT Nurul Fikri",
      shortName: "NURUL FIKRI",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#6366f1",
      city: "Depok",
      official: { manager: "Ust. M. Syafei", coach: "Coach Eko Prasetyo", phone: "0813-4455-6688", jerseyHome: "Biru Indigo - Putih", jerseyAway: "Navy - Silver" },
      players: [
        { no: 1, name: "Fathir Arkan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Haidar Ali (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 8, name: "Aflah Mubarak", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Fauzan Adzima", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 15, name: "Nabil Ghani", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Bagas Satria", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Raja Syahputra", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Ammar Faiz", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T11",
      name: "SMP Al-Bayan Islamic Boarding",
      shortName: "AL-BAYAN",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#d97706",
      city: "Sukabumi",
      official: { manager: "Drs. H. Mulyadi", coach: "Coach Zaenal Arif", phone: "0856-5566-7799", jerseyHome: "Amber Emas - Hitam", jerseyAway: "Putih - Amber" },
      players: [
        { no: 1, name: "Hilal Syahreza", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Wildan Nugraha (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 5, name: "Bima Sakti", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Kresna Bayu", pos: "Pivot", goals: 1, yc: 1, rc: 0 },
        { no: 11, name: "Danu Tirta", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Aldi Saputra", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Galih Rakasiwi", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Tegar Maulana", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T12",
      name: "MTsN 1 Insan Cendekia",
      shortName: "INSAN CENDEKIA",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#2563eb",
      city: "Jakarta Selatan",
      official: { manager: "Hj. Ratna Sari, M.Pd", coach: "Coach Agus Yuwono", phone: "0818-6677-8800", jerseyHome: "Biru Royal - Putih", jerseyAway: "Merah - Putih" },
      players: [
        { no: 1, name: "Rizky Dwi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Pratama Arhan (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 7, name: "Marselino Ferdinand", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Arkhan Fikri", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Zanadin Fariz", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Cahya Supriadi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Kakak Rudianto", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Hokky Caraka", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP D SMP
    {
      id: "T13",
      name: "SMP Pesantren Al-Fayyadh",
      shortName: "AL-FAYYADH SMP",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#721c24",
      city: "Jakarta",
      official: { manager: "Ust. H. Ahmad Al-Fayyadh", coach: "Coach Syahril Ramadhan", phone: "0812-7788-9911", jerseyHome: "Maroon - Emas (ACC Official)", jerseyAway: "Putih - Emas" },
      players: [
        { no: 1, name: "Muh. Nur Ihsan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Habibullah Al-Habsyi (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Faiz Al-Baqir", pos: "Flank", goals: 3, yc: 1, rc: 0 },
        { no: 9, name: "Bilal Habasyi", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Ziyad Rabbani", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Raudhah Maulana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Haikal Firdaus", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Syamil Robbani", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T14",
      name: "SMP Labschool Unggulan",
      shortName: "LABSCHOOL",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#4f46e5",
      city: "Jakarta Timur",
      official: { manager: "Drs. Budi Santoso", coach: "Coach Bambang Pamungkas", phone: "0811-8899-0022", jerseyHome: "Indigo - Putih", jerseyAway: "Hitam - Biru" },
      players: [
        { no: 1, name: "Nadeo Winata", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Hansamu Yama (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Evan Dimas", pos: "Flank", goals: 2, yc: 1, rc: 0 },
        { no: 10, name: "Ilham Udin", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Septian David", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Ravi Murdianto", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Putu Gede", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Muchlis Hadi", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T15",
      name: "MTs Al-Kahfi Islamic",
      shortName: "AL-KAHFI",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#0284c7",
      city: "Bogor",
      official: { manager: "Ust. Zainuddin", coach: "Coach Arif Rahman", phone: "0813-9900-1133", jerseyHome: "Sky Blue - Putih", jerseyAway: "Hitam - Biru" },
      players: [
        { no: 1, name: "Davi Ananda", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Rayyan Malik (C)", pos: "Anchor", goals: 1, yc: 1, rc: 0 },
        { no: 7, name: "Izzan Al-Ghifari", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Syauqi Rahman", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Rasyid Al-Bana", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Habib Munzir", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Ammar Yasir", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Zaki Mubarok", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T16",
      name: "SMP Darunnajah Islamic",
      shortName: "DARUNNAJAH",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#0d9488",
      city: "Jakarta Selatan",
      official: { manager: "Ust. H. Mustofa", coach: "Coach Danurwindo", phone: "0815-0011-2244", jerseyHome: "Teal Hijau - Hitam", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Ali Murtadha", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Fadhil Muhammad (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 6, name: "Rizqullah", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Thoriq Ziyad", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "M. Farhan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Daffa Robbani", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Husni Mubarak", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Zaki Robbani", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // ==========================================
    // KATEGORI SD (16 TIM: T17 - T32)
    // ==========================================
    // GRUP A SD
    {
      id: "T17",
      name: "SD MTQ Al-Fayyadh",
      shortName: "AL-FAYYADH SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#721c24",
      city: "Ma'had Al-Fayyadh",
      official: { manager: "Ust. H. Ahmad Al-Fayyadh", coach: "Coach Syahril Ramadhan", phone: "0812-9900-1122", jerseyHome: "Maroon - Emas", jerseyAway: "Putih - Emas" },
      players: [
        { no: 1, name: "Muh. Nur Ihsan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Habibullah Al-Habsyi (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Faiz Al-Baqir", pos: "Flank", goals: 3, yc: 1, rc: 0 },
        { no: 10, name: "Aiman Muzaffar", pos: "Pivot", goals: 4, yc: 0, rc: 0, photo: "assets/mvp_player.jpg" },
        { no: 11, name: "Ziyad Rabbani", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Raudhah Maulana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Haikal Firdaus", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Bilal Habasyi", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T18",
      name: "SD Islam Nurul Fikri",
      shortName: "NURUL FIKRI SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#6366f1",
      city: "Serang",
      official: { manager: "Ust. Rahmat Hidayatullah", coach: "Coach Indra Sjafriadi", phone: "0813-0011-2233", jerseyHome: "Navy - Merah", jerseyAway: "Abu-abu - Navy" },
      players: [
        { no: 1, name: "Affan Ghaisan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Dhafa Al-Ghazi", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Faiq Al-Hafiz (C)", pos: "Flank", goals: 2, yc: 1, rc: 0 },
        { no: 9, name: "Rakan Syakir", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "M. Hanif", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Raja Syahputra", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Kinan Abyan", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Luqman Hakim", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T19",
      name: "MI Al-Kahfi Islamic School",
      shortName: "AL-KAHFI SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#f97316",
      city: "Bogor Selatan",
      official: { manager: "Ust. Zainuddin", coach: "Coach Arif Rahman", phone: "0856-1122-3344", jerseyHome: "Oranye - Putih", jerseyAway: "Hitam - Oranye" },
      players: [
        { no: 1, name: "Davi Ananda", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Rayyan Malik (C)", pos: "Anchor", goals: 1, yc: 1, rc: 0 },
        { no: 7, name: "Izzan Al-Ghifari", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Syauqi Rahman", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Rasyid Al-Bana", pos: "Flank", goals: 0, yc: 1, rc: 0 },
        { no: 16, name: "Habib Munzir", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Ammar Yasir", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Zaki Mubarok", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T20",
      name: "SD IT Global Cendekia",
      shortName: "GLOBAL C. SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#0ea5e9",
      city: "Tangerang Selatan",
      official: { manager: "Ir. Gunawan Wibisono", coach: "Coach Ronald", phone: "0818-2233-4455", jerseyHome: "Sky Blue - Hitam", jerseyAway: "Putih - Sky Blue" },
      players: [
        { no: 1, name: "Randi Pangalila", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Reza Rahardian", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Bintang Emon (C)", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Kevin Sanjaya", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Marcus Gideon", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Jonatan Christie", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Anthony Ginting", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Fajar Alfian", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP B SD
    {
      id: "T21",
      name: "SD Bina Bangsa Mandiri",
      shortName: "BINA BANGSA SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#ef4444",
      city: "Bekasi Timur",
      official: { manager: "Drs. Joko Purwanto", coach: "Coach Danurwindo", phone: "0811-3344-5566", jerseyHome: "Merah - Putih", jerseyAway: "Hitam - Merah" },
      players: [
        { no: 1, name: "Nadeo Argawinata", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Fachruddin Aryanto (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Witan Sulaeman", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 9, name: "Ramadhan Sananta", pos: "Pivot", goals: 3, yc: 1, rc: 0 },
        { no: 10, name: "Egy Maulana", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Ernando Ari", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Rizky Ridho", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 14, name: "Asnawi Mangkualam", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T22",
      name: "MI Ar-Rahman Islamic",
      shortName: "AR-RAHMAN SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#a855f7",
      city: "Sukabumi",
      official: { manager: "Ust. Fathurrahman", coach: "Coach Benny Dollo", phone: "0812-4455-6677", jerseyHome: "Ungu Muda - Putih", jerseyAway: "Kuning Kunyit" },
      players: [
        { no: 1, name: "Hilal Syahbana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Habibi Syafiq", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 8, name: "M. Fauzan (C)", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Alif Baihaqi", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Thoriqul Haq", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 22, name: "Daud Al-Kindi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Ihsanul Fikri", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Rafi Robbani", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T23",
      name: "SD Insan Cendekia Madani",
      shortName: "INSAN C. SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#10b981",
      city: "Serpong",
      official: { manager: "Dr. H. Sulaiman", coach: "Coach Rahmad Darmawan", phone: "0813-5566-7788", jerseyHome: "Hijau - Abu-abu", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Alvaro Maldini", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Bagas Kaffa (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Bagus Kahfi", pos: "Flank", goals: 2, yc: 1, rc: 0 },
        { no: 10, name: "Beckham Putra", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Marselino Ferdinan", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Adi Satryo", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Pratama Arhan", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 18, name: "Hokky Caraka", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T24",
      name: "SD Patriot Mandiri",
      shortName: "PATRIOT SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#f43f5e",
      city: "Karawang",
      official: { manager: "Drs. Hendro Siswanto", coach: "Coach Aji Santoso", phone: "0857-6677-8899", jerseyHome: "Merah Marun - Hitam", jerseyAway: "Putih - Merah" },
      players: [
        { no: 1, name: "Teja Paku Alam", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Achmad Jufriyanto (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 8, name: "Dedi Kusnandar", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "David Da Silva", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Ciro Alves", pos: "Flank", goals: 1, yc: 1, rc: 0 },
        { no: 12, name: "Fitrul Dwi Rustapa", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Kakang Rudianto", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Ferdiansyah", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP C SD
    {
      id: "T25",
      name: "SD Islam Al-Azhar Pusat",
      shortName: "AL-AZHAR SD",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#10b981",
      city: "Jakarta Selatan",
      official: { manager: "Ust. Zulkifli, S.Pd", coach: "Coach Ridwan Kamil", phone: "0812-1234-5678", jerseyHome: "Hijau - Putih", jerseyAway: "Kuning - Hitam" },
      players: [
        { no: 1, name: "Zaidan Ilham", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Arkananta (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Fathir Muhammad", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Rizky Bilal", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Aflah Robbani", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Dhafin Al-Fatih", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Habibi Firdaus", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Ammar Syakir", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T26",
      name: "MI Darul Hikmah Boarding",
      shortName: "DARUL HIKMAH",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#3b82f6",
      city: "Bogor",
      official: { manager: "Ust. M. Syahrir", coach: "Coach Fajar Alamsyah", phone: "0813-2345-6789", jerseyHome: "Biru - Putih", jerseyAway: "Hitam - Biru" },
      players: [
        { no: 1, name: "Faiz Maulana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Zuhdi Faruq (C)", pos: "Anchor", goals: 1, yc: 1, rc: 0 },
        { no: 8, name: "Rayyan Ghani", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Ilyas Mubarak", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Alif Hidayat", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Raja Alamsyah", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Salman Faris", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 18, name: "Taufiq Akbar", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T27",
      name: "SD IT Harapan Bangsa",
      shortName: "HARAPAN BANGSA",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#f59e0b",
      city: "Tangerang",
      official: { manager: "H. Gunawan, S.T", coach: "Coach Bambang Suryo", phone: "0856-3456-7890", jerseyHome: "Kuning Oranye - Hitam", jerseyAway: "Putih - Oranye" },
      players: [
        { no: 1, name: "Bima Arya", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Galang Pratama (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Rendi Wahyu", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Bagus Setiawan", pos: "Pivot", goals: 2, yc: 1, rc: 0 },
        { no: 11, name: "Deni Saputra", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 13, name: "Andra Kurnia", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Eko Prasetyo", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Gilang Ramadhan", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T28",
      name: "SD Muhammadiyah Plus",
      shortName: "MUHAMMADIYAH SD",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#8b5cf6",
      city: "Bekasi",
      official: { manager: "H. Suryadi, M.Pd", coach: "Coach Ardiansyah", phone: "0815-4567-8901", jerseyHome: "Ungu Muda - Kuning", jerseyAway: "Abu-abu - Putih" },
      players: [
        { no: 1, name: "Khaidir Ali", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Zuhdi Alwan (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 7, name: "Arya Wirasena", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Gibran Rakabuming", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Haidar Musyaffa", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Alif Baihaqi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Rafi Shidqi", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 21, name: "Wildan Mubarok", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP D SD
    {
      id: "T29",
      name: "SDIT Ummul Quro",
      shortName: "UMMUL QURO",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#06b6d4",
      city: "Bogor",
      official: { manager: "Ust. M. Syukron", coach: "Coach Rudi Hartono", phone: "0812-5678-9012", jerseyHome: "Cyan Toska - Putih", jerseyAway: "Hitam - Cyan" },
      players: [
        { no: 1, name: "Ammar Zoni", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Dzaky Fairuz (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Fathur Rahman", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Tariq Ziyad", pos: "Pivot", goals: 2, yc: 1, rc: 0 },
        { no: 11, name: "Khalid Basalamah", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 13, name: "Raja Alamsyah", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Muzakki Adnan", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Izzatullah", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T30",
      name: "MI Miftahul Huda",
      shortName: "MIFTAHUL HUDA",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#ec4899",
      city: "Depok",
      official: { manager: "Ust. Dedi Supriyadi", coach: "Coach Hilman Syah", phone: "0813-6789-0123", jerseyHome: "Pink Magenta - Hitam", jerseyAway: "Hitam - Perak" },
      players: [
        { no: 1, name: "Hilman Syah", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Rifky Al-Ghifari (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 8, name: "Al-Barra", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Ghazi Al-Ghazi", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Fikri Haikal", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Ihsan Pratama", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Umar Faruq", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Zuhair Haris", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T31",
      name: "SD Cikal Harapan Islamic",
      shortName: "CIKAL HARAPAN",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#14b8a6",
      city: "Tangerang",
      official: { manager: "Drs. Wahyu Hidayat", coach: "Coach Satria Dewa", phone: "0857-7890-1234", jerseyHome: "Toska Muda - Putih", jerseyAway: "Biru Gelap" },
      players: [
        { no: 1, name: "Rio Ferdian", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Satria Dewa (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Arif Kurniawan", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Yoga Pratama", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Wahyu Tri", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Rico Sanjaya", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Bintang Pratama", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Aldi Taher", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T32",
      name: "SDIT Al-Kautsar Prestasi",
      shortName: "AL-KAUTSAR",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#eab308",
      city: "Jakarta Timur",
      official: { manager: "Ust. Abdullah Ba'asyir", coach: "Coach Firman Utina", phone: "0819-8901-2345", jerseyHome: "Kuning Terang - Hitam", jerseyAway: "Putih - Kuning" },
      players: [
        { no: 1, name: "Ali Ridho", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Fuad Hasan (C)", pos: "Anchor", goals: 0, yc: 1, rc: 0 },
        { no: 6, name: "Thoriq Husein", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Husain Al-Kaff", pos: "Pivot", goals: 2, yc: 1, rc: 0 },
        { no: 14, name: "Nizar Al-Attas", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Sadam Husein", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Mahdi Al-Jufri", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Fawwaz Assegaf", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    }
  ],

  // MATCHES (Group Stage + Knockout)
  matches: [
    // ==========================================
    // KATEGORI SMP - MATCHDAY 1 (15 Nov 2026)
    // ==========================================
    {
      id: "M01",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T01",
      awayId: "T02",
      homeScore: 3,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T01", player: "Rizky Ramadhan", minute: "4'" },
        { team: "T01", player: "Athar Barra", minute: "12'" },
        { team: "T02", player: "Hamzah Fansuri", minute: "18'" },
        { team: "T01", player: "Zaidan Al-Fatih", minute: "27'" }
      ],
      cards: [
        { team: "T02", player: "Syamil Basayev", type: "yellow", minute: "14'" },
        { team: "T01", player: "Zaidan Al-Fatih", type: "yellow", minute: "22'" }
      ]
    },
    {
      id: "M02",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T03",
      awayId: "T04",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T03", player: "Gilang Ramadhan", minute: "6'" },
        { team: "T04", player: "Khaidir Ali", minute: "15'" },
        { team: "T03", player: "Bagus Prasetyo", minute: "26'" }
      ],
      cards: [
        { team: "T04", player: "Arya Wirasena", type: "yellow", minute: "20'" },
        { team: "T03", player: "Deni Saputra", type: "yellow", minute: "24'" }
      ]
    },
    {
      id: "M03",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T05",
      awayId: "T06",
      homeScore: 4,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T05", player: "Fathur Rahman", minute: "3'" },
        { team: "T05", player: "Tariq Ziyad", minute: "8'" },
        { team: "T06", player: "Ghazi Al-Ghazi", minute: "14'" },
        { team: "T05", player: "Fathur Rahman", minute: "19'" },
        { team: "T06", player: "Al-Barra", minute: "23'" },
        { team: "T05", player: "Ammar Zoni", minute: "28'" }
      ],
      cards: [
        { team: "T06", player: "Rifky Al-Ghifari", type: "yellow", minute: "11'" }
      ]
    },
    {
      id: "M04",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T07",
      awayId: "T08",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T07", player: "Arif Kurniawan", minute: "10'" },
        { team: "T08", player: "Husain Al-Kaff", minute: "21'" }
      ],
      cards: [
        { team: "T08", player: "Fuad Hasan", type: "yellow", minute: "19'" }
      ]
    },
    {
      id: "M05",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T09",
      awayId: "T10",
      homeScore: 3,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T09", player: "Habibi Robbani", minute: "5'" },
        { team: "T10", player: "Fauzan Adzima", minute: "14'" },
        { team: "T09", player: "Fawwaz Rabbani", minute: "20'" },
        { team: "T09", player: "Habibi Robbani", minute: "28'" }
      ],
      cards: []
    },
    {
      id: "M06",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T11",
      awayId: "T12",
      homeScore: 1,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T11", player: "Kresna Bayu", minute: "9'" },
        { team: "T12", player: "Marselino Ferdinand", minute: "16'" },
        { team: "T12", player: "Arkhan Fikri", minute: "25'" }
      ],
      cards: [
        { team: "T11", player: "Kresna Bayu", type: "yellow", minute: "18'" }
      ]
    },
    {
      id: "M07",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T13",
      awayId: "T14",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T13", player: "Faiz Al-Baqir", minute: "4'" },
        { team: "T14", player: "Evan Dimas", minute: "11'" },
        { team: "T13", player: "Bilal Habasyi", minute: "19'" },
        { team: "T14", player: "Ilham Udin", minute: "24'" },
        { team: "T13", player: "Ziyad Rabbani", minute: "29'" }
      ],
      cards: []
    },
    {
      id: "M08",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T15",
      awayId: "T16",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T15", player: "Rayyan Malik", minute: "13'" },
        { team: "T16", player: "Thoriq Ziyad", minute: "22'" }
      ],
      cards: [
        { team: "T15", player: "Rayyan Malik", type: "yellow", minute: "17'" },
        { team: "T16", player: "Fadhil Muhammad", type: "yellow", minute: "26'" }
      ]
    },

    // ==========================================
    // KATEGORI SD - MATCHDAY 1 (15 Nov 2026)
    // ==========================================
    {
      id: "M09",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T17",
      awayId: "T18",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T17", player: "Faiz Al-Baqir", minute: "5'" },
        { team: "T18", player: "Faiq Al-Hafiz", minute: "9'" },
        { team: "T17", player: "Aiman Muzaffar", minute: "16'" },
        { team: "T18", player: "Rakan Syakir", minute: "22'" },
        { team: "T17", player: "Ziyad Rabbani", minute: "29'" }
      ],
      cards: [
        { team: "T17", player: "Faiz Al-Baqir", type: "yellow", minute: "18'" },
        { team: "T18", player: "Faiq Al-Hafiz", type: "yellow", minute: "25'" }
      ]
    },
    {
      id: "M10",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T19",
      awayId: "T20",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T19", player: "Rayyan Malik", minute: "7'" },
        { team: "T20", player: "Kevin Sanjaya", minute: "14'" },
        { team: "T19", player: "Syauqi Rahman", minute: "24'" }
      ],
      cards: [
        { team: "T19", player: "Rayyan Malik", type: "yellow", minute: "12'" }
      ]
    },
    {
      id: "M11",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T21",
      awayId: "T22",
      homeScore: 4,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T21", player: "Witan Sulaeman", minute: "3'" },
        { team: "T21", player: "Ramadhan Sananta", minute: "11'" },
        { team: "T22", player: "M. Fauzan", minute: "17'" },
        { team: "T21", player: "Egy Maulana", minute: "21'" },
        { team: "T21", player: "Fachruddin Aryanto", minute: "27'" }
      ],
      cards: [
        { team: "T22", player: "Habibi Syafiq", type: "yellow", minute: "15'" }
      ]
    },
    {
      id: "M12",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T23",
      awayId: "T24",
      homeScore: 2,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T23", player: "Bagus Kahfi", minute: "8'" },
        { team: "T24", player: "David Da Silva", minute: "13'" },
        { team: "T23", player: "Marselino Ferdinan", minute: "20'" },
        { team: "T24", player: "Ciro Alves", minute: "26'" }
      ],
      cards: [
        { team: "T24", player: "Achmad Jufriyanto", type: "yellow", minute: "16'" },
        { team: "T23", player: "Bagus Kahfi", type: "yellow", minute: "22'" }
      ]
    },
    {
      id: "M13",
      category: "SD",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T25",
      awayId: "T26",
      homeScore: 3,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T25", player: "Fathir Muhammad", minute: "6'" },
        { team: "T26", player: "Zuhdi Faruq", minute: "15'" },
        { team: "T25", player: "Rizky Bilal", minute: "21'" },
        { team: "T25", player: "Aflah Robbani", minute: "27'" }
      ],
      cards: []
    },
    {
      id: "M14",
      category: "SD",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T27",
      awayId: "T28",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T27", player: "Bagus Setiawan", minute: "8'" },
        { team: "T28", player: "Gibran Rakabuming", minute: "17'" },
        { team: "T27", player: "Rendi Wahyu", minute: "25'" }
      ],
      cards: []
    },
    {
      id: "M15",
      category: "SD",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T29",
      awayId: "T30",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T29", player: "Fathur Rahman", minute: "7'" },
        { team: "T30", player: "Ghazi Al-Ghazi", minute: "16'" },
        { team: "T29", player: "Tariq Ziyad", minute: "26'" }
      ],
      cards: []
    },
    {
      id: "M16",
      category: "SD",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T31",
      awayId: "T32",
      homeScore: 1,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T31", player: "Yoga Pratama", minute: "10'" },
        { team: "T32", player: "Husain Al-Kaff", minute: "18'" },
        { team: "T32", player: "Nizar Al-Attas", minute: "24'" }
      ],
      cards: []
    },

    // ==========================================
    // MATCHDAY 2 (16 Nov 2026) - SMP & SD
    // ==========================================
    {
      id: "M17",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T01",
      awayId: "T03",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T01", player: "Rizky Ramadhan", minute: "7'" },
        { team: "T03", player: "Gilang Ramadhan", minute: "16'" },
        { team: "T01", player: "Athar Barra", minute: "24'" }
      ],
      cards: [
        { team: "T03", player: "Gilang Ramadhan", type: "yellow", minute: "18'" },
        { team: "T01", player: "Ilyas Hakim", type: "yellow", minute: "25'" }
      ]
    },
    {
      id: "M18",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T02",
      awayId: "T04",
      homeScore: 3,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T02", player: "Fadillah Akbar", minute: "5'" },
        { team: "T02", player: "Hamzah Fansuri", minute: "12'" },
        { team: "T04", player: "Zuhdi Alwan", minute: "19'" },
        { team: "T02", player: "Azka Robbani", minute: "27'" }
      ],
      cards: [
        { team: "T02", player: "Syamil Basayev", type: "yellow", minute: "22'" },
        { team: "T02", player: "Taufiq Hidayat", type: "yellow", minute: "26'" }
      ]
    },
    {
      id: "M19",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T05",
      awayId: "T07",
      homeScore: 3,
      awayScore: 0,
      status: "finished",
      scorers: [
        { team: "T05", player: "Fathur Rahman", minute: "6'" },
        { team: "T05", player: "Tariq Ziyad", minute: "14'" },
        { team: "T05", player: "Khalid Basalamah", minute: "22'" }
      ],
      cards: [
        { team: "T07", player: "Arif Kurniawan", type: "yellow", minute: "19'" }
      ]
    },
    {
      id: "M20",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T06",
      awayId: "T08",
      homeScore: 2,
      awayScore: 2,
      status: "live",
      liveMinute: "26'",
      homeScoreLive: 2,
      awayScoreLive: 2,
      scorers: [
        { team: "T06", player: "Ghazi Al-Ghazi", minute: "8'" },
        { team: "T08", player: "Husain Al-Kaff", minute: "11'" },
        { team: "T08", player: "Nizar Al-Attas", minute: "17'" },
        { team: "T06", player: "Al-Barra", minute: "21'" }
      ],
      cards: [
        { team: "T08", player: "Husain Al-Kaff", type: "yellow", minute: "15'" }
      ]
    },
    {
      id: "M21",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T17",
      awayId: "T19",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T17", player: "Aiman Muzaffar", minute: "8'" },
        { team: "T19", player: "Rayyan Malik", minute: "17'" },
        { team: "T17", player: "Aiman Muzaffar", minute: "25'" }
      ],
      cards: []
    },
    {
      id: "M22",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T18",
      awayId: "T20",
      homeScore: 2,
      awayScore: 0,
      status: "finished",
      scorers: [
        { team: "T18", player: "Faiq Al-Hafiz", minute: "12'" },
        { team: "T18", player: "M. Hanif", minute: "21'" }
      ],
      cards: []
    },
    {
      id: "M23",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T21",
      awayId: "T23",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T21", player: "Ramadhan Sananta", minute: "6'" },
        { team: "T23", player: "Beckham Putra", minute: "13'" },
        { team: "T21", player: "Witan Sulaeman", minute: "19'" },
        { team: "T23", player: "Bagus Kahfi", minute: "24'" },
        { team: "T21", player: "Ramadhan Sananta", minute: "28'" }
      ],
      cards: []
    },
    {
      id: "M24",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T22",
      awayId: "T24",
      homeScore: 1,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T22", player: "Alif Baihaqi", minute: "11'" },
        { team: "T24", player: "David Da Silva", minute: "19'" },
        { team: "T24", player: "Ciro Alves", minute: "26'" }
      ],
      cards: []
    },

    // ==========================================
    // MATCHDAY 3 (17 Nov 2026) - PENENTUAN GRUP
    // ==========================================
    {
      id: "M25",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T01",
      awayId: "T04",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M26",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T02",
      awayId: "T03",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M27",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T05",
      awayId: "T08",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M28",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T06",
      awayId: "T07",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M29",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T17",
      awayId: "T20",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M30",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T18",
      awayId: "T19",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M31",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T21",
      awayId: "T24",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M32",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T22",
      awayId: "T23",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // ==========================================
    // BABAK GUGUR (KNOCKOUT) KATEGORI SMP
    // ==========================================
    {
      id: "QF1_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Perempat Final 1 SMP",
      date: "18 Nov 2026",
      time: "08:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup A (SMP)",
      awayPlaceholder: "Runner-up Grup B (SMP)",
      homeId: "T01",
      awayId: "T06",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF2_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Perempat Final 2 SMP",
      date: "18 Nov 2026",
      time: "09:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup C (SMP)",
      awayPlaceholder: "Runner-up Grup D (SMP)",
      homeId: "T09",
      awayId: "T14",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF3_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Perempat Final 3 SMP",
      date: "18 Nov 2026",
      time: "10:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup B (SMP)",
      awayPlaceholder: "Runner-up Grup A (SMP)",
      homeId: "T05",
      awayId: "T02",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF4_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Perempat Final 4 SMP",
      date: "18 Nov 2026",
      time: "11:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup D (SMP)",
      awayPlaceholder: "Runner-up Grup C (SMP)",
      homeId: "T13",
      awayId: "T10",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "SF1_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Semifinal 1 SMP",
      date: "19 Nov 2026",
      time: "08:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang QF1 SMP",
      awayPlaceholder: "Pemenang QF2 SMP",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "SF2_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Semifinal 2 SMP",
      date: "19 Nov 2026",
      time: "09:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang QF3 SMP",
      awayPlaceholder: "Pemenang QF4 SMP",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "3RD_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Juara 3 SMP",
      date: "20 Nov 2026",
      time: "08:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Kalah Semifinal 1 SMP",
      awayPlaceholder: "Kalah Semifinal 2 SMP",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "FINAL_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Grand Final SMP",
      date: "20 Nov 2026",
      time: "10:00 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang SF1 SMP",
      awayPlaceholder: "Pemenang SF2 SMP",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // ==========================================
    // BABAK GUGUR (KNOCKOUT) KATEGORI SD
    // ==========================================
    {
      id: "QF1_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Perempat Final 1 SD",
      date: "18 Nov 2026",
      time: "13:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup A (SD)",
      awayPlaceholder: "Runner-up Grup B (SD)",
      homeId: "T17",
      awayId: "T23",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF2_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Perempat Final 2 SD",
      date: "18 Nov 2026",
      time: "14:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup C (SD)",
      awayPlaceholder: "Runner-up Grup D (SD)",
      homeId: "T25",
      awayId: "T30",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF3_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Perempat Final 3 SD",
      date: "18 Nov 2026",
      time: "15:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup B (SD)",
      awayPlaceholder: "Runner-up Grup A (SD)",
      homeId: "T21",
      awayId: "T18",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF4_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Perempat Final 4 SD",
      date: "18 Nov 2026",
      time: "16:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup D (SD)",
      awayPlaceholder: "Runner-up Grup C (SD)",
      homeId: "T29",
      awayId: "T26",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "SF1_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Semifinal 1 SD",
      date: "19 Nov 2026",
      time: "13:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang QF1 SD",
      awayPlaceholder: "Pemenang QF2 SD",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "SF2_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Semifinal 2 SD",
      date: "19 Nov 2026",
      time: "14:45 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang QF3 SD",
      awayPlaceholder: "Pemenang QF4 SD",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "3RD_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Juara 3 SD",
      date: "20 Nov 2026",
      time: "13:30 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Kalah Semifinal 1 SD",
      awayPlaceholder: "Kalah Semifinal 2 SD",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "FINAL_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Grand Final SD",
      date: "20 Nov 2026",
      time: "15:00 WIB",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Pemenang SF1 SD",
      awayPlaceholder: "Pemenang SF2 SD",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    }
  ]
};
