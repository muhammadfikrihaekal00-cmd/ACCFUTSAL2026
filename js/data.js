// data.js - Turnamen ACC "Al-Fayyadh Champions Cup" 2026 (Maros & Makassar)
// Kategori: 16 Tim SMP + 16 Tim SD (Total 32 Tim)
// Pemain: Bintang Sepak Bola Eropa
// Tanggal: 22 - 26 November 2026 (5 Hari, 1 Lapangan Utama)

const DEFAULT_DATA = {
  config: {
    tournamentName: 'ACC "Al-Fayyadh Champions Cup" 2026',
    subTitle: "Turnamen Futsal Antar-Sekolah & Pesantren se-Sulawesi Selatan • Ma'had Tahfizhul Qur'an Al Fayyadh Maros",
    edition: "ACC Edisi 2026 (Makassar & Maros)",
    venue: "GOR Futsal MTQ Al-Fayyadh Maros",
    pitch1Name: "Lapangan Utama (Vinyl)",
    pitch2Name: "Lapangan Utama (Vinyl)",
    dates: "22 - 26 November 2026",
    adminPinHash: "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348",
    runningAnnouncement: "🏆 Selamat Datang di ACC 'Al-Fayyadh Champions Cup' 2026 Ma'had Tahfizhul Qur'an Al Fayyadh Maros! Total 32 Tim (16 SMP & 16 SD) se-Makassar, Maros, Pangkep, dan Luwu. 5 Hari Pertandingan (22-26 Nov 2026). Junjung tinggi sportivitas, ukhuwah Islamiyah, dan fair play!",
    contactCommittee: "0812-9876-5432 (Panitia ACC - Sie. Pertandingan)",
    heroBannerImage: "assets/hero_banner.jpg",
    youtubeLiveUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
    youtubeLiveTitle: "🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros",
    rulesText: `
### 1. FORMAT & KATEGORI TURNAMEN
- Turnamen diselenggarakan dalam 2 Kategori Resmi: **Kategori SMP (U-15)** dan **Kategori SD (U-12)**.
- Setiap kategori diikuti oleh **16 Tim Sekolah & Pesantren** yang dibagi ke dalam 4 Grup (**Grup A, B, C, D**), masing-masing grup berisi 4 tim.
- Babak Penyisihan menggunakan sistem setengah kompetisi (round-robin).
- **Juara dan Runner-up** dari masing-masing grup (total 8 tim per kategori) melaju ke Babak 8 Besar (Perempat Final).
- Babak Gugur (Perempat Final, Semifinal, Perebutan Juara 3, dan Grand Final) menggunakan sistem gugur tunggal (knockout).

### 2. DURASI PERTANDINGAN & 1 LAPANGAN UTAMA
- Turnamen berlangsung selama 5 Hari (22 - 26 November 2026) di **Lapangan Utama (Vinyl)**.
- Fase Grup & Perempat Final: 2 x 15 Menit (Waktu Kotor), istirahat 3 menit.
- Semifinal & Grand Final: 2 x 20 Menit (Waktu Kotor), istirahat 5 menit.
- Sistem Poin Fase Grup: Menang = 3 Poin, Seri = 1 Poin, Kalah = 0 Poin.
- Jika babak gugur berakhir imbang, dilanjutkan adu penalti (3 penendang, lalu sudden death).

### 3. PENENTUAN KLASEMEN GRUP (TIEBREAKER)
1. Poin tertinggi
2. Selisih Gol (SG) terbaik
3. Jumlah Gol Memasukkan (GM) terbanyak
4. Pertemuan Langsung (Head-to-head)
5. Poin Disiplin / Fair Play (kartu paling sedikit)
6. Undian koin oleh Pengawas Pertandingan resmi
`
  },
  homeData: {
    mvp: {
      name: "Erling Haaland",
      number: 9,
      team: "SMP 5 Mandai",
      teamShort: "SMP 5 MANDAI",
      position: "Pivot",
      photo: "assets/mvp_player.jpg",
      goals: 4,
      assists: 2,
      rating: "9.8",
      motmCount: 2,
      quote: "Bermain dengan disiplin tinggi, saling menghormati di atas lapangan, dan mempererat tali ukhuwah santri se-Sulawesi Selatan."
    },
    news: [
      {
        id: "N1",
        tag: "KILAS PEMBUKAAN",
        title: "Technical Meeting 32 Sekolah Peserta ACC 2026 Sukses Digelar",
        desc: "Dihadiri official 16 tim SMP dan 16 tim SD dari Maros, Makassar, Pangkep, dan Luwu di GOR MTQ Al-Fayyadh. Kesepakatan fair play ditandatangani.",
        date: "21 November 2026",
        badge: "Resmi"
      },
      {
        id: "N2",
        tag: "PERBURUAN TIKET 8 BESAR",
        title: "Persaingan Sengit Menuju Babak Gugur SMP & SD se-Sulsel",
        desc: "Laga panas tersaji di Lapangan Utama GOR Al-Fayyadh Maros. Tim-tim unggulan saling berebut 2 tiket teratas menuju perempat final.",
        date: "23 November 2026",
        badge: "Sorotan"
      },
      {
        id: "N3",
        tag: "AKHLAK & SPORTIVITAS",
        title: "Ketertiban Suporter & Jeda Shalat Berjamaah Ditegakkan",
        desc: "Panitia mengapresiasi kebersihan suporter tamu dan mengingatkan jeda laga setiap kali adzan berkumandang di komplek pesantren.",
        date: "23 November 2026",
        badge: "Tata Tertib"
      }
    ],
    moments: [
      {
        id: "M1",
        title: "Selebrasi Kemenangan Menit Akhir",
        player: "Erling Haaland (#9)",
        team: "SMP 5 Mandai",
        tag: "NEW",
        badge: "🔥 MATCHDAY HIGHLIGHT",
        image: "assets/moment_celebration.jpg",
        caption: "Selebrasi penuh semangat skuad SMP 5 Mandai usai memastikan kemenangan dramatis di hadapan ratusan suporter."
      },
      {
        id: "M2",
        title: "Penyelamatan Heroik Menit 29'",
        player: "Gianluigi Donnarumma (#1)",
        team: "SMP 5 Mandai",
        tag: "NEW",
        badge: "🧤 SAVE OF THE DAY",
        image: "assets/moment_gk_save.jpg",
        caption: "Aksi terbang spektakuler menepis tendangan bebas roket tepat di pojok atas gawang demi mengamankan poin penuh."
      },
      {
        id: "M3",
        title: "Tendangan Roket Voli Spektakuler",
        player: "Kylian Mbappe (#10)",
        team: "SMP 16 Mandai",
        tag: "NEW",
        badge: "🚀 GOAL OF THE TOURNAMENT",
        image: "assets/moment_strike.jpg",
        caption: "Sepakan first-time voli meluncur deras menghujam gawang lawan dan disambut gemuruh suporter di GOR MTQ Al-Fayyadh."
      },
      {
        id: "M4",
        title: "Momen Trofi Bergilir ACC 2026",
        player: "Calon Juara Turnamen",
        team: "Ma'had Al-Fayyadh Arena",
        tag: "HOT",
        badge: "🏆 CHAMPION MOMENT",
        image: "assets/moment_trophy.jpg",
        caption: "Piala bergilir ACC 2026 dipamerkan di panggung kehormatan, menunggu sang juara sejati kompetisi futsal tahun ini."
      }
    ],
    sponsors: {
      platinum: [
        { name: "Bank Syariah Al-Barakah", type: "Official Banking Partner", icon: "🏛️" },
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

  // 32 TIM: 16 SMP + 16 SD (DENGAN NAMA PEMAIN BINTANG EROPA)
  teams: [
    // ==========================================
    // KATEGORI SMP (16 TIM: T01 - T16)
    // ==========================================
    // GRUP A SMP
    {
      id: "T01",
      name: "SMP 5 Mandai",
      shortName: "SMP 5 MANDAI",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#0284c7",
      city: "Maros",
      official: { manager: "Ust. Syamsuddin, S.Pd", coach: "Coach Pep Guardiola", phone: "0812-4411-2233", jerseyHome: "Biru Langit - Putih", jerseyAway: "Hitam - Perak" },
      players: [
        { no: 1, name: "Gianluigi Donnarumma", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/moment_gk_save.jpg" },
        { no: 3, name: "Julian Ryerson", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Martin Odegaard", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Erling Haaland (C)", pos: "Pivot", goals: 4, yc: 0, rc: 0, photo: "assets/player_athar.jpg" },
        { no: 11, name: "Alexander Sorloth", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Mike Maignan", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Leo Ostigard", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Oscar Bobb", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T02",
      name: "SMP 16 Mandai",
      shortName: "SMP 16 MANDAI",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#e11d48",
      city: "Maros",
      official: { manager: "Ust. Rahmat Hidayat", coach: "Coach Didier Deschamps", phone: "0813-5522-3344", jerseyHome: "Merah - Putih", jerseyAway: "Biru Navy" },
      players: [
        { no: 1, name: "Thibaut Courtois", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "William Saliba", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Antoine Griezmann", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Kylian Mbappe (C)", pos: "Pivot", goals: 4, yc: 0, rc: 0 },
        { no: 11, name: "Ousmane Dembele", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Yann Sommer", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Eduardo Camavinga", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Marcus Thuram", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T03",
      name: "MA'HAD HABIBURRAHMAN A",
      shortName: "HABIBURRAHMAN A",
      category: "SMP",
      logo: "assets/habiburrahman_logo.jpg",
      group: "A",
      badgeColor: "#16a34a",
      city: "Maros",
      official: { manager: "Coach Ade Irzan Rizaldi", coach: "Coach Reyfhank AL", medic: "Muh. Yusnul Maulana Syam", phone: "-", jerseyHome: "-", jerseyAway: "-" },
      players: [
        { no: 12, name: "Baso Hasbi", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Naufal Abeng", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Muh. Alfatih Basmin", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Fayyadh Arghad", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 87, name: "Fikran Mustanir", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Faqih Hilwan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 25, name: "Haekal", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Abu Bakar", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 78, name: "Iqrha Al-Gifary Vemal", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 30, name: "Muh. Resqy Naufal Faisal", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Abdullah Arrayyan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 99, name: "Abdurrahman Al-Faruq", pos: "Kiper", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T04",
      name: "IQIS",
      shortName: "IQIS SMP",
      category: "SMP",
      logo: "",
      group: "A",
      badgeColor: "#d97706",
      city: "Makassar",
      official: { manager: "Ust. Fadhil Rahman", coach: "Coach Roberto Martinez", phone: "0852-7744-5566", jerseyHome: "Marun - Emas", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Diogo Costa", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Ruben Dias", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Bruno Fernandes", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 7, name: "Cristiano Ronaldo (C)", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 10, name: "Bernardo Silva", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Rui Patricio", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Joao Palhinha", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Rafael Leao", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },

    // GRUP B SMP
    {
      id: "T05",
      name: "AHIS",
      shortName: "AHIS SMP",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#2563eb",
      city: "Makassar",
      official: { manager: "Ust. Irwan Saputra", coach: "Coach Zlatko Dalicc", phone: "0812-8855-6677", jerseyHome: "Kotak Merah-Putih", jerseyAway: "Hitam - Biru" },
      players: [
        { no: 1, name: "Dominik Livakovicc", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Josko Gvardiol", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Luka Modricc (C)", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 9, name: "Andrej Kramaricc", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 8, name: "Mateo Kovacic", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Nediljko Labrovicc", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Marcelo Brozovicc", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Ivan Perisic", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T06",
      name: "Al-Akhyar",
      shortName: "AL-AKHYAR SMP",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#dc2626",
      city: "Makassar",
      official: { manager: "Ust. Burhanuddin", coach: "Coach Luis de la Fuente", phone: "0813-9966-7788", jerseyHome: "Merah - Emas", jerseyAway: "Kuning - Biru" },
      players: [
        { no: 1, name: "Unai Simon", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Dani Carvajal", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Rodri (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 19, name: "Lamine Yamal", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 7, name: "Alvaro Morata", pos: "Pivot", goals: 1, yc: 0, rc: 0 },
        { no: 13, name: "Alex Remiro", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Fabian Ruiz", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Nico Williams", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T07",
      name: "SMPIT Al Madinah",
      shortName: "AFC AL-MADINAH",
      category: "SMP",
      logo: "assets/teams/T07/logo.jpg",
      group: "C",
      badgeColor: "#059669",
      city: "Maros",
      official: { manager: "Nabil", managerPhoto: "assets/teams/T07/manager.jpg", coach: "Muh. Imam S, S.Pd", coachPhoto: "assets/teams/T07/coach.jpg", medic: "Alghy", phone: "0822-1177-8899", jerseyHome: "Hitam - Emas", jerseyAway: "Putih - Abu" },
      players: [
        { no: 1, name: "Dizam-Azzam", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_1.jpg" },
        { no: 4, name: "Shafar", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_4.jpg" },
        { no: 8, name: "Alwan-Aufan", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_8.jpg" },
        { no: 9, name: "Ubaid", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_9.jpg" },
        { no: 10, name: "Abdullah", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_10.jpg" },
        { no: 12, name: "Aqil", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_12.jpg" },
        { no: 13, name: "Naufal", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_13.jpg" },
        { no: 27, name: "Danis", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_27.jpg" },
        { no: 71, name: "Hisyam", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_71.jpg" },
        { no: 99, name: "Rinra", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T07/p_99.jpg" }
      ]
    },
    {
      id: "T08",
      name: "SMPIT Al Hikmah",
      shortName: "AL-HIKMAH SMP",
      category: "SMP",
      logo: "",
      group: "B",
      badgeColor: "#9333ea",
      city: "Maros",
      official: { manager: "Ust. Lukman Hakim", coach: "Coach Michal Probierz", phone: "0853-2288-9900", jerseyHome: "Putih - Merah", jerseyAway: "Ungu - Putih" },
      players: [
        { no: 1, name: "Wojciech Szczesny", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Jakub Kiwior", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Piotr Zielinski", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Robert Lewandowski (C)", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 21, name: "Nicola Zalewski", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Lukasz Skorupski", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Jan Bednarek", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Sebastian Szymanski", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP C SMP
    {
      id: "T09",
      name: "SMPN 1 Maros",
      shortName: "SMPN 1 MAROS",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#0d9488",
      city: "Maros",
      official: { manager: "H. Sudirman, S.Pd", coach: "Coach Julian Nagelsmann", phone: "0812-3399-0011", jerseyHome: "Putih - Hitam", jerseyAway: "Pink - Ungu" },
      players: [
        { no: 1, name: "Manuel Neuer", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Antonio Rudiger", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Joshua Kimmich", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 10, name: "Jamal Musiala (C)", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 17, name: "Florian Wirtz", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 22, name: "Oliver Baumann", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Jonathan Tah", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Kai Havertz", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T10",
      name: "SMPN 2 Maros",
      shortName: "SMPN 2 MAROS",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#ea580c",
      city: "Maros",
      official: { manager: "Drs. Bahtiar, M.M", coach: "Coach Ronald Koeman", phone: "0813-4400-1122", jerseyHome: "Oranye - Hitam", jerseyAway: "Biru - Putih" },
      players: [
        { no: 1, name: "Bart Verbruggen", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Virgil van Dijk (C)", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 14, name: "Tijjani Reijnders", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 7, name: "Xavi Simons", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Cody Gakpo", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 13, name: "Mark Flekken", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Nathan Ake", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Memphis Depay", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T11",
      name: "Pesantren Hj. Haniah Maros",
      shortName: "PESANTREN HANIAH",
      category: "SMP",
      logo: "assets/pesantren_haniah_logo.jpg",
      group: "C",
      badgeColor: "#047857",
      city: "Maros",
      official: { manager: "Muhammad Idris, S.Pd.", coach: "Abd. Rahmat, S.Pd.I., M.Pd.", coachPhoto: "assets/coach_t11_haniah.jpg", phone: "0821-5511-2233", jerseyHome: "Putih - Biru", jerseyAway: "" },
      players: [
        { no: 1, name: "Gibran Fauzan Samana", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 25, name: "Wira Noval", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Muh. Syabil", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "M. Fatur", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Faturrahman", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Muh Arya Jaya Putera", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Andi Alif Permana", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Muh. Dimasqi Atras", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 29, name: "Mochammad Fadhil", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 30, name: "Muh Faiz Urbun Anaqi", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 67, name: "Muh Alif Al-Fajri", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Muh Syahril", pos: "Anchor", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T12",
      name: "Pesantren Shohwatul Is'ad Pangkep",
      shortName: "SHOHWATUL IS'AD",
      category: "SMP",
      logo: "",
      group: "C",
      badgeColor: "#b91c1c",
      city: "Pangkep",
      official: { manager: "Ust. Masrur, S.Pd.I", coach: "Coach Murat Yakin", phone: "0852-6622-3344", jerseyHome: "Merah - Putih", jerseyAway: "Hitam - Merah" },
      players: [
        { no: 1, name: "Gregor Kobel", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Manuel Akanji", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Granit Xhaka (C)", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 7, name: "Breel Embolo", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 19, name: "Dan Ndoye", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Yvon Mvogo", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Denis Zakaria", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Michel Aebischer", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP D SMP
    {
      id: "T13",
      name: "SMP Alfayyadh",
      shortName: "SMP AL-FAYYADH",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#15803d",
      city: "Maros",
      official: { manager: "Ust. Muhammad Fikri Haekal", coach: "Coach Carlo Ancelotti", phone: "0812-9876-5432", jerseyHome: "Hijau Emerald - Emas", jerseyAway: "Putih - Hijau" },
      players: [
        { no: 1, name: "Andriy Lunin", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "David Alaba", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Toni Kroos (C)", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 13, name: "Thomas Muller", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 22, name: "Ilkay Gundogan", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Sven Ulreich", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Marcel Sabitzer", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Christoph Baumgartner", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T14",
      name: "SMPIT QA",
      shortName: "SMPIT QA",
      category: "SMP",
      logo: "",
      group: "D",
      badgeColor: "#4f46e5",
      city: "Makassar",
      official: { manager: "Ust. Qasim Basalamah", coach: "Coach Kasper Hjulmand", phone: "0813-7733-4455", jerseyHome: "Merah - Putih", jerseyAway: "Biru - Putih" },
      players: [
        { no: 1, name: "Kasper Schmeichel", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Andreas Christensen", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Christian Eriksen (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Rasmus Hojlund", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 14, name: "Mikkel Damsgaard", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Frederik Ronnow", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 23, name: "Pierre-Emile Hojbjerg", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Jonas Wind", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T15",
      name: "Mahad Imam Bukhari",
      shortName: "IMB FC",
      category: "SMP",
      logo: "assets/teams/T15/logo.jpg",
      group: "D",
      badgeColor: "#0284c7",
      city: "Maros",
      official: { manager: "Ust. Bukhari", coach: "Coach IMB", phone: "-", jerseyHome: "Biru - Putih", jerseyAway: "Hitam" },
      players: [
        { no: 1, name: "Afif Fidaus", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_1.jpg" },
        { no: 2, name: "Ahmad Al Bukhari", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_2.jpg" },
        { no: 3, name: "Al Safwan", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_3.jpg" },
        { no: 4, name: "Dzar Andar", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_4.jpg" },
        { no: 5, name: "Hammad", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_5.jpg" },
        { no: 6, name: "Muhammad Afif Ghozali", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_6.jpg" },
        { no: 7, name: "Muhammad Dayyan", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_7.jpg" },
        { no: 8, name: "Muhammad Rafa Azka", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_8.jpg" },
        { no: 9, name: "Muhammad Zakaria", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_9.jpg" },
        { no: 10, name: "Ubaidillah", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_10.jpg" },
        { no: 11, name: "Wahid Ramadhan", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T15/p_11.jpg" }
      ]
    },
    {
      id: "T16",
      name: "SMP Habiburrahman Luwu",
      shortName: "HABIBURRAHMAN B",
      category: "SMP",
      logo: "assets/teams/T16/logo.jpg",
      group: "D",
      badgeColor: "#16a34a",
      city: "Luwu",
      official: { manager: "Coach Habiburrahman B", coach: "Coach Habiburrahman B", phone: "-", jerseyHome: "Hijau - Putih", jerseyAway: "Hitam" },
      players: [
        { no: 1, name: "Aimar Fadhil Nasrullah", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_1.jpg" },
        { no: 2, name: "Alif Mustafa Ahmad", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_2.jpg" },
        { no: 3, name: "Muh. Resky Maulana", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_3.jpg" },
        { no: 4, name: "Muh.Imam Buhari", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_4.jpg" },
        { no: 5, name: "Muh.Razzaq Dzulhijjah", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_5.jpg" },
        { no: 6, name: "Muh.Tegar Al-Gifari", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_6.jpg" },
        { no: 7, name: "Rey Alteza Bilfaqih", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_7.jpg" },
        { no: 8, name: "Stiev Jihad Abdullah", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_8.jpg" },
        { no: 9, name: "Zahir Zacky Mustapa", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_9.jpg" },
        { no: 10, name: "Zakir Zacky Mustapa", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T16/p_10.jpg" }
      ]
    },

    // ==========================================
    // KATEGORI SD (16 TIM: T17 - T32)
    // ==========================================
    // GRUP A SD
    {
      id: "T17",
      name: "IQIS MAKASSAR",
      shortName: "IQIS SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#0284c7",
      city: "Makassar",
      official: { manager: "Ust. Zulkifli, S.Pd", coach: "Coach Sir Alex Ferguson", phone: "0812-1001-2001", jerseyHome: "Biru - Emas", jerseyAway: "Putih - Biru" },
      players: [
        { no: 1, name: "Joe Hart", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Rio Ferdinand", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "David Beckham (C)", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 10, name: "Wayne Rooney", pos: "Pivot", goals: 4, yc: 0, rc: 0 },
        { no: 8, name: "Steven Gerrard", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 13, name: "Ben Foster", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "John Terry", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Frank Lampard", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T18",
      name: "AHIS MAKASSAR",
      shortName: "AHIS SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#2563eb",
      city: "Makassar",
      official: { manager: "Ust. Syarifuddin", coach: "Coach Arsene Wenger", phone: "0813-2002-3002", jerseyHome: "Biru Navy - Merah", jerseyAway: "Putih - Biru" },
      players: [
        { no: 1, name: "Fabien Barthez", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Eric Abidal", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Zinedine Zidane (C)", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 14, name: "Thierry Henry", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 7, name: "Franck Ribery", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 16, name: "Gregory Coupet", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Patrick Vieira", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Karim Benzema", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T19",
      name: "AL-AKHYAR MAKASSAR",
      shortName: "AL-AKHYAR SD",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#dc2626",
      city: "Makassar",
      official: { manager: "Ust. Basri Kasim", coach: "Coach Vicente del Bosque", phone: "0821-3003-4003", jerseyHome: "Merah - Biru", jerseyAway: "Putih - Emas" },
      players: [
        { no: 1, name: "Iker Casillas (C)", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Sergio Ramos", pos: "Anchor", goals: 1, yc: 0, rc: 0 },
        { no: 8, name: "Andres Iniesta", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 6, name: "Xavi Hernandez", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Fernando Torres", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 12, name: "Victor Valdes", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Carles Puyol", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 21, name: "David Silva", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T20",
      name: "QOF",
      shortName: "QOF",
      category: "SD",
      logo: "",
      group: "A",
      badgeColor: "#1e3a8a",
      city: "Makassar",
      official: { manager: "Ust. Qudamah Mansyur", coach: "Coach Marcello Lippi", phone: "0852-4004-5004", jerseyHome: "Biru Tua - Putih", jerseyAway: "Kuning - Hitam" },
      players: [
        { no: 1, name: "Gianluigi Buffon (C)", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Paolo Maldini", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 21, name: "Andrea Pirlo", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Alessandro Del Piero", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 8, name: "Gennaro Gattuso", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Francesco Toldo", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Fabio Cannavaro", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Filippo Inzaghi", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },

    // GRUP B SD
    {
      id: "T21",
      name: "SDIT QA",
      shortName: "SDIT QA",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#ea580c",
      city: "Makassar",
      official: { manager: "Ust. Qashim Abdullah", coach: "Coach Louis van Gaal", phone: "0812-5005-6005", jerseyHome: "Oranye - Putih", jerseyAway: "Biru - Hitam" },
      players: [
        { no: 1, name: "Edwin van der Sar", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Jaap Stam", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Wesley Sneijder (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 9, name: "Robin van Persie", pos: "Pivot", goals: 4, yc: 0, rc: 0 },
        { no: 11, name: "Arjen Robben", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 12, name: "Maarten Stekelenburg", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Edgar Davids", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Ruud van Nistelrooy", pos: "Pivot", goals: 1, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T22",
      name: "SDIT AL MADINAH",
      shortName: "AL-MADINAH SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#059669",
      city: "Maros",
      official: { manager: "Ust. Munir Syam", coach: "Coach Joachim Low", phone: "0813-6006-7006", jerseyHome: "Hijau Daun - Putih", jerseyAway: "Merah - Hitam" },
      players: [
        { no: 1, name: "Oliver Kahn", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Philipp Lahm (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Bastian Schweinsteiger", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Miroslav Klose", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 10, name: "Mesut Ozil", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Jens Lehmann", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Mats Hummels", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Mario Gotze", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T23",
      name: "SDIT AL HIKMAH",
      shortName: "AL-HIKMAH SD",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#7c3aed",
      city: "Maros",
      official: { manager: "Ust. Taufik Hidayat", coach: "Coach Roberto Martinez", phone: "0821-7007-8007", jerseyHome: "Ungu - Kuning", jerseyAway: "Putih - Ungu" },
      players: [
        { no: 1, name: "Thibaut Courtois", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Vincent Kompany (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Eden Hazard", pos: "Flank", goals: 3, yc: 0, rc: 0 },
        { no: 8, name: "Marouane Fellaini", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 11, name: "Dries Mertens", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Simon Mignolet", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Jan Vertonghen", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Christian Benteke", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T24",
      name: "SDIT IBNU RAJAB",
      shortName: "IBNU RAJAB",
      category: "SD",
      logo: "",
      group: "B",
      badgeColor: "#15803d",
      city: "Maros",
      official: { manager: "Ust. Rajab Al-Makassari", coach: "Coach Fernando Santos", phone: "0852-8008-9008", jerseyHome: "Hijau Lumut - Putih", jerseyAway: "Marun - Emas" },
      players: [
        { no: 1, name: "Vitor Baia", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Ricardo Carvalho", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Luis Figo (C)", pos: "Flank", goals: 2, yc: 0, rc: 0 },
        { no: 10, name: "Rui Costa", pos: "Pivot", goals: 2, yc: 0, rc: 0 },
        { no: 20, name: "Deco", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Ricardo Pereira", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Pepe", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Nani", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP C SD
    {
      id: "T25",
      name: "Kuttab Nurul wahyain",
      shortName: "NURUL WAHYAIN",
      category: "SD",
      logo: "",
      group: "C",
      badgeColor: "#b45309",
      city: "Maros",
      official: { manager: "Ust. Wahyuddin, S.Pd", coach: "Coach Ryan Giggs", phone: "0812-9009-0001", jerseyHome: "Cokelat Emas - Putih", jerseyAway: "Hitam - Merah" },
      players: [
        { no: 1, name: "Wayne Hennessey", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Ashley Williams (C)", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Aaron Ramsey", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 11, name: "Gareth Bale", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 7, name: "Daniel James", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 12, name: "Danny Ward", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Ben Davies", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Kieffer Moore", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T26",
      name: "UPT SPF SD INPRES PAJJAIANG",
      shortName: "SIPA FC",
      category: "SD",
      logo: "assets/teams/T26/logo.jpg",
      group: "C",
      badgeColor: "#0284c7",
      city: "Makassar",
      official: { manager: "Manager SIPA FC", managerPhoto: "assets/teams/T26/manager.jpg", coach: "Pelatih SIPA FC", coachPhoto: "assets/teams/T26/coach.jpg", phone: "0813-0010-1002", jerseyHome: "Kuning - Biru", jerseyAway: "Putih - Biru" },
      players: [
        { no: 1, name: "Abinaya Azka Masagena", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_1.jpg" },
        { no: 11, name: "Akbar Nurdaffah", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_2.jpg" },
        { no: 12, name: "Dimas Triputra Arisandy", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_3.jpg" },
        { no: 10, name: "Fadli Adrian", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_4.jpg" },
        { no: 9, name: "Faizal Ode", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_5.jpg" },
        { no: 14, name: "MT Dyandra Raffasya P", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_6.jpg" },
        { no: 5, name: "Muh Ali Muttaqin", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_7.jpg" },
        { no: 24, name: "Muh Dzaky Paloloi", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_8.jpg" },
        { no: 17, name: "Muh Mirza Aditya Ibnu", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_9.jpg" },
        { no: 18, name: "Rafli Nur Wahid", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_10.jpg" },
        { no: 6, name: "Rifki Nahlan Syauqi", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_11.jpg" },
        { no: 80, name: "Rizqi Nahlan Syauqi", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T26/p_12.jpg" }
      ]
    },
    {
      id: "T27",
      name: "UPTD SDN 82 PATTENE (TIM A)",
      shortName: "PATTENE A",
      category: "SD",
      logo: "assets/teams/T27/logo.jpg",
      group: "C",
      badgeColor: "#047857",
      city: "Maros",
      official: { manager: "Official Pattene A", coach: "Coach Pattene A", phone: "-", jerseyHome: "Biru - Putih", jerseyAway: "Merah" },
      players: [
        { no: 1, name: "Fardan Akbar", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Andi Ogi Mawakka", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Fatir Al A'raf", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Moch Badrus Zaman", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Muh. Naufal Azka", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Adley AM Lamma", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Althaf Syahputra Ramadan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Andi Muh Nukta", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Jefry Al Buchory", pos: "Anchor", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T28",
      name: "SDN 234 BARAMBANG 2",
      shortName: "BRADA FC",
      category: "SD",
      logo: "assets/brada_fc_logo.png",
      group: "C",
      badgeColor: "#b91c1c",
      city: "Maros",
      official: { manager: "Muhammad Ansar, S.Pd.", coach: "A. Muh Alif Rakasiwi, S.Pd", coachPhoto: "assets/coach_t28_barambang.jpg", medic: "Pamadeng Rukka, S.Pd.", phone: "081998494011", jerseyHome: "UNGU", jerseyAway: "" },
      players: [
        { no: 1, name: "Muh Habib Al  Habsy", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Afif Putra Mubarak", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Richard Ivander Winda", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Andi Muhammad Sakha", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "A Muhammad Berkah", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "A Qabil Abu Bakar HS", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Hafiz Al Ghazali", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 16, name: "Muh Pangeran", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 22, name: "Arsyl Batara Ilham", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Akmal", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Haikal Al Khalifi", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 26, name: "Aditya A", pos: "Anchor", goals: 0, yc: 0, rc: 0 }
      ]
    },

    // GRUP D SD
    {
      id: "T29",
      name: "UPTD SDN 2 Maros",
      shortName: "SDN 2 MAROS",
      category: "SD",
      logo: "",
      group: "D",
      badgeColor: "#0284c7",
      city: "Maros",
      official: { manager: "Hj. Hasnah, S.Pd", coach: "Coach Matjaz Kek", phone: "0812-3343-4353", jerseyHome: "Biru Langit - Putih", jerseyAway: "Hijau - Putih" },
      players: [
        { no: 1, name: "Jan Oblak (C)", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Jaka Bijol", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Josip Ilicic", pos: "Flank", goals: 1, yc: 0, rc: 0 },
        { no: 9, name: "Benjamin Sesko", pos: "Pivot", goals: 3, yc: 0, rc: 0 },
        { no: 10, name: "Miha Zajc", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 12, name: "Vid Belec", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 2, name: "Petar Stojanovicc", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Andraz Sporar", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T30",
      name: "UPTD SDN 57 BULU-BULU",
      shortName: "SDN 57 BULU-BULU",
      category: "SD",
      logo: "assets/sdn_57_bulubulu_logo.jpg",
      group: "D",
      badgeColor: "#1e3a8a",
      city: "Maros",
      official: { manager: "Ikram Abi Rafdi, S.Pd.", managerPhoto: "assets/coach_bayu.jpg", coach: "Ahmad Mubarak, S.Pd., M.Pd.", coachPhoto: "assets/coach_t30_bulubulu.jpg", medic: "Ina Oktaviana Namang, S.Pd.", phone: "082190825414", jerseyHome: "Biru Elektrik - Putih", jerseyAway: "Putih - Biru" },
      players: [
        { no: 1, name: "Muhammad Arifin A", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_1.jpeg" },
        { no: 10, name: "Muh. Fakhar Zhafar Rahmat", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_2.png" },
        { no: 17, name: "Muh. Ayyub", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_3.png" },
        { no: 5, name: "Meichael Ananda Pangestu", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_4.png" },
        { no: 3, name: "Muh. Alvian Rasya", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_5.png" },
        { no: 69, name: "Muhammad Rasul Umar", pos: "Pivot", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_6.png" },
        { no: 2, name: "Muh. Sadiq Sabri", pos: "Kiper", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_8.jpeg" },
        { no: 13, name: "Andi Azka Maulan", pos: "Anchor", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_9.jpeg" },
        { no: 28, name: "Adam Faiz Al Arkhan", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_10.jpeg" },
        { no: 11, name: "Muhammad Al Gazali", pos: "Flank", goals: 0, yc: 0, rc: 0, photo: "assets/teams/T30/media_11.png" }
      ]
    },
    {
      id: "T31",
      name: "UPTD SDN 146 BARAMBANG 1",
      shortName: "BARAMBANG 1",
      category: "SD",
      logo: "assets/teams/T31/logo.jpg",
      group: "D",
      badgeColor: "#b45309",
      city: "Maros",
      official: { manager: "Official Barambang 1", coach: "Muh. Ismail, S.Pd", phone: "-", jerseyHome: "Kuning - Hitam", jerseyAway: "Putih" },
      players: [
        { no: 21, name: "Muh Rafa Zaka Putra Yogasara", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Muh Yusran", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "Muh Fitrah Ramadhan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 17, name: "Muh Raihan Rh", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 22, name: "Mirza Ukail", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 20, name: "Ahmad Nur Ramdani", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 15, name: "Muh Daffa Raditya", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 14, name: "Muh Daffa Fajri Asis", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Nizar Rafiq", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 19, name: "Muh Irfail Adzan", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Muh Novri", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 28, name: "Muh Hasrullah", pos: "Pivot", goals: 0, yc: 0, rc: 0 }
      ]
    },
    {
      id: "T32",
      name: "UPTD SDN 82 PATTENE (TIM B)",
      shortName: "PATTENE B",
      category: "SD",
      logo: "assets/teams/T32/logo.jpg",
      group: "D",
      badgeColor: "#0284c7",
      city: "Maros",
      official: { manager: "Official Pattene B", coach: "Coach Pattene B", phone: "-", jerseyHome: "Biru - Putih", jerseyAway: "Hitam" },
      players: [
        { no: 2, name: "Riswan Alfa Reza", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 5, name: "Muh Alif Saputra", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 3, name: "Hamid Fadhil Hasan", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "Diaz Putra Ramadhan", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 6, name: "Muh. Fadhil", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 11, name: "Muh. Restu Kadir", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 8, name: "Muh. Reski Kadir", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "Muh. Gibran", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "Muh. Arsil", pos: "Anchor", goals: 0, yc: 0, rc: 0 }
      ]
    }
  ],

  // JADWAL PERTANDINGAN 5 HARI (22 - 26 NOVEMBER 2026) DI 1 LAPANGAN UTAMA
  matches: [
    // ==========================================
    // HARI 1: MINGGU, 22 NOV 2026 (MATCHDAY 1)
    // ==========================================
    // SMP MATCHDAY 1
    {
      id: "M01",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "08:00 - 08:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T01",
      awayId: "T02",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M02",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "08:45 - 09:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T03",
      awayId: "T04",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M03",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "09:30 - 10:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T05",
      awayId: "T06",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M04",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "10:15 - 10:55 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T07",
      awayId: "T08",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M05",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "11:00 - 11:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T09",
      awayId: "T10",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M06",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "13:00 - 13:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T11",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M07",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "13:45 - 14:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T13",
      awayId: "T14",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M08",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "14:30 - 15:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T15",
      awayId: "T16",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // SD MATCHDAY 1 (HARI 1 SORE)
    {
      id: "M09",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "15:15 - 15:55 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T17",
      awayId: "T18",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M10",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "16:00 - 16:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T19",
      awayId: "T20",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M11",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "16:45 - 17:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T21",
      awayId: "T22",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M12",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 1,
      date: "22 Nov 2026",
      time: "17:30 - 18:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T23",
      awayId: "T24",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // ==========================================
    // HARI 2: SENIN, 23 NOV 2026 (MATCHDAY 1 LANJUTAN & MATCHDAY 2)
    // ==========================================
    {
      id: "M13",
      category: "SD",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "23 Nov 2026",
      time: "08:00 - 08:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T25",
      awayId: "T26",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M14",
      category: "SD",
      group: "C",
      stage: "group",
      matchday: 1,
      date: "23 Nov 2026",
      time: "08:45 - 09:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T27",
      awayId: "T28",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M15",
      category: "SD",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "23 Nov 2026",
      time: "09:30 - 10:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T29",
      awayId: "T30",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M16",
      category: "SD",
      group: "D",
      stage: "group",
      matchday: 1,
      date: "23 Nov 2026",
      time: "10:15 - 10:55 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T31",
      awayId: "T32",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // MATCHDAY 2 SMP
    {
      id: "M17",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "11:00 - 11:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T01",
      awayId: "T03",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M18",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "13:00 - 13:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T02",
      awayId: "T04",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M19",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "13:45 - 14:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T05",
      awayId: "T07",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    // LAGA M20: SEDANG BERLANGSUNG (LIVE SKOR UNTUK BAHAN DEMO PRESENTASI!)
    {
      id: "M20",
      category: "SMP",
      group: "B",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "14:30 - 15:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T06",
      awayId: "T08",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // SISA LAGA MATCHDAY 2 (HARI 2 SORE - STATUS UPCOMING)
    {
      id: "M21",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "15:15 - 15:55 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T09",
      awayId: "T11",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M22",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "16:00 - 16:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T10",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M23",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "16:45 - 17:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T13",
      awayId: "T15",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M24",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 2,
      date: "23 Nov 2026",
      time: "17:30 - 18:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T14",
      awayId: "T16",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // ==========================================
    // HARI 3: SELASA, 24 NOV 2026 (PENENTUAN FASE GRUP)
    // ==========================================
    // SMP PENENTUAN GRUP
    {
      id: "M25",
      category: "SMP",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "08:00 - 08:40 WITA",
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
      date: "24 Nov 2026",
      time: "08:45 - 09:25 WITA",
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
      date: "24 Nov 2026",
      time: "09:30 - 10:10 WITA",
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
      date: "24 Nov 2026",
      time: "10:15 - 10:55 WITA",
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
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "11:00 - 11:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T09",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M30",
      category: "SMP",
      group: "C",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "13:00 - 13:40 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T10",
      awayId: "T11",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M31",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "13:45 - 14:25 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T13",
      awayId: "T16",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },
    {
      id: "M32",
      category: "SMP",
      group: "D",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "14:30 - 15:10 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homeId: "T14",
      awayId: "T15",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // SD PENENTUAN GRUP
    {
      id: "M33",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "15:15 - 15:55 WITA",
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
      id: "M34",
      category: "SD",
      group: "A",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "16:00 - 16:40 WITA",
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
      id: "M35",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "16:45 - 17:25 WITA",
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
      id: "M36",
      category: "SD",
      group: "B",
      stage: "group",
      matchday: 3,
      date: "24 Nov 2026",
      time: "17:30 - 18:10 WITA",
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
    // HARI 4: RABU, 25 NOV 2026 (BABAK 8 BESAR / PEREMPAT FINAL)
    // ==========================================
    // SMP PEREMPAT FINAL
    {
      id: "QF1_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Perempat Final 1 SMP",
      date: "25 Nov 2026",
      time: "08:30 - 09:15 WITA",
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
      date: "25 Nov 2026",
      time: "09:30 - 10:15 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup C (SMP)",
      awayPlaceholder: "Runner-up Grup D (SMP)",
      homeId: "T09",
      awayId: "T15",
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
      date: "25 Nov 2026",
      time: "10:30 - 11:15 WITA",
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
      date: "25 Nov 2026",
      time: "11:30 - 12:15 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup D (SMP)",
      awayPlaceholder: "Runner-up Grup C (SMP)",
      homeId: "T13",
      awayId: "T12",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // SD PEREMPAT FINAL
    {
      id: "QF1_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Perempat Final 1 SD",
      date: "25 Nov 2026",
      time: "13:30 - 14:15 WITA",
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
      date: "25 Nov 2026",
      time: "14:30 - 15:15 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup C (SD)",
      awayPlaceholder: "Runner-up Grup D (SD)",
      homeId: "T26",
      awayId: "T29",
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
      date: "25 Nov 2026",
      time: "15:30 - 16:15 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup B (SD)",
      awayPlaceholder: "Runner-up Grup A (SD)",
      homeId: "T21",
      awayId: "T19",
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
      date: "25 Nov 2026",
      time: "16:30 - 17:15 WITA",
      pitch: "Lapangan Utama (Vinyl)",
      homePlaceholder: "Juara Grup D (SD)",
      awayPlaceholder: "Runner-up Grup C (SD)",
      homeId: "T32",
      awayId: "T27",
      homeScore: null,
      awayScore: null,
      status: "upcoming",
      scorers: [],
      cards: []
    },

    // ==========================================
    // HARI 5: KAMIS, 26 NOV 2026 (SEMIFINAL, FINAL & SEREMONI)
    // ==========================================
    // SEMIFINAL SMP
    {
      id: "SF1_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Semifinal 1 SMP",
      date: "26 Nov 2026",
      time: "08:30 - 09:20 WITA",
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
      date: "26 Nov 2026",
      time: "09:30 - 10:20 WITA",
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

    // SEMIFINAL SD
    {
      id: "SF1_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Semifinal 1 SD",
      date: "26 Nov 2026",
      time: "10:30 - 11:20 WITA",
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
      date: "26 Nov 2026",
      time: "11:30 - 12:20 WITA",
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

    // PEREBUTAN JUARA 3
    {
      id: "3RD_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Juara 3 SD",
      date: "26 Nov 2026",
      time: "13:30 - 14:15 WITA",
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
      id: "3RD_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Juara 3 SMP",
      date: "26 Nov 2026",
      time: "14:15 - 15:00 WITA",
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

    // GRAND FINAL
    {
      id: "FINAL_SD",
      category: "SD",
      stage: "knockout",
      roundName: "Grand Final SD",
      date: "26 Nov 2026",
      time: "15:00 - 16:00 WITA",
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
    },
    {
      id: "FINAL_SMP",
      category: "SMP",
      stage: "knockout",
      roundName: "Grand Final SMP",
      date: "26 Nov 2026",
      time: "16:00 - 17:00 WITA",
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
    }
  ]
};

window.DEFAULT_DATA = DEFAULT_DATA;
