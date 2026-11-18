// data.js - Schema Kosong Turnamen ACC 2026 (ZERO data tetap/hardcoded!)
// Seluruh data Tim, Skuad Pemain, Jadwal Pertandingan, Klasemen, Momen, Berita, & Sponsor
// bersumber 100% dari Database Online (Supabase) agar tidak pernah bertabrakan dengan hasil input panitia.

const DEFAULT_DATA = {
  config: {
    tournamentName: 'ACC 2026',
    subTitle: "",
    edition: "",
    venue: "",
    pitch1Name: "Lapangan Utama",
    pitch2Name: "Lapangan 2",
    dates: "",
    adminPinHash: "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348",
    runningAnnouncement: "",
    contactCommittee: "",
    heroBannerImage: "assets/hero_banner.jpg",
    youtubeLiveUrl: "",
    youtubeLiveTitle: "",
    rulesText: ""
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
    platinum: [],
    gold: [],
    media: []
  },
  moments: [],
  teams: [],
  matches: []
};

window.DEFAULT_DATA = DEFAULT_DATA;
