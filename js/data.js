// data.js - Initial Default Tournament Data
const DEFAULT_DATA = {
  config: {
    tournamentName: 'ACC "Al-Fayyadh Champions Cup" 2026',
    subTitle: "Turnamen Futsal Antar-Sekolah & Pesantren • Ma'had Tahfizhul Qur'an Al Fayyadh",
    edition: "ACC Edisi 2026",
    venue: "GOR Futsal Ma'had Tahfizhul Qur'an Al Fayyadh",
    pitch1Name: "Lapangan 1 (Vinyl Utama)",
    pitch2Name: "Lapangan 2 (Sintetis)",
    dates: "15 - 20 November 2026",
    adminPinHash: "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348",
    runningAnnouncement: "🏆 Selamat Datang di ACC 'Al-Fayyadh Champions Cup' 2026 Ma'had Tahfizhul Qur'an Al Fayyadh! Junjung tinggi sportivitas, ukhuwah Islamiyah, dan fair play. Registrasi line-up maksimal 30 menit sebelum kick-off.",
    contactCommittee: "0812-9876-5432 (Panitia ACC - Sie. Pertandingan)",
    heroBannerImage: "assets/hero_banner.jpg",
    rulesText: `
### 1. SISTEM PERTANDINGAN
- Babak Penyisihan: Sistem setengah kompetisi (fase grup). 16 Tim dibagi ke dalam 4 grup (Grup A, B, C, D).
- Juara dan Runner-up tiap grup (total 8 tim) berhak melaju ke Babak Gugur (Perempat Final).
- Babak Gugur (Perempat Final, Semifinal, Juara 3, dan Grand Final) menggunakan sistem gugur tunggal.

### 2. DURASI PERTANDINGAN & POIN
- Fase Grup & Perempat Final: 2 x 15 Menit (Waktu Kotor), waktu istirahat 3 menit.
- Semifinal & Final: 2 x 20 Menit (Waktu Kotor), waktu istirahat 5 menit.
- Sistem Poin Fase Grup: Menang = 3 Poin, Seri = 1 Poin, Kalah = 0 Poin.
- Jika pada babak gugur skor imbang di waktu normal, langsung dilakukan adu tendangan penalti (3 penendang utama, lalu sudden death jika masih imbang).

### 3. PENENTUAN KLASEMEN GRUP (TIEBREAKER)
1. Poin tertinggi
2. Selisih Gol (SG) terbaik
3. Jumlah Gol Memasukkan (GM) terbanyak
4. Pertemuan Langsung (Head-to-head)
5. Rekor Kedisiplinan (Poin Fair Play / Kartu paling sedikit)
6. Undian koin oleh Pengawas Pertandingan

### 4. REGULASI KARTU & DISIPLIN
- Akumulasi 2 (dua) Kartu Kuning pada pertandingan berbeda mengakibatkan larangan bermain 1 (satu) pertandingan berikutnya.
- 1 Kartu Merah Langsung mengakibatkan larangan bermain 1 (satu) pertandingan berikutnya (atau lebih sesuai keputusan Komdis jika pelanggaran berat).
- Pemutihan kartu kuning dilakukan saat memasuki babak SEMIFINAL, dengan catatan pemain yang menerima sanksi akumulasi kartu di perempat final tetap wajib menjalani hukumannya di semifinal.
- Setiap official dan pemain wajib mematuhi keputusan wasit berlisensi resmi PSSI/AFI.
    `
  },
  homeData: {
    mvp: {
      name: "Aiman Muzaffar",
      number: 10,
      team: "MTQ Al-Fayyadh FC",
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
        title: "Technical Meeting & Pembukaan Resmi ACC 2026 Sukses Digelar",
        desc: "Dihadiri oleh 16 perwakilan official sekolah dan pesantren, komitmen fair play dan sistem pengawasan wasit resmi disepakati bersama.",
        date: "14 November 2026",
        badge: "Resmi"
      },
      {
        id: "N2",
        tag: "PERBURUAN TIKET 8 BESAR",
        title: "Persaingan Sengit di Grup A & C Menjelang Babak Gugur",
        desc: "Dengan selisih gol yang ketat, laga penutup fase penyisihan menjadi penentu kelolosan menuju perempat final.",
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
        team: "MTQ Al-Fayyadh FC",
        tag: "NEW",
        badge: "🔥 MATCHDAY HIGHLIGHT",
        image: "assets/moment_celebration.jpg",
        caption: "Selebrasi penuh emosi skuad MTQ Al-Fayyadh usai memastikan tiket semifinal dengan kemenangan dramatis di menit akhir."
      },
      {
        id: "M2",
        title: "Penyelamatan Heroik Menit 30'",
        player: "Farhan Maulana (#1)",
        team: "SMA Islam Al-Azhar",
        tag: "NEW",
        badge: "🧤 SAVE OF THE DAY",
        image: "assets/moment_gk_save.jpg",
        caption: "Aksi terbang spektakuler menepis tembakan keras tepat di garis gawang demi mengamankan cleansheet pertandingan."
      },
      {
        id: "M3",
        title: "Tendangan Roket Voli Spektakuler",
        player: "Athar Barra (#9)",
        team: "SMA Islam Al-Azhar",
        tag: "NEW",
        badge: "🚀 GOAL OF THE TOURNAMENT",
        image: "assets/moment_strike.jpg",
        caption: "Sepakan first-time voli keras meluncur kencang merobek jala atas gawang dan disambut gemuruh suporter di GOR Futsal."
      },
      {
        id: "M4",
        title: "Momen Trofi Bergilir ACC 2026",
        player: "Sang Juara Turnamen",
        team: "Pondok Futsal Arena",
        tag: "HOT",
        badge: "🏆 CHAMPION MOMENT",
        image: "assets/moment_trophy.jpg",
        caption: "Penyerahan piala bergilir ACC 2026 diiringi kilauan konfeti emas lambang supremasi olahraga santri se-wilayah."
      }
    ],
    sponsors: {
      platinum: [
        { name: "Bank Syariah Al-Barakah", type: "Official Banking Partner", icon: "🏦" },
        { name: "Al-Fayyadh Sportswear", type: "Official Apparel & Kit", icon: "👕" }
      ],
      gold: [
        { name: "Specs & Molten Futsal", type: "Official Match Ball Partner", icon: "⚽" },
        { name: "Air Mineral Sehat Kh-Q", type: "Official Hydration Partner", icon: "💧" },
        { name: "RS Islam Medika Care", type: "Official Medical & First Aid", icon: "🏥" }
      ],
      media: [
        { name: "Media Santri Nusantara", type: "Official Media Partner", icon: "📡" },
        { name: "Info Futsal Indonesia", type: "Digital Coverage Partner", icon: "📱" },
        { name: "Suara Pesantren TV", type: "Live Streaming & Broadcast", icon: "🎥" }
      ]
    }
  },
  teams: [
    // GRUP A (KATEGORI SMP)
    {
      id: "T01",
      name: "SMP Islam Al-Azhar",
      shortName: "AL-AZHAR",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#10b981",
      city: "Jakarta Timur",
      official: {
        manager: "Ust. M. Ridwan, S.Pd",
        coach: "Coach Bayu Saputra",
        coachPhoto: "assets/coach_bayu.jpg",
        medic: "Rian Hidayat",
        phone: "0812-1122-3344",
        jerseyHome: "Hijau - Putih",
        jerseyAway: "Hitam - Emas"
      },
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
      official: {
        manager: "Drs. H. Ahmad Fauzi",
        coach: "Coach Fajar Pratama",
        medic: "Lukman Hakim",
        phone: "0813-2233-4455",
        jerseyHome: "Biru - Putih",
        jerseyAway: "Kuning - Biru"
      },
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
      official: {
        manager: "Bambang Sudibyo, S.T",
        coach: "Coach Hendra Wijaya",
        medic: "Agus Santoso",
        phone: "0856-3344-5566",
        jerseyHome: "Oranye - Hitam",
        jerseyAway: "Putih - Oranye"
      },
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
      official: {
        manager: "H. Suryono, M.Pd",
        coach: "Coach Ardiansyah",
        medic: "Doni Firmansyah",
        phone: "0815-4455-6677",
        jerseyHome: "Ungu - Kuning",
        jerseyAway: "Abu-abu - Putih"
      },
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

    // GRUP B (KATEGORI SMP)
    {
      id: "T05",
      name: "SMP IT Asy-Syifa",
      shortName: "ASY-SYIFA",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#06b6d4",
      city: "Subang",
      official: {
        manager: "Ust. Deden Saepulloh",
        coach: "Coach Rudi Hartono",
        coachPhoto: "assets/coach_bayu.jpg",
        medic: "Dr. Wildan",
        phone: "0812-5566-7788",
        jerseyHome: "Cyan - Hitam",
        jerseyAway: "Putih - Cyan"
      },
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
      official: {
        manager: "Ust. M. Syukron",
        coach: "Coach Dedi Kusnandar",
        coachPhoto: "assets/coach_bayu.jpg",
        medic: "Asep Rohimat",
        phone: "0813-6677-8899",
        jerseyHome: "Magenta - Hitam",
        jerseyAway: "Hitam - Perak"
      },
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
      official: {
        manager: "Drs. Suherman",
        coach: "Coach Wahyu Hidayat",
        medic: "Triyono",
        phone: "0857-7788-9900",
        jerseyHome: "Hijau Toska - Putih",
        jerseyAway: "Biru Dongker"
      },
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
      official: {
        manager: "Ust. Abdullah Ba'asyir",
        coach: "Coach Firman Utina",
        medic: "Zaki Al-Amri",
        phone: "0819-8899-0011",
        jerseyHome: "Kuning - Hitam",
        jerseyAway: "Putih - Hijau"
      },
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

    // GRUP C (KATEGORI SD)
    {
      id: "T09",
      name: "SD MTQ Al-Fayyadh",
      shortName: "AL-FAYYADH",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#721c24",
      city: "Ma'had Al-Fayyadh",
      official: {
        manager: "Ust. H. Ahmad Al-Fayyadh",
        coach: "Coach Syahril Ramadhan",
        coachPhoto: "assets/coach_bayu.jpg",
        medic: "Zulfikar, S.Kep",
        phone: "0812-9900-1122",
        jerseyHome: "Maroon - Emas (ACC Official)",
        jerseyAway: "Putih - Emas"
      },
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
      id: "T10",
      name: "SD Islam Nurul Fikri",
      shortName: "NURUL FIKRI",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#6366f1",
      city: "Serang",
      official: {
        manager: "Ust. Rahmat Hidayatullah",
        coach: "Coach Indra Sjafriadi",
        medic: "Yudi Purnomo",
        phone: "0813-0011-2233",
        jerseyHome: "Navy - Merah",
        jerseyAway: "Abu-abu - Navy"
      },
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
      id: "T11",
      name: "MI Al-Kahfi",
      shortName: "AL-KAHFI",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#f97316",
      city: "Bogor Selatan",
      official: {
        manager: "Ust. Zainuddin",
        coach: "Coach Arif Rahman",
        medic: "Miftah Fauzi",
        phone: "0856-1122-3344",
        jerseyHome: "Oranye - Putih",
        jerseyAway: "Hitam - Oranye"
      },
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
      id: "T12",
      name: "SD IT Global Cendekia",
      shortName: "GLOBAL C.",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#0ea5e9",
      city: "Tangerang Selatan",
      official: {
        manager: "Ir. Gunawan Wibisono",
        coach: "Coach Ronald",
        medic: "Slamet Riyadi",
        phone: "0818-2233-4455",
        jerseyHome: "Sky Blue - Hitam",
        jerseyAway: "Putih - Sky Blue"
      },
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

    // GRUP D (KATEGORI SD)
    {
      id: "T13",
      name: "SD Bina Bangsa Mandiri",
      shortName: "BINA BANGSA",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#ef4444",
      city: "Bekasi Timur",
      official: {
        manager: "Drs. Joko Purwanto",
        coach: "Coach Danurwindo",
        medic: "Budi Santoso",
        phone: "0811-3344-5566",
        jerseyHome: "Merah - Putih",
        jerseyAway: "Hitam - Merah"
      },
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
      id: "T14",
      name: "MI Ar-Rahman Islamic",
      shortName: "AR-RAHMAN",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#a855f7",
      city: "Sukabumi",
      official: {
        manager: "Ust. Fathurrahman",
        coach: "Coach Benny Dollo",
        medic: "Yayan Rohian",
        phone: "0812-4455-6677",
        jerseyHome: "Ungu Muda - Putih",
        jerseyAway: "Kuning Kunyit"
      },
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
      id: "T15",
      name: "SD Insan Cendekia",
      shortName: "INSAN C.",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#10b981",
      city: "Serpong",
      official: {
        manager: "Dr. H. Sulaiman",
        coach: "Coach Rahmad Darmawan",
        medic: "Fikri Haidar",
        phone: "0813-5566-7788",
        jerseyHome: "Hijau - Abu-abu",
        jerseyAway: "Putih - Hijau"
      },
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
      id: "T16",
      name: "SD Patriot Mandiri",
      shortName: "PATRIOT",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#f43f5e",
      city: "Karawang",
      official: {
        manager: "Drs. Hendro Siswanto",
        coach: "Coach Aji Santoso",
        medic: "Agus Salim",
        phone: "0857-6677-8899",
        jerseyHome: "Merah Marun - Hitam",
        jerseyAway: "Putih - Merah"
      },
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
    }
  ],

  // MATCHES (Group Stage + Knockout)
  matches: [
    // DAY 1 - Matchday 1
    {
      id: "M01",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T01",
      awayId: "T02",
      homeScore: 3,
      awayScore: 1,
      status: "finished", // "upcoming", "live", "finished"
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
      group: "A",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
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
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
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
      group: "B",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
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

    // DAY 1 - Sesi Siang (Grup C & D)
    {
      id: "M05",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T09",
      awayId: "T10",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      scorers: [
        { team: "T09", player: "Faiz Al-Baqir", minute: "5'" },
        { team: "T10", player: "Faiq Al-Hafiz", minute: "9'" },
        { team: "T09", player: "Aiman Muzaffar", minute: "16'" },
        { team: "T10", player: "Rakan Syakir", minute: "22'" },
        { team: "T09", player: "Ziyad Rabbani", minute: "29'" }
      ],
      cards: [
        { team: "T09", player: "Faiz Al-Baqir", type: "yellow", minute: "18'" },
        { team: "T10", player: "Faiq Al-Hafiz", type: "yellow", minute: "25'" }
      ]
    },
    {
      id: "M06",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T11",
      awayId: "T12",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T11", player: "Rayyan Malik", minute: "7'" },
        { team: "T12", player: "Kevin Sanjaya", minute: "14'" },
        { team: "T11", player: "Syauqi Rahman", minute: "24'" }
      ],
      cards: [
        { team: "T11", player: "Rayyan Malik", type: "yellow", minute: "12'" }
      ]
    },
    {
      id: "M07",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T13",
      awayId: "T14",
      homeScore: 4,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T13", player: "Witan Sulaeman", minute: "4'" },
        { team: "T13", player: "Ramadhan Sananta", minute: "11'" },
        { team: "T14", player: "M. Fauzan", minute: "18'" },
        { team: "T13", player: "Egy Maulana", minute: "23'" },
        { team: "T13", player: "Ramadhan Sananta", minute: "27'" }
      ],
      cards: [
        { team: "T14", player: "Habibi Syafiq", type: "yellow", minute: "15'" }
      ]
    },
    {
      id: "M08",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "15 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T15",
      awayId: "T16",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      scorers: [
        { team: "T15", player: "Bagus Kahfi", minute: "8'" },
        { team: "T16", player: "David Da Silva", minute: "17'" },
        { team: "T15", player: "Marselino Ferdinan", minute: "25'" }
      ],
      cards: [
        { team: "T16", player: "Achmad Jufriyanto", type: "yellow", minute: "21'" }
      ]
    },

    // DAY 2 - Matchday 2 (With Live Match Sample!)
    {
      id: "M09",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
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
      id: "M10",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
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
        { team: "T02", player: "Syamil Basayev", type: "yellow", minute: "22'" }, // Syamil acumulates 2 YC -> Suspended!
        { team: "T02", player: "Taufiq Hidayat", type: "yellow", minute: "26'" }
      ]
    },
    {
      id: "M11",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
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
      id: "M12",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T06",
      awayId: "T08",
      homeScore: 2,
      awayScore: 2,
      status: "live", // Currently LIVE!
      liveMinute: "24'",
      homeScoreLive: 2,
      awayScoreLive: 2,
      scorers: [
        { team: "T06", player: "Ghazi Al-Ghazi", minute: "8'" },
        { team: "T08", player: "Husain Al-Kaff", minute: "11'" },
        { team: "T08", player: "Nizar Al-Attas", minute: "17'" },
        { team: "T06", player: "Al-Barra", minute: "21'" }
      ],
      cards: [
        { team: "T08", player: "Husain Al-Kaff", type: "yellow", minute: "15'" },
        { team: "T05", player: "Tariq Ziyad", type: "yellow", minute: "20'" }
      ]
    },

    // UPCOMING MATCHES
    {
      id: "M13",
      group: "C",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T09",
      awayId: "T11",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M14",
      group: "C",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T10",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M15",
      group: "D",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T13",
      awayId: "T15",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M16",
      group: "D",
      stage: "group",
      matchday: 2,
      date: "16 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T14",
      awayId: "T16",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // DAY 3 - Matchday 3 (Decisive Group Stage)
    {
      id: "M17",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "08:00 - 08:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T01",
      awayId: "T04",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M18",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "09:00 - 09:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T02",
      awayId: "T03",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M19",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "10:00 - 10:45 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T05",
      awayId: "T08",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M20",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "11:00 - 11:45 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T06",
      awayId: "T07",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M21",
      group: "C",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "13:30 - 14:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T09",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M22",
      group: "C",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "14:30 - 15:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T10",
      awayId: "T11",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M23",
      group: "D",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "15:30 - 16:15 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homeId: "T13",
      awayId: "T16",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M24",
      group: "D",
      stage: "group",
      matchday: 3,
      date: "17 Nov 2026",
      time: "16:30 - 17:15 WIB",
      pitch: "Lapangan 2 (Sintetis)",
      homeId: "T14",
      awayId: "T15",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // KNOCKOUT STAGE (Perempat Final / Quarterfinals)
    {
      id: "QF1",
      stage: "knockout",
      roundName: "Perempat Final 1",
      date: "18 Nov 2026",
      time: "08:30 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Juara Grup A",
      awayPlaceholder: "Runner-up Grup B",
      homeId: "T01",
      awayId: "T06",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF2",
      stage: "knockout",
      roundName: "Perempat Final 2",
      date: "18 Nov 2026",
      time: "09:30 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Juara Grup C",
      awayPlaceholder: "Runner-up Grup D",
      homeId: "T09",
      awayId: "T15",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF3",
      stage: "knockout",
      roundName: "Perempat Final 3",
      date: "18 Nov 2026",
      time: "10:30 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Juara Grup B",
      awayPlaceholder: "Runner-up Grup A",
      homeId: "T05",
      awayId: "T02",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "QF4",
      stage: "knockout",
      roundName: "Perempat Final 4",
      date: "18 Nov 2026",
      time: "13:30 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Juara Grup D",
      awayPlaceholder: "Runner-up Grup C",
      homeId: "T13",
      awayId: "T10",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // SEMIFINALS
    {
      id: "SF1",
      stage: "knockout",
      roundName: "Semifinal 1",
      date: "19 Nov 2026",
      time: "09:00 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Pemenang QF1",
      awayPlaceholder: "Pemenang QF2",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "SF2",
      stage: "knockout",
      roundName: "Semifinal 2",
      date: "19 Nov 2026",
      time: "10:30 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Pemenang QF3",
      awayPlaceholder: "Pemenang QF4",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // 3RD PLACE & GRAND FINAL
    {
      id: "3RD",
      stage: "knockout",
      roundName: "Perebutan Tempat Ke-3",
      date: "20 Nov 2026",
      time: "14:00 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Kalah SF1",
      awayPlaceholder: "Kalah SF2",
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "FINAL",
      stage: "knockout",
      roundName: "🏆 GRAND FINAL 🏆",
      date: "20 Nov 2026",
      time: "16:00 WIB",
      pitch: "Lapangan 1 (Vinyl Utama)",
      homePlaceholder: "Pemenang SF1",
      awayPlaceholder: "Pemenang SF2",
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
