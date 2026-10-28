// app.js - Main Tournament Logic & UI Rendering
class TournamentStore {
  constructor() {
    this.STORAGE_KEY = "acc_futsal_tournament_2026_clean_zero_v5";
    this.data = this.loadData();
    this.syncKnockoutFromStandings();
  }

  loadData() {
    let data;
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.error("Gagal memuat data dari localStorage, menggunakan default", e);
      }
    }
    // Pastikan jika belum ada data, kurang dari 32 tim, atau masih data lama, muat ulang dari DEFAULT_DATA
    if (!data || !data.teams || data.teams.length < 32 || data.teams[0].name !== "SMP 5 Mandai") {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // Auto-repair encoding teks rusak dari cache localStorage sebelumnya
    let needsSaveHealing = false;
    if (data && data.config) {
      if (!data.config.subTitle || data.config.subTitle.includes("â") || data.config.subTitle.includes("€") || !data.config.subTitle.includes("•")) {
        data.config.subTitle = DEFAULT_DATA.config.subTitle;
        needsSaveHealing = true;
      }
      if (!data.config.runningAnnouncement || data.config.runningAnnouncement.includes("ð") || data.config.runningAnnouncement.includes("â") || data.config.runningAnnouncement.includes("†") || !data.config.runningAnnouncement.startsWith("🏆")) {
        data.config.runningAnnouncement = DEFAULT_DATA.config.runningAnnouncement;
        needsSaveHealing = true;
      }
      if (!data.config.youtubeLiveUrl) {
        data.config.youtubeLiveUrl = DEFAULT_DATA.config.youtubeLiveUrl || "https://www.youtube.com/embed/5qap5aO4i9A";
        needsSaveHealing = true;
      }
      if (!data.config.youtubeLiveTitle) {
        data.config.youtubeLiveTitle = DEFAULT_DATA.config.youtubeLiveTitle || "🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros";
        needsSaveHealing = true;
      }
    }
    if (data && data.homeData && data.homeData.moments) {
      data.homeData.moments.forEach((m, idx) => {
        if (m.badge && (m.badge.includes("ð") || m.badge.includes("â") || m.badge.includes("†")) && DEFAULT_DATA.homeData.moments[idx]) {
          m.badge = DEFAULT_DATA.homeData.moments[idx].badge;
          needsSaveHealing = true;
        }
      });
    }
    if (data && data.sponsors) {
      ['platinum', 'gold', 'media'].forEach(tier => {
        if (data.sponsors[tier] && DEFAULT_DATA.homeData.sponsors[tier]) {
          data.sponsors[tier].forEach((s, idx) => {
            if (s.icon && (s.icon.includes("ð") || s.icon.includes("â") || s.icon.includes("†")) && DEFAULT_DATA.homeData.sponsors[tier][idx]) {
              s.icon = DEFAULT_DATA.homeData.sponsors[tier][idx].icon;
              needsSaveHealing = true;
            }
          });
        }
      });
    }
    if (needsSaveHealing) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (err) {}
    }
    // Pastikan data sponsor selalu ada
    if (!data.sponsors) {
      if (data.homeData && data.homeData.sponsors) {
        data.sponsors = data.homeData.sponsors;
      } else {
        data.sponsors = JSON.parse(JSON.stringify(DEFAULT_DATA.homeData.sponsors));
      }
    }
    // Pastikan data moments selalu ada
    if (!data.moments) {
      if (data.homeData && data.homeData.moments) {
        data.moments = data.homeData.moments;
      } else {
        data.moments = JSON.parse(JSON.stringify(DEFAULT_DATA.homeData.moments));
      }
    }
    // Pastikan foto pemain, logo, dan kategori SD / SMP terhubung jika belum ada
    if (data.teams && Array.isArray(data.teams)) {
      data.teams.forEach(t => {
        // Auto-assign category if missing (T01-T08 = SMP, T09-T16 = SD)
        const numId = parseInt((t.id || '').replace(/\D/g, ''), 10);
        if (!t.category) {
          t.category = (numId >= 9) ? "SD" : "SMP";
        }
        // Normalize school prefix to SMP / MTs vs SD / MI
        if (t.category === "SMP") {
          t.name = t.name.replace(/^SMA /, "SMP ").replace(/^SMK /, "SMP ").replace(/^SMKN 1 /, "SMPN 1 ");
        } else if (t.category === "SD") {
          t.name = t.name.replace(/^SMA /, "SD ").replace(/^SMK /, "SD IT ").replace(/^MA /, "MI ").replace(/^MTQ /, "SD MTQ ");
        }
        if (t.logo === undefined) t.logo = "";

        const defTeam = DEFAULT_DATA.teams.find(dt => dt.id === t.id);
        if (defTeam) {
          if (!t.logo && defTeam.logo) t.logo = defTeam.logo;
          if (defTeam.official) {
            if (!t.official) t.official = {};
            if (!t.official.coachPhoto && defTeam.official.coachPhoto) {
              t.official.coachPhoto = defTeam.official.coachPhoto;
            }
          }
          if (t.players && defTeam.players) {
            t.players.forEach(p => {
              const defPlayer = defTeam.players.find(dp => dp.name === p.name || dp.no === p.no);
              if (defPlayer && defPlayer.photo && !p.photo) {
                p.photo = defPlayer.photo;
              }
            });
          }
        }
      });
    }

    // Pastikan laga terhubung dengan kategori
    if (data.matches && Array.isArray(data.matches)) {
      data.matches.forEach(m => {
        if (!m.category) {
          const homeTeam = data.teams.find(t => t.id === m.homeId);
          m.category = (homeTeam && homeTeam.category) || (m.group === "C" || m.group === "D" ? "SD" : "SMP");
        }
      });
    }

    return data;
  }

  saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  resetData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData();
    this.syncKnockoutFromStandings();
  }

  getTeam(id) {
    return this.data.teams.find(t => t.id === id);
  }

  // Calculate Standings for a specific group & category
  calculateGroupStandings(groupLetter, category = null) {
    let groupTeams = this.data.teams.filter(t => t.group === groupLetter);
    if (category && category !== "all") {
      groupTeams = groupTeams.filter(t => (t.category || "SMP") === category);
    }
    const stats = {};

    groupTeams.forEach(t => {
      stats[t.id] = {
        team: t,
        mp: 0, // matches played
        w: 0,  // win
        d: 0,  // draw
        l: 0,  // loss
        gf: 0, // goals for
        ga: 0, // goals against
        gd: 0, // goal diff
        pts: 0,
        recentForm: [] // "W", "D", "L"
      };
    });

    const groupMatches = this.data.matches.filter(
      m => m.stage === "group" && m.group === groupLetter &&
           (!category || category === "all" || (m.category || "SMP") === category) &&
           (m.status === "finished" || m.status === "live")
    );

    groupMatches.forEach(m => {
      const hScore = m.status === "live" ? (m.homeScoreLive || 0) : (m.homeScore || 0);
      const aScore = m.status === "live" ? (m.awayScoreLive || 0) : (m.awayScore || 0);

      const h = stats[m.homeId];
      const a = stats[m.awayId];

      if (!h || !a) return;

      h.mp += 1;
      a.mp += 1;
      h.gf += hScore;
      h.ga += aScore;
      a.gf += aScore;
      a.ga += hScore;

      if (hScore > aScore) {
        h.w += 1;
        h.pts += 3;
        h.recentForm.push("W");
        a.l += 1;
        a.recentForm.push("L");
      } else if (hScore < aScore) {
        a.w += 1;
        a.pts += 3;
        a.recentForm.push("W");
        h.l += 1;
        h.recentForm.push("L");
      } else {
        h.d += 1;
        a.d += 1;
        h.pts += 1;
        a.pts += 1;
        h.recentForm.push("D");
        a.recentForm.push("D");
      }

      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
    });

    // Sort by: Pts DESC, GD DESC, GF DESC
    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }

  // Automatically sync Group Winners & Runners-Up to Knockout (4 Grup SMP & 4 Grup SD)
  syncKnockoutFromStandings() {
    // SMP Standings (Grup A, B, C, D)
    const stA_SMP = this.calculateGroupStandings("A", "SMP");
    const stB_SMP = this.calculateGroupStandings("B", "SMP");
    const stC_SMP = this.calculateGroupStandings("C", "SMP");
    const stD_SMP = this.calculateGroupStandings("D", "SMP");

    // SD Standings (Grup A, B, C, D)
    const stA_SD = this.calculateGroupStandings("A", "SD");
    const stB_SD = this.calculateGroupStandings("B", "SD");
    const stC_SD = this.calculateGroupStandings("C", "SD");
    const stD_SD = this.calculateGroupStandings("D", "SD");

    // 1. QF SMP: 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C
    const qf1_smp = this.data.matches.find(m => m.id === "QF1_SMP" || m.id === "QF1");
    if (qf1_smp) {
      qf1_smp.category = "SMP";
      if (stA_SMP[0] && stB_SMP[1]) {
        qf1_smp.homeId = stA_SMP[0].team.id;
        qf1_smp.awayId = stB_SMP[1].team.id;
      }
    }
    const qf2_smp = this.data.matches.find(m => m.id === "QF2_SMP");
    if (qf2_smp) {
      qf2_smp.category = "SMP";
      if (stC_SMP[0] && stD_SMP[1]) {
        qf2_smp.homeId = stC_SMP[0].team.id;
        qf2_smp.awayId = stD_SMP[1].team.id;
      }
    }
    const qf3_smp = this.data.matches.find(m => m.id === "QF3_SMP" || m.id === "QF3");
    if (qf3_smp) {
      qf3_smp.category = "SMP";
      if (stB_SMP[0] && stA_SMP[1]) {
        qf3_smp.homeId = stB_SMP[0].team.id;
        qf3_smp.awayId = stA_SMP[1].team.id;
      }
    }
    const qf4_smp = this.data.matches.find(m => m.id === "QF4_SMP");
    if (qf4_smp) {
      qf4_smp.category = "SMP";
      if (stD_SMP[0] && stC_SMP[1]) {
        qf4_smp.homeId = stD_SMP[0].team.id;
        qf4_smp.awayId = stC_SMP[1].team.id;
      }
    }

    // 2. QF SD: 1A vs 2B, 1C vs 2D, 1B vs 2A, 1D vs 2C
    const qf1_sd = this.data.matches.find(m => m.id === "QF1_SD" || m.id === "QF2");
    if (qf1_sd) {
      qf1_sd.category = "SD";
      if (stA_SD[0] && stB_SD[1]) {
        qf1_sd.homeId = stA_SD[0].team.id;
        qf1_sd.awayId = stB_SD[1].team.id;
      }
    }
    const qf2_sd = this.data.matches.find(m => m.id === "QF2_SD");
    if (qf2_sd) {
      qf2_sd.category = "SD";
      if (stC_SD[0] && stD_SD[1]) {
        qf2_sd.homeId = stC_SD[0].team.id;
        qf2_sd.awayId = stD_SD[1].team.id;
      }
    }
    const qf3_sd = this.data.matches.find(m => m.id === "QF3_SD" || m.id === "QF4");
    if (qf3_sd) {
      qf3_sd.category = "SD";
      if (stB_SD[0] && stA_SD[1]) {
        qf3_sd.homeId = stB_SD[0].team.id;
        qf3_sd.awayId = stA_SD[1].team.id;
      }
    }
    const qf4_sd = this.data.matches.find(m => m.id === "QF4_SD");
    if (qf4_sd) {
      qf4_sd.category = "SD";
      if (stD_SD[0] && stC_SD[1]) {
        qf4_sd.homeId = stD_SD[0].team.id;
        qf4_sd.awayId = stC_SD[1].team.id;
      }
    }

    // Helper to get winner & loser from finished match
    const getWinnerId = (m) => {
      if (!m || m.status !== "finished" || m.homeScore === null || m.awayScore === null) return null;
      if (m.homeScore > m.awayScore) return m.homeId;
      if (m.awayScore > m.homeScore) return m.awayId;
      return null;
    };
    const getLoserId = (m) => {
      if (!m || m.status !== "finished" || m.homeScore === null || m.awayScore === null) return null;
      if (m.homeScore > m.awayScore) return m.awayId;
      if (m.awayScore > m.homeScore) return m.homeId;
      return null;
    };

    // 3. SF SMP: Winner QF1 vs Winner QF2, Winner QF3 vs Winner QF4
    const sf1_smp = this.data.matches.find(m => m.id === "SF1_SMP");
    if (sf1_smp) {
      const w1 = getWinnerId(qf1_smp);
      const w2 = getWinnerId(qf2_smp);
      if (w1) sf1_smp.homeId = w1;
      if (w2) sf1_smp.awayId = w2;
    }
    const sf2_smp = this.data.matches.find(m => m.id === "SF2_SMP");
    if (sf2_smp) {
      const w3 = getWinnerId(qf3_smp);
      const w4 = getWinnerId(qf4_smp);
      if (w3) sf2_smp.homeId = w3;
      if (w4) sf2_smp.awayId = w4;
    }

    // 4. Final & 3RD SMP
    const final_smp = this.data.matches.find(m => m.id === "FINAL_SMP");
    if (final_smp) {
      const wSF1 = getWinnerId(sf1_smp);
      const wSF2 = getWinnerId(sf2_smp);
      if (wSF1) final_smp.homeId = wSF1;
      if (wSF2) final_smp.awayId = wSF2;
    }
    const third_smp = this.data.matches.find(m => m.id === "3RD_SMP");
    if (third_smp) {
      const lSF1 = getLoserId(sf1_smp);
      const lSF2 = getLoserId(sf2_smp);
      if (lSF1) third_smp.homeId = lSF1;
      if (lSF2) third_smp.awayId = lSF2;
    }

    // 5. SF SD: Winner QF1 vs Winner QF2, Winner QF3 vs Winner QF4
    const sf1_sd = this.data.matches.find(m => m.id === "SF1_SD");
    if (sf1_sd) {
      const w1 = getWinnerId(qf1_sd);
      const w2 = getWinnerId(qf2_sd);
      if (w1) sf1_sd.homeId = w1;
      if (w2) sf1_sd.awayId = w2;
    }
    const sf2_sd = this.data.matches.find(m => m.id === "SF2_SD");
    if (sf2_sd) {
      const w3 = getWinnerId(qf3_sd);
      const w4 = getWinnerId(qf4_sd);
      if (w3) sf2_sd.homeId = w3;
      if (w4) sf2_sd.awayId = w4;
    }

    // 6. Final & 3RD SD
    const final_sd = this.data.matches.find(m => m.id === "FINAL_SD");
    if (final_sd) {
      const wSF1 = getWinnerId(sf1_sd);
      const wSF2 = getWinnerId(sf2_sd);
      if (wSF1) final_sd.homeId = wSF1;
      if (wSF2) final_sd.awayId = wSF2;
    }
    const third_sd = this.data.matches.find(m => m.id === "3RD_SD");
    if (third_sd) {
      const lSF1 = getLoserId(sf1_sd);
      const lSF2 = getLoserId(sf2_sd);
      if (lSF1) third_sd.homeId = lSF1;
      if (lSF2) third_sd.awayId = lSF2;
    }
  }

  // Calculate Disciplinary status (Yellow/Red Cards across all matches)
  getDisciplinaryRecords(category = null) {
    const playerStats = {};
    let teams = this.data.teams;
    if (category && category !== "all") {
      teams = teams.filter(t => (t.category || "SMP") === category);
    }

    teams.forEach(t => {
      t.players.forEach(p => {
        const key = `${t.id}-${p.name}`;
        playerStats[key] = {
          teamId: t.id,
          teamName: t.name,
          category: t.category || "SMP",
          manager: t.official.manager,
          managerPhone: t.official.phone,
          playerNo: p.no,
          playerName: p.name,
          pos: p.pos,
          yellowCount: 0,
          redCount: 0,
          cardsHistory: []
        };
      });
    });

    this.data.matches.forEach(m => {
      if (m.cards && m.cards.length > 0) {
        m.cards.forEach(c => {
          const key = `${c.team}-${c.player}`;
          if (playerStats[key]) {
            if (c.type === "yellow") {
              playerStats[key].yellowCount += 1;
            } else if (c.type === "red") {
              playerStats[key].redCount += 1;
            }
            playerStats[key].cardsHistory.push({
              matchId: m.id,
              type: c.type,
              minute: c.minute
            });
          }
        });
      }
    });

    return Object.values(playerStats)
      .filter(p => p.yellowCount > 0 || p.redCount > 0)
      .map(p => {
        let status = "Aman";
        let statusType = "safe";
        let actionNote = "Dapat bermain";

        if (p.redCount >= 1) {
          status = "SANKSI KARTU MERAH";
          statusType = "danger";
          actionNote = "Larangan bermain 1 laga berikutnya";
        } else if (p.yellowCount >= 2) {
          status = "AKUMULASI 2 KUNING";
          statusType = "warning";
          actionNote = "Larangan bermain 1 laga berikutnya";
        } else if (p.yellowCount === 1) {
          status = "Peringatan 1 Kuning";
          statusType = "info";
          actionNote = "";
        }

        return { ...p, status, statusType, actionNote };
      })
      .sort((a, b) => (b.redCount * 3 + b.yellowCount) - (a.redCount * 3 + a.yellowCount));
  }

  // Calculate Golden Boot / Top Scorers
  getTopScorersList(category = null) {
    const scorers = {};
    let teams = this.data.teams;
    if (category && category !== "all") {
      teams = teams.filter(t => (t.category || "SMP") === category);
    }

    teams.forEach(t => {
      t.players.forEach(p => {
        const key = `${t.id}-${p.name}`;
        scorers[key] = {
          teamId: t.id,
          teamName: t.name,
          category: t.category || "SMP",
          badgeColor: t.badgeColor,
          playerNo: p.no,
          playerName: p.name,
          pos: p.pos,
          photo: p.photo || "",
          goals: 0
        };
      });
    });

    this.data.matches.forEach(m => {
      if (m.scorers && m.scorers.length > 0) {
        m.scorers.forEach(s => {
          const key = `${s.team}-${s.player}`;
          if (scorers[key]) {
            scorers[key].goals += 1;
          }
        });
      }
    });

    return Object.values(scorers)
      .filter(s => s.goals > 0)
      .sort((a, b) => b.goals - a.goals);
  }
}

// Global UI Manager
const app = {
  store: new TournamentStore(),
  currentTab: "home", // Default sekarang membuka tab Beranda Utama
  currentCategory: localStorage.getItem("acc_active_category") || "SMP",
  filterDay: "all",
  filterPitch: "all",
  filterGroup: "all",
  filterStatus: "all", // "all", "live", "upcoming", "finished"
  splashTimeout: null,
  currentTheme: "light", // Default ramah dengan white space luas
  currentViewMode: "participant", // "participant" atau "operator"

  init() {
    this.initSplashScreen();
    this.initThemeAndViewMode();
    this.updateCategoryUI();
    this.renderHeader();
    this.renderLiveStreamHero();
    this.bindEvents();
    this.renderCurrentView();
    this.initPwa();
    this.initSupabaseSync();

    // DOM-level guarantee
    const tickerEl = document.getElementById("tickerText");
    if (tickerEl && tickerEl.textContent && (tickerEl.textContent.includes("ð") || tickerEl.textContent.includes("†") || !tickerEl.textContent.trim().startsWith("🏆"))) {
      tickerEl.textContent = "🏆 " + tickerEl.textContent.replace(/^.*Selamat Datang/i, "Selamat Datang").trim();
    }
  },

  // =========================================================
  // OPENING / SPLASH SCREEN MANAGEMENT
  // =========================================================
  initSplashScreen() {
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;

    const progressBar = document.getElementById("splashLoaderBar");
    if (progressBar) {
      progressBar.style.width = "0%";
      setTimeout(() => {
        progressBar.style.width = "100%";
      }, 50);
    }
    // TIDAK ADA AUTO-DISMISS: Tetap di layar opening sampai user klik tombol untuk masuk
  },

  dismissSplashScreen() {
    if (this.splashTimeout) {
      clearTimeout(this.splashTimeout);
      this.splashTimeout = null;
    }
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;

    splash.classList.add("splash-fade-out");
    setTimeout(() => {
      splash.style.display = "none";
    }, 480);
  },

  replaySplashScreen() {
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;
    splash.style.display = "flex";
    splash.classList.remove("splash-fade-out");
    this.initSplashScreen();
  },

  // =========================================================
  // STATUS FILTER (SEMUA, LIVE, AKAN DATANG, SELESAI)
  // =========================================================
  setStatusFilter(status) {
    this.filterStatus = status;
    document.querySelectorAll(".match-status-filter-pills .status-pill").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.status === status);
    });
    this.renderMatches();
  },

  // =========================================================
  // YOUTUBE EMBED HELPER & LIVE STREAM HERO
  // =========================================================
  formatYoutubeEmbedUrl(url) {
    if (!url) return "https://www.youtube.com/embed/5qap5aO4i9A";
    url = url.trim();
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=1`;
    }
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=1`;
    }
    const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
    if (liveMatch && liveMatch[1]) {
      return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&mute=1`;
    }
    if (/^[a-zA-Z0-9_-]{10,12}$/.test(url)) {
      return `https://www.youtube.com/embed/${url}?autoplay=1&mute=1`;
    }
    return url;
  },

  renderLiveStreamHero() {
    const container = document.getElementById("liveStreamHero");
    if (!container) return;

    const cfg = (this.store && this.store.data && this.store.data.config) || {};
    const rawYtUrl = cfg.youtubeLiveUrl || "https://www.youtube.com/embed/5qap5aO4i9A";
    const embedUrl = this.formatYoutubeEmbedUrl(rawYtUrl);
    const title = cfg.youtubeLiveTitle || "🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros";

    // Cari apakah ada pertandingan yang sedang LIVE saat ini
    const matches = (this.store && this.store.data && this.store.data.matches) || [];
    const liveMatches = matches.filter(m => m.status === "live");
    const upcomingMatches = matches.filter(m => m.status === "upcoming" || (!m.status || m.status === "scheduled"));

    let liveTickerHtml = "";
    if (liveMatches.length > 0) {
      const lm = liveMatches[0];
      const hTeam = this.store.getTeam(lm.homeId) || { name: lm.homePlaceholder || "Home", shortName: "HOME" };
      const aTeam = this.store.getTeam(lm.awayId) || { name: lm.awayPlaceholder || "Away", shortName: "AWAY" };
      const hScore = lm.homeScoreLive ?? 0;
      const aScore = lm.awayScoreLive ?? 0;
      const catBadge = (lm.category || "SMP") === "SD" ? "SD (U-12)" : "SMP (U-15)";
      const stageName = lm.stage === "knockout" ? (lm.roundName || "Babak Gugur") : `Grup ${lm.group}`;

      liveTickerHtml = `
        <div class="live-stream-match-ticker live">
          <div class="ticker-left">
            <span class="pulse-live-badge">🔴 LIVE${lm.liveMinute ? ` • Menit ${lm.liveMinute}` : ''}</span>
            <span class="ticker-match-title">${catBadge} [${stageName}]</span>
            <strong class="ticker-score-teams">${hTeam.name} <span class="score-highlight">${hScore} - ${aScore}</span> ${aTeam.name}</strong>
          </div>
          <div class="ticker-actions">
            <button class="btn btn-sm btn-primary" onclick="admin.openQuickScore('${lm.id}')">✏️ Input Skor Laga</button>
            <button class="btn btn-sm btn-outline" onclick="app.showMatchDetail('${lm.id}')">ℹ️ Detail Laga</button>
          </div>
        </div>
      `;
    } else {
      // Tampilkan info laga berikutnya
      const nextMatch = upcomingMatches[0] || matches[0];
      if (nextMatch) {
        const hTeam = this.store.getTeam(nextMatch.homeId) || { name: nextMatch.homePlaceholder || "Home" };
        const aTeam = this.store.getTeam(nextMatch.awayId) || { name: nextMatch.awayPlaceholder || "Away" };
        const catBadge = (nextMatch.category || "SMP") === "SD" ? "SD (U-12)" : "SMP (U-15)";
        const stageName = nextMatch.stage === "knockout" ? (nextMatch.roundName || "Babak Gugur") : `Grup ${nextMatch.group}`;

        liveTickerHtml = `
          <div class="live-stream-match-ticker upcoming">
            <div class="ticker-left">
              <span class="upcoming-status-badge">⏰ PERTANDINGAN BERIKUTNYA</span>
              <span class="ticker-match-title">${catBadge} [${stageName}] • ${nextMatch.date}, ${nextMatch.time}</span>
              <strong class="ticker-score-teams">${hTeam.name} <span class="vs-badge">VS</span> ${aTeam.name}</strong>
            </div>
            <div class="ticker-actions">
              <button class="btn btn-sm btn-primary" onclick="app.switchTab('matches')">🏟️ Lihat Jadwal Lengkap ➔</button>
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = `
      <div class="live-stream-card">
        <!-- HEADER SIARAN LANGSUNG -->
        <div class="live-stream-header">
          <div class="live-stream-header-left">
            <div class="live-on-air-pill">
              <span class="live-blink-circle"></span>
              <span>LIVE BROADCAST</span>
            </div>
            <h3 class="live-stream-title">${title}</h3>
          </div>
          <div class="live-stream-header-right">
            <button class="btn btn-outline btn-sm btn-edit-stream" onclick="admin.openYoutubeLiveModal()" title="Ubah Link Siaran Langsung YouTube (Panitia)">
              ⚙️ Ganti Link YouTube Live
            </button>
          </div>
        </div>

        <!-- YOUTUBE VIDEO EMBED WRAPPER (16:9 RATIO) -->
        <div class="live-video-player-wrapper">
          <iframe 
            id="mainYoutubeIframe" 
            src="${embedUrl}" 
            title="YouTube Live Siaran ACC MTQ Al-Fayyadh" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>
        </div>

        <!-- MATCH TICKER DI BAWAH VIDEO -->
        ${liveTickerHtml}
      </div>
    `;
  },

  setCategory(cat, showToastMsg = true) {
    if (cat !== "SMP" && cat !== "SD") cat = "SMP";
    this.currentCategory = cat;
    localStorage.setItem("acc_active_category", cat);
    this.updateCategoryUI();
    this.renderCurrentView();
    if (showToastMsg) {
      const lbl = cat === "SMP" ? "🏆 Kelas SMP (U-15)" : "⚽ Kelas SD (U-12)";
      this.showToast(`Beralih ke ${lbl}`);
    }
  },

  updateCategoryUI() {
    const btnSMP = document.getElementById("btnCatSMP");
    const btnSD = document.getElementById("btnCatSD");
    if (btnSMP) btnSMP.classList.toggle("active", this.currentCategory === "SMP");
    if (btnSD) btnSD.classList.toggle("active", this.currentCategory === "SD");
  },

  initSupabaseSync() {
    if (!window.SupabaseService) return;

    // Listen for realtime live score & match changes
    window.SupabaseService.onRemoteUpdate((table, payload) => {
      this.handleRemoteSync(table, payload);
    });

    // Initial silent load from Supabase if configured
    window.SupabaseService.fetchAllData().then(data => {
      if (!data || !data.teams || data.teams.length < 10) {
        // Cloud has empty/few records, auto-sync local dataset to cloud if local is ready
        if (this.store && this.store.data && this.store.data.teams && this.store.data.teams.length >= 30) {
          if (window.SupabaseService && window.SupabaseService.syncAllData) {
            window.SupabaseService.syncAllData(this.store.data);
          }
        }
      }

      if (data && (data.matches || data.teams)) {
        if (data.config) {
          if (data.config.runningAnnouncement && (data.config.runningAnnouncement.includes("ð") || data.config.runningAnnouncement.includes("†"))) {
            data.config.runningAnnouncement = DEFAULT_DATA.config.runningAnnouncement;
          }
          if (data.config.subTitle && (data.config.subTitle.includes("â") || data.config.subTitle.includes("€"))) {
            data.config.subTitle = DEFAULT_DATA.config.subTitle;
          }
          Object.assign(this.store.data.config, data.config);
          this.renderHeader();
        }

        if (data.matches && data.matches.length > 0) {
          data.matches.forEach(remoteMatch => {
            const idx = this.store.data.matches.findIndex(m => m.id === remoteMatch.id);
            if (idx !== -1) {
              const mapped = {};
              if (remoteMatch.home_score !== undefined || remoteMatch.homeScore !== undefined) {
                mapped.homeScore = remoteMatch.home_score !== undefined ? remoteMatch.home_score : remoteMatch.homeScore;
              }
              if (remoteMatch.away_score !== undefined || remoteMatch.awayScore !== undefined) {
                mapped.awayScore = remoteMatch.away_score !== undefined ? remoteMatch.away_score : remoteMatch.awayScore;
              }
              if (remoteMatch.home_score_live !== undefined || remoteMatch.homeScoreLive !== undefined) {
                mapped.homeScoreLive = remoteMatch.home_score_live !== undefined ? remoteMatch.home_score_live : remoteMatch.homeScoreLive;
              }
              if (remoteMatch.away_score_live !== undefined || remoteMatch.awayScoreLive !== undefined) {
                mapped.awayScoreLive = remoteMatch.away_score_live !== undefined ? remoteMatch.away_score_live : remoteMatch.awayScoreLive;
              }
              if (remoteMatch.status) mapped.status = remoteMatch.status;
              if (remoteMatch.scorers) mapped.scorers = remoteMatch.scorers;
              if (remoteMatch.cards) mapped.cards = remoteMatch.cards;
              Object.assign(this.store.data.matches[idx], mapped);
            }
          });
        }

        if (data.teams && data.teams.length > 0) {
          data.teams.forEach(remoteTeam => {
            const idx = this.store.data.teams.findIndex(t => t.id === remoteTeam.id);
            if (idx !== -1) {
              const mapped = {
                name: remoteTeam.name || this.store.data.teams[idx].name,
                shortName: remoteTeam.short_name || remoteTeam.shortName || this.store.data.teams[idx].shortName,
                badgeColor: remoteTeam.badge_color || remoteTeam.badgeColor || this.store.data.teams[idx].badgeColor,
                city: remoteTeam.city !== undefined ? remoteTeam.city : this.store.data.teams[idx].city,
                group: remoteTeam.group_letter || remoteTeam.group || this.store.data.teams[idx].group
              };
              if (remoteTeam.players && Array.isArray(remoteTeam.players) && remoteTeam.players.length > 0) {
                mapped.players = remoteTeam.players;
              }
              if (remoteTeam.official_coach || remoteTeam.official_manager || remoteTeam.official) {
                mapped.official = {
                  ...this.store.data.teams[idx].official,
                  coach: remoteTeam.official_coach || (remoteTeam.official && remoteTeam.official.coach) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.coach) || '',
                  manager: remoteTeam.official_manager || (remoteTeam.official && remoteTeam.official.manager) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.manager) || '',
                  medic: remoteTeam.official_medic || (remoteTeam.official && remoteTeam.official.medic) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.medic) || '',
                  phone: remoteTeam.official_phone || (remoteTeam.official && remoteTeam.official.phone) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.phone) || '',
                  jerseyHome: remoteTeam.official_jersey_home || (remoteTeam.official && remoteTeam.official.jerseyHome) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.jerseyHome) || '',
                  jerseyAway: remoteTeam.official_jersey_away || (remoteTeam.official && remoteTeam.official.jerseyAway) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.jerseyAway) || '',
                  coachPhoto: remoteTeam.coach_photo || (remoteTeam.official && remoteTeam.official.coachPhoto) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.coachPhoto) || '',
                  managerPhoto: remoteTeam.manager_photo || (remoteTeam.official && remoteTeam.official.managerPhoto) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.managerPhoto) || ''
                };
              }
              Object.assign(this.store.data.teams[idx], mapped);
            }
          });
        }

        if (data.moments && data.moments.length > 0) this.store.data.moments = data.moments;
        if (data.sponsors && data.sponsors.length > 0) this.store.data.sponsors = data.sponsors;
        this.store.saveData();
        this.store.syncKnockoutFromStandings();
        this.renderCurrentView();
      }
    }).catch(() => {
      // Silent catch
    });
  },

  handleRemoteSync(table, payload) {
    if (!payload) return;
    if (table === 'matches') {
      const idx = this.store.data.matches.findIndex(m => m.id === payload.id);
      if (idx !== -1) {
        const mapped = {};
        if (payload.home_score !== undefined || payload.homeScore !== undefined) {
          mapped.homeScore = payload.home_score !== undefined ? payload.home_score : payload.homeScore;
        }
        if (payload.away_score !== undefined || payload.awayScore !== undefined) {
          mapped.awayScore = payload.away_score !== undefined ? payload.away_score : payload.awayScore;
        }
        if (payload.home_score_live !== undefined || payload.homeScoreLive !== undefined) {
          mapped.homeScoreLive = payload.home_score_live !== undefined ? payload.home_score_live : payload.homeScoreLive;
        }
        if (payload.away_score_live !== undefined || payload.awayScoreLive !== undefined) {
          mapped.awayScoreLive = payload.away_score_live !== undefined ? payload.away_score_live : payload.awayScoreLive;
        }
        if (payload.status) mapped.status = payload.status;
        if (payload.scorers) mapped.scorers = payload.scorers;
        if (payload.cards) mapped.cards = payload.cards;
        Object.assign(this.store.data.matches[idx], mapped);
        this.store.saveData();
        this.store.syncKnockoutFromStandings();
        this.renderMatches();
        this.renderStandings();
        this.renderBracket();
      }
    } else if (table === 'teams') {
      const idx = this.store.data.teams.findIndex(t => t.id === payload.id);
      if (idx !== -1) {
        const mapped = {
          name: payload.name || this.store.data.teams[idx].name,
          shortName: payload.short_name || payload.shortName || this.store.data.teams[idx].shortName,
          badgeColor: payload.badge_color || payload.badgeColor || this.store.data.teams[idx].badgeColor,
          city: payload.city !== undefined ? payload.city : this.store.data.teams[idx].city,
          group: payload.group_letter || payload.group || this.store.data.teams[idx].group
        };
        if (payload.players && Array.isArray(payload.players)) {
          mapped.players = payload.players;
        }
        if (payload.official_coach || payload.official_manager || payload.official) {
          mapped.official = {
            ...this.store.data.teams[idx].official,
            coach: payload.official_coach || (payload.official && payload.official.coach) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.coach) || '',
            manager: payload.official_manager || (payload.official && payload.official.manager) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.manager) || '',
            medic: payload.official_medic || (payload.official && payload.official.medic) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.medic) || '',
            phone: payload.official_phone || (payload.official && payload.official.phone) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.phone) || '',
            jerseyHome: payload.official_jersey_home || (payload.official && payload.official.jerseyHome) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.jerseyHome) || '',
            jerseyAway: payload.official_jersey_away || (payload.official && payload.official.jerseyAway) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.jerseyAway) || '',
            coachPhoto: payload.coach_photo || (payload.official && payload.official.coachPhoto) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.coachPhoto) || '',
            managerPhoto: payload.manager_photo || (payload.official && payload.official.managerPhoto) || (this.store.data.teams[idx].official && this.store.data.teams[idx].official.managerPhoto) || ''
          };
        }
        Object.assign(this.store.data.teams[idx], mapped);
      } else {
        this.store.data.teams.push(payload);
      }
      this.store.saveData();
      this.renderTeams();
      this.renderStandings();
    } else if (table === 'moments') {
      if (!this.store.data.moments) this.store.data.moments = [];
      const idx = this.store.data.moments.findIndex(m => m.id === payload.id);
      if (idx !== -1) {
        Object.assign(this.store.data.moments[idx], payload);
      } else {
        this.store.data.moments.unshift(payload);
      }
      this.store.saveData();
      this.renderMoments();
    }
  },

  initThemeAndViewMode() {
    const savedTheme = localStorage.getItem("pondok_futsal_theme") || "light";
    this.setTheme(savedTheme, false);
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
  },

  setTheme(theme, showToastMsg = true) {
    this.currentTheme = theme;
    localStorage.setItem("pondok_futsal_theme", theme);

    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#070b14");
    } else {
      document.body.classList.remove("dark-theme");
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#001838");
    }

    const toggleIcon = document.getElementById("themeToggleIcon");
    if (toggleIcon) {
      toggleIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    if (showToastMsg) {
      this.showToast(`Beralih ke Tampilan ${theme === 'light' ? '☀️ Mode Terang (Clean Stadium)' : '🌙 Mode Gelap (Night Stadium)'}`);
    }
  },

  setViewMode(mode, showToastMsg = true) {
    this.currentViewMode = mode;
    this.updateAdminVisibility();
    this.renderMatches();
    this.renderTeams();
    this.renderSponsors();
    this.renderHeroBanner();
  },

  // Kalkulasi rating performa pemain otomatis berdasarkan Gol, Assist, Kartu, & Posisi
  calculatePlayerRating(player) {
    if (!player) return "7.0";
    const g = parseInt(player.goals, 10) || 0;
    const a = parseInt(player.assists, 10) || 0;
    const yc = parseInt(player.yc, 10) || 0;
    const rc = parseInt(player.rc, 10) || 0;
    const pos = (player.pos || player.position || '').toLowerCase();

    // Base match rating untuk pemain yang bertanding
    let rating = 7.0;

    // Kontribusi Gol (+1.0 per gol)
    rating += (g * 1.0);

    // Kontribusi Assist (+0.7 per assist)
    rating += (a * 0.7);

    // Bonus penjaga gawang
    if (pos.includes('kiper') || pos.includes('gk')) {
      rating += 0.5;
    }

    // Penalti pelanggaran disiplin kartu
    rating -= (yc * 0.4);
    rating -= (rc * 1.5);

    // Rentang rating standar olahraga: 6.0 s/d 9.9
    if (rating > 9.9) rating = 9.9;
    if (rating < 6.0) rating = 6.0;

    return rating.toFixed(1);
  },

  updateAdminVisibility() {
    const isPanitia = admin.isAuthenticated === true;

    const btnQuickBanner = document.getElementById("btnChangeBannerQuick");
    if (btnQuickBanner) btnQuickBanner.style.display = isPanitia ? "inline-flex" : "none";

    const btnAddTeam = document.getElementById("btnAddTeamBtn");
    if (btnAddTeam) btnAddTeam.style.display = isPanitia ? "inline-flex" : "none";

    const btnManageSponsors = document.getElementById("btnManageSponsors");
    if (btnManageSponsors) btnManageSponsors.style.display = isPanitia ? "inline-flex" : "none";

    const btnAddMoment = document.getElementById("btnAddMomentBtn");
    if (btnAddMoment) btnAddMoment.style.display = isPanitia ? "inline-flex" : "none";
  },

  renderHeroBanner() {
    const bannerEl = document.getElementById("homeHeroBanner");
    if (!bannerEl) return;
    const bannerImg = (this.store.data.config && this.store.data.config.heroBannerImage) || "assets/hero_banner.jpg";
    bannerEl.style.backgroundImage = `url('${bannerImg}')`;
    bannerEl.style.backgroundSize = "cover";
    bannerEl.style.backgroundPosition = "center";
  },

  renderHeader() {
    const config = this.store.data.config;
    document.getElementById("headerTitle").textContent = config.tournamentName;
    document.getElementById("heroTitle").textContent = config.tournamentName;
    const cleanSub = (config.subTitle || "").replace(/â€¢/g, "•").replace(/â\S*¢/g, "•");
    document.getElementById("heroSub").textContent = cleanSub;
    document.getElementById("heroVenue").textContent = config.venue;
    document.getElementById("heroDates").textContent = config.dates;

    let cleanTicker = config.runningAnnouncement || "";
    if (cleanTicker.includes("Selamat Datang")) {
      cleanTicker = "🏆 " + cleanTicker.replace(/^.*Selamat Datang/i, "Selamat Datang").trim();
    } else {
      cleanTicker = cleanTicker.replace(/ð[^\s]*\s*†?/g, "🏆 ").replace(/ðŸ\S*/g, "🏆 ");
    }
    document.getElementById("tickerText").textContent = cleanTicker;
    this.renderHeroBanner();
  },

  bindEvents() {
    // Desktop Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Mobile Bottom Nav
    document.querySelectorAll(".mobile-nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Filters
    const dayFilter = document.getElementById("filterDay");
    if (dayFilter) {
      dayFilter.addEventListener("change", (e) => {
        this.filterDay = e.target.value;
        this.renderMatches();
      });
    }

    const pitchFilter = document.getElementById("filterPitch");
    if (pitchFilter) {
      pitchFilter.addEventListener("change", (e) => {
        this.filterPitch = e.target.value;
        this.renderMatches();
      });
    }

    const groupFilter = document.getElementById("filterGroup");
    if (groupFilter) {
      groupFilter.addEventListener("change", (e) => {
        this.filterGroup = e.target.value;
        this.renderMatches();
      });
    }

    // Modal Close buttons
    document.querySelectorAll(".modal-close, .btn-modal-close").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
        document.body.classList.remove("modal-open");
      });
    });

    // WhatsApp Share Button
    const btnShare = document.getElementById("btnShareWa");
    if (btnShare) {
      btnShare.addEventListener("click", () => {
        const text = encodeURIComponent(
          `🏆 *${this.store.data.config.tournamentName}*\n` +
          `Pantau jadwal pertandingan, skor langsung (live score), klasemen grup, bagan perempat final, dan sanksi kartu di link resmi turnamen ini:\n` +
          window.location.href
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
      });
    }

    // Mobile swipe-back gesture & browser history management (HP Friendly)
    try {
      history.replaceState({ tab: "home" }, "");
    } catch (e) {}

    window.addEventListener("popstate", (e) => {
      // 1. Jika ada popup modal aktif, tutup modal (jangan keluar aplikasi)
      const activeModal = document.querySelector(".modal-overlay.active");
      if (activeModal) {
        activeModal.classList.remove("active");
        try {
          history.pushState({ tab: this.currentTab }, "");
        } catch (err) {}
        return;
      }

      // 2. Jika splash screen masih aktif, sembunyikan splash screen
      const splash = document.getElementById("appSplashScreen");
      if (splash && !splash.classList.contains("splash-fade-out") && splash.style.display !== "none") {
        this.dismissSplashScreen();
        try {
          history.pushState({ tab: this.currentTab }, "");
        } catch (err) {}
        return;
      }

      // 3. Jika sedang berada di tab selain Beranda, kembali ke Beranda (Menu Awal)
      if (this.currentTab !== "home") {
        this.switchTab("home", false);
        return;
      }

      if (e.state && e.state.tab) {
        this.switchTab(e.state.tab, false);
      }
    });
  },

  switchTab(tabId, pushHistory = true) {
    if (pushHistory && tabId !== this.currentTab) {
      try {
        history.pushState({ tab: tabId }, "");
      } catch (err) {}
    }
    this.currentTab = tabId;

    // Update Desktop Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });

    // Update Mobile Nav
    document.querySelectorAll(".mobile-nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.tab === tabId);
    });

    // Update Panes
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.remove("active");
    });
    const targetPane = document.getElementById(`pane-${tabId}`);
    if (targetPane) {
      targetPane.classList.add("active");
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  renderCurrentView() {
    switch (this.currentTab) {
      case "home":
        this.renderHome();
        break;
      case "matches":
        this.renderMatches();
        break;
      case "standings":
        this.renderStandings();
        break;
      case "bracket":
        this.renderBracket();
        break;
      case "teams":
        this.renderTeams();
        break;
      case "discipline":
        this.renderDiscipline();
        break;
      case "scorers":
        this.renderTopScorers();
        break;
      case "juknis":
        this.renderJuknis();
        break;
    }
  },

  // 0. RENDER HOME (BERANDA UTAMA)
  renderHome() {
    this.renderLiveStreamHero();
    const homeData = this.store.data.homeData || DEFAULT_DATA.homeData;
    if (!homeData) return;

    // 1. Update MVP Card
    const mvp = homeData.mvp;
    if (mvp) {
      const mvpPhoto = document.getElementById("mvpPhoto");
      if (mvpPhoto && mvp.photo) mvpPhoto.src = mvp.photo;

      const mvpName = document.getElementById("mvpName");
      if (mvpName) mvpName.textContent = `${mvp.name} (#${mvp.number})`;

      const mvpTeam = document.getElementById("mvpTeam");
      if (mvpTeam) mvpTeam.textContent = mvp.team;

      const mvpPos = document.getElementById("mvpPos");
      if (mvpPos) mvpPos.textContent = `Posisi: ${mvp.position}`;

      const mvpGoals = document.getElementById("mvpGoals");
      if (mvpGoals) mvpGoals.textContent = mvp.goals;

      const mvpAssists = document.getElementById("mvpAssists");
      if (mvpAssists) mvpAssists.textContent = mvp.assists;

      const mvpMotm = document.getElementById("mvpMotm");
      if (mvpMotm) mvpMotm.textContent = `${mvp.motmCount || 2}x`;

      const mvpRating = document.getElementById("mvpRating");
      if (mvpRating) mvpRating.textContent = this.calculatePlayerRating(mvp);

      const mvpQuote = document.getElementById("mvpQuote");
      if (mvpQuote) mvpQuote.textContent = `"${mvp.quote}"`;
    }

    // 2. Render News Grid
    const newsContainer = document.getElementById("homeNewsContainer");
    if (newsContainer && homeData.news) {
      newsContainer.innerHTML = homeData.news.map(n => `
        <div class="news-card">
          <div class="news-header-meta">
            <span class="news-tag">${n.tag}</span>
            <span class="news-date">📅 ${n.date}</span>
          </div>
          <div class="news-title">${n.title}</div>
          <div class="news-desc">${n.desc}</div>
          <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 700;">ACC Newsroom</span>
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; cursor: pointer;" onclick="app.showToast('Memuat rincian berita...')">Baca Selengkapnya ➔</span>
          </div>
        </div>
      `).join("");
    }

    // 3. Render Moments, Sponsors & Hero Banner
    this.renderMoments();
    this.renderHeroBanner();
    this.renderSponsors();
    this.updateAdminVisibility();
  },

  // RENDER ACC 2026 MOMENTS™ (FIFA WORLD CUP STYLE CAROUSEL)
  renderMoments() {
    const container = document.getElementById("momentsCarousel");
    if (!container) return;

    const moments = this.store.data.moments || (this.store.data.homeData && this.store.data.homeData.moments) || DEFAULT_DATA.homeData.moments || [];

    if (moments.length === 0) {
      container.innerHTML = `
        <div style="color: #94a3b8; font-size: 0.85rem; padding: 24px; text-align: center; width: 100%;">
          Belum ada momen pertandingan yang diunggah. Panitia dapat menambahkan momen baru.
        </div>
      `;
      return;
    }

    container.innerHTML = moments.map(m => `
      <div class="moment-card" style="background-image: url('${m.image || 'assets/moment_celebration.jpg'}');" onclick="app.openMomentModal('${m.id}')" title="Klik untuk lihat momen spektakuler">
        <div class="moment-badge-new">${m.tag || 'NEW'}</div>
        <div class="moment-badge-tag">${m.badge || '🔥 HIGHLIGHT'}</div>
        <div class="moment-gradient-overlay">
          <div class="moment-player-row">
            <span>⚽</span> <span>${m.player}</span>
          </div>
          <div class="moment-title-text">${m.title}</div>
          <div class="moment-team-text">${m.team}</div>
        </div>
      </div>
    `).join("");
  },

  scrollMoments(direction) {
    const carousel = document.getElementById("momentsCarousel");
    if (carousel) {
      carousel.scrollBy({ left: direction * 260, behavior: "smooth" });
    }
  },

  openMomentModal(id) {
    const moments = this.store.data.moments || (this.store.data.homeData && this.store.data.homeData.moments) || DEFAULT_DATA.homeData.moments || [];
    const moment = moments.find(m => m.id === id);
    if (!moment) return;

    this.activeMoment = moment;

    const modal = document.getElementById("momentModal");
    const imgEl = document.getElementById("momentModalImg");
    const badgeNew = document.getElementById("momentModalBadgeNew");
    const badgeTag = document.getElementById("momentModalBadgeTag");
    const headline = document.getElementById("momentModalHeadline");
    const player = document.getElementById("momentModalPlayer");
    const team = document.getElementById("momentModalTeam");
    const caption = document.getElementById("momentModalCaption");

    if (imgEl) imgEl.src = moment.image || 'assets/moment_celebration.jpg';
    if (badgeNew) badgeNew.textContent = moment.tag || 'NEW';
    if (badgeTag) badgeTag.textContent = moment.badge || '🔥 HIGHLIGHT';
    if (headline) headline.textContent = moment.title;
    if (player) player.textContent = moment.player;
    if (team) team.textContent = moment.team;
    if (caption) caption.textContent = moment.caption || "Sorotan aksi spektakuler turnamen futsal ACC 2026.";

    if (modal) modal.classList.add("active");
  },

  shareMoment() {
    if (!this.activeMoment) return;
    const m = this.activeMoment;
    const shareText = `*ACC 2026 MOMENTS™: ${m.title}*\n👤 ${m.player} (${m.team})\n✨ ${m.caption}\n\n🏆 Pantau aksi seru lainnya di ACC 2026 Portal!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  },

  // RENDER SPONSORS DYNAMICALLY (Sponsor Utama Lebih Besar & Menonjol)
  renderSponsors() {
    const sponsors = this.store.data.sponsors;
    if (!sponsors) return;

    const isPanitia = admin.isAuthenticated === true;

    // 1. Platinum (Sponsor Utama - Kartu Lebih Besar & Menonjol)
    const platContainer = document.getElementById("sponsorsPlatinumGrid");
    if (platContainer && sponsors.platinum) {
      platContainer.innerHTML = sponsors.platinum.map(s => {
        const logoHtml = s.image ?
          `<img src="${s.image}" alt="${s.name}" class="sponsor-logo-img">` :
          `<span style="font-size: 2.2rem;">${s.icon || '🏦'}</span>`;

        return `
          <div class="sponsor-card-platinum">
            <div class="sponsor-icon-circle-lg">
              ${logoHtml}
            </div>
            <div class="sponsor-info" style="flex: 1;">
              <div class="sponsor-name">${s.name}</div>
              <div class="sponsor-role">${s.type || s.role || 'Official Partner'}</div>
              <div>
                <span class="badge-platinum-vip">👑 SPONSOR UTAMA (PLATINUM)</span>
              </div>
            </div>
            ${isPanitia ? `
              <div style="display: flex; flex-direction: column; gap: 4px; z-index: 2;">
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('platinum', '${s.id || s.name}')" title="Edit Sponsor" style="font-size: 0.72rem; padding: 2px 7px; background: rgba(0,0,0,0.5); color: #fff;">✏️</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('platinum', '${s.id || s.name}')" title="Hapus Sponsor" style="font-size: 0.72rem; padding: 2px 7px; background: rgba(0,0,0,0.5); color: #ef4444;">🗑️</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join("");
    }

    // 2. Gold (Mitra Pendukung Resmi)
    const goldContainer = document.getElementById("sponsorsGoldGrid");
    if (goldContainer && sponsors.gold) {
      goldContainer.innerHTML = sponsors.gold.map(s => {
        const logoHtml = s.image ?
          `<img src="${s.image}" alt="${s.name}" class="sponsor-logo-img">` :
          `<span style="font-size: 1.4rem;">${s.icon || '⚽'}</span>`;

        return `
          <div class="sponsor-card">
            <div class="sponsor-icon-circle">
              ${logoHtml}
            </div>
            <div class="sponsor-info" style="flex: 1;">
              <div class="sponsor-name">${s.name}</div>
              <div class="sponsor-role">${s.type || s.role || 'Official Partner'}</div>
            </div>
            ${isPanitia ? `
              <div style="display: flex; gap: 4px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('gold', '${s.id || s.name}')" title="Edit Sponsor" style="font-size: 0.72rem; padding: 2px 7px;">✏️</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('gold', '${s.id || s.name}')" title="Hapus Sponsor" style="font-size: 0.72rem; padding: 2px 7px; color: #ef4444;">🗑️</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join("");
    }

    // 3. Media Partners
    const mediaContainer = document.getElementById("sponsorsMediaGrid");
    if (mediaContainer && sponsors.media) {
      mediaContainer.innerHTML = sponsors.media.map(s => {
        const logoHtml = s.image ?
          `<img src="${s.image}" alt="${s.name}" class="sponsor-logo-img">` :
          `<span style="font-size: 1.4rem;">${s.icon || '📡'}</span>`;

        return `
          <div class="sponsor-card">
            <div class="sponsor-icon-circle">
              ${logoHtml}
            </div>
            <div class="sponsor-info" style="flex: 1;">
              <div class="sponsor-name">${s.name}</div>
              <div class="sponsor-role">${s.type || s.role || 'Media Partner'}</div>
            </div>
            ${isPanitia ? `
              <div style="display: flex; gap: 4px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('media', '${s.id || s.name}')" title="Edit Sponsor" style="font-size: 0.72rem; padding: 2px 7px;">✏️</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('media', '${s.id || s.name}')" title="Hapus Sponsor" style="font-size: 0.72rem; padding: 2px 7px; color: #ef4444;">🗑️</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join("");
    }
  },

  // 1. RENDER MATCHES (UEFA & WORLD CUP STYLE - DUAL TEAM EVENTS SPLIT)
  renderMatches() {
    const container = document.getElementById("matchesList");
    if (!container) return;

    let matches = this.store.data.matches;

    // Filter by Active Category (SMP / SD / all)
    if (this.currentCategory !== "all") {
      matches = matches.filter(m => (m.category || "SMP") === this.currentCategory);
    }

    // Filter by Day
    if (this.filterDay !== "all") {
      matches = matches.filter(m => String(m.matchday) === this.filterDay);
    }
    // Filter by Pitch
    if (this.filterPitch !== "all") {
      matches = matches.filter(m => m.pitch.includes(this.filterPitch));
    }
    // Filter by Group
    if (this.filterGroup !== "all") {
      matches = matches.filter(m => m.group === this.filterGroup);
    }

    // Update Status Pill Badges Count
    const allCatMatches = (this.store.data.matches || []).filter(m => (m.category || "SMP") === this.currentCategory);
    const countAll = allCatMatches.length;
    const countLive = allCatMatches.filter(m => m.status === "live").length;
    const countUpcoming = allCatMatches.filter(m => m.status === "upcoming" || (!m.status || m.status === "scheduled")).length;
    const countFinished = allCatMatches.filter(m => m.status === "finished").length;

    const elAll = document.getElementById("countAllMatches");
    if (elAll) elAll.textContent = countAll;
    const elLive = document.getElementById("countLiveMatches");
    if (elLive) elLive.textContent = countLive;
    const elUp = document.getElementById("countUpcomingMatches");
    if (elUp) elUp.textContent = countUpcoming;
    const elFin = document.getElementById("countFinishedMatches");
    if (elFin) elFin.textContent = countFinished;

    // Filter by Status (all / live / upcoming / finished)
    if (this.filterStatus === "live") {
      matches = matches.filter(m => m.status === "live");
    } else if (this.filterStatus === "upcoming") {
      matches = matches.filter(m => m.status === "upcoming" || (!m.status || m.status === "scheduled"));
    } else if (this.filterStatus === "finished") {
      matches = matches.filter(m => m.status === "finished");
    }

    if (matches.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg);">
          <p>Tidak ada jadwal pertandingan pada kategori atau filter status yang dipilih.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(m => {
      const home = this.store.getTeam(m.homeId) || { name: m.homePlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b", city: "-" };
      const away = this.store.getTeam(m.awayId) || { name: m.awayPlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b", city: "-" };

      const isLive = m.status === "live";
      const isFinished = m.status === "finished";
      const isUpcoming = !isLive && !isFinished;
      const statusClass = isLive ? "status-live" : (isFinished ? "status-finished" : "status-upcoming");

      let statusBarHtml = "";
      if (isLive) {
        statusBarHtml = `
          <div class="match-status-bar bar-live">
            <div class="bar-left">
              <span class="pulse-dot"></span>
              <strong>SEDANG BERLANGSUNG (LIVE)${m.liveMinute ? ` • Menit ${m.liveMinute}` : ''}</strong>
            </div>
            <div class="bar-right">
              <span>🏟️ ${m.pitch || 'Lapangan Utama'}</span>
            </div>
          </div>
        `;
      } else if (isFinished) {
        statusBarHtml = `
          <div class="match-status-bar bar-finished">
            <div class="bar-left">
              <span>✅</span>
              <strong>PERTANDINGAN SELESAI (FULL TIME)</strong>
            </div>
            <div class="bar-right">
              <span>Hasil Skor Resmi</span>
            </div>
          </div>
        `;
      } else {
        statusBarHtml = `
          <div class="match-status-bar bar-upcoming">
            <div class="bar-left">
              <span>⏰</span>
              <strong>JADWAL AKAN DATANG</strong>
            </div>
            <div class="bar-right">
              <span>Kick-off: ${m.time}</span>
            </div>
          </div>
        `;
      }

      const homeScore = isLive ? (m.homeScoreLive ?? 0) : (isFinished ? m.homeScore : "-");
      const awayScore = isLive ? (m.awayScoreLive ?? 0) : (isFinished ? m.awayScore : "-");

      // Split scorers & cards per team
      const homeScorers = (m.scorers || []).filter(s => s.team === m.homeId);
      const awayScorers = (m.scorers || []).filter(s => s.team === m.awayId);
      const homeCards = (m.cards || []).filter(c => c.team === m.homeId);
      const awayCards = (m.cards || []).filter(c => c.team === m.awayId);

      const catBadge = (m.category || "SMP") === "SD" ?
        `<span class="match-category-tag cat-sd">🎒 SD (U-12)</span>` :
        `<span class="match-category-tag cat-smp">🏆 SMP (U-15)</span>`;

      return `
        <div class="match-card uefa-fixture-card ${statusClass} ${isLive ? 'is-live' : ''}">
          ${statusBarHtml}
          <!-- HEADER META -->
          <div class="fixture-header-meta">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${catBadge}
              <span class="fixture-pitch-pill">🏟️ ${m.pitch}</span>
              <span class="fixture-group-pill">${m.stage === 'knockout' ? (m.roundName || 'Babak Gugur') : `Grup ${m.group}`}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="fixture-time-hint">📅 ${m.date}</span>
              <span class="match-status-tag ${m.status}">
                ${isLive ? `<span class="pulse-dot"></span> LIVE ${m.liveMinute || ''}` : (isFinished ? 'Selesai' : m.time)}
              </span>
            </div>
          </div>

          <!-- FIXTURE ROWS BODY (2 BARIS TIM LEGA, TANPA TERPOTONG) -->
          <div class="match-fixture-content">
            
            <!-- BARIS 1: TIM HOME -->
            <div class="fixture-team-row" onclick="app.openTeamModal('${home.id}')" title="Klik untuk lihat profil tim">
              <div class="fixture-team-left">
                <div class="team-avatar-mini" style="background: ${home.badgeColor || '#10b981'};">
                  ${home.logo ? `<img src="${home.logo}" class="team-logo-img" alt="${home.name}">` : (home.shortName || 'TBD').substring(0, 3)}
                </div>
                <div class="fixture-team-name-wrap">
                  <div class="fixture-team-fullname">${home.name}</div>
                  <div class="fixture-team-subcity">📍 ${home.city || '-'}</div>
                </div>
              </div>
              <div class="fixture-score-number ${isLive ? 'live' : ''}">
                ${homeScore}
              </div>
            </div>

            <!-- GOL & KARTU TIM HOME (BERADA PERSIS DI BAWAH NAMA TIM HOME) -->
            ${(homeScorers.length > 0 || homeCards.length > 0) ? `
              <div class="fixture-team-events">
                ${homeScorers.map(s => `
                  <span class="fixture-event-chip scorer">
                    <span>⚽</span>
                    <span>${s.player}</span>
                    <span class="chip-min">${s.minute}</span>
                  </span>
                `).join("")}
                ${homeCards.map(c => `
                  <span class="fixture-event-chip">
                    <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                    <span>${c.player}</span>
                    <span class="chip-min">${c.minute}</span>
                  </span>
                `).join("")}
              </div>
            ` : ''}

            <div class="fixture-row-divider"></div>

            <!-- BARIS 2: TIM AWAY -->
            <div class="fixture-team-row" onclick="app.openTeamModal('${away.id}')" title="Klik untuk lihat profil tim">
              <div class="fixture-team-left">
                <div class="team-avatar-mini" style="background: ${away.badgeColor || '#3b82f6'};">
                  ${away.logo ? `<img src="${away.logo}" class="team-logo-img" alt="${away.name}">` : (away.shortName || 'TBD').substring(0, 3)}
                </div>
                <div class="fixture-team-name-wrap">
                  <div class="fixture-team-fullname">${away.name}</div>
                  <div class="fixture-team-subcity">📍 ${away.city || '-'}</div>
                </div>
              </div>
              <div class="fixture-score-number ${isLive ? 'live' : ''}">
                ${awayScore}
              </div>
            </div>

            <!-- GOL & KARTU TIM AWAY (BERADA PERSIS DI BAWAH NAMA TIM AWAY) -->
            ${(awayScorers.length > 0 || awayCards.length > 0) ? `
              <div class="fixture-team-events">
                ${awayScorers.map(s => `
                  <span class="fixture-event-chip scorer">
                    <span>⚽</span>
                    <span>${s.player}</span>
                    <span class="chip-min">${s.minute}</span>
                  </span>
                `).join("")}
                ${awayCards.map(c => `
                  <span class="fixture-event-chip">
                    <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                    <span>${c.player}</span>
                    <span class="chip-min">${c.minute}</span>
                  </span>
                `).join("")}
              </div>
            ` : ''}

          </div>

          <!-- FOOTER AKSI -->
          <div class="fixture-footer-bar">
            <span class="fixture-time-hint">⏰ Kick-off: ${m.time}</span>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="app.showMatchDetail('${m.id}')" style="font-size: 0.72rem; padding: 4px 8px;">
                ℹ️ Detail
              </button>
              <button class="btn ${admin.isAuthenticated === true ? 'btn-admin' : 'btn-outline'} btn-sm" onclick="admin.openMatchEditor('${m.id}')" title="Atur Tim Lawan & Jadwal" style="font-size: 0.72rem; padding: 4px 8px;">
                ⚙️ Atur Lawan
              </button>
              <button class="btn ${admin.isAuthenticated === true ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="admin.openQuickScore('${m.id}')" title="Input Skor & Kartu Pertandingan" style="font-size: 0.72rem; padding: 4px 8px;">
                ✏️ Skor
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 2. RENDER STANDINGS (4 Grup Lengkap per Kategori: A, B, C, D)
  renderStandings() {
    const container = document.getElementById("groupsStandingsContainer");
    if (!container) return;

    let groupsToShow = [];
    if (this.currentCategory === "SMP") {
      groupsToShow = [
        { letter: "A", label: "GRUP A (SMP / MTs)", category: "SMP" },
        { letter: "B", label: "GRUP B (SMP / MTs)", category: "SMP" },
        { letter: "C", label: "GRUP C (SMP / MTs)", category: "SMP" },
        { letter: "D", label: "GRUP D (SMP / MTs)", category: "SMP" }
      ];
    } else {
      groupsToShow = [
        { letter: "A", label: "GRUP A (SD / MI)", category: "SD" },
        { letter: "B", label: "GRUP B (SD / MI)", category: "SD" },
        { letter: "C", label: "GRUP C (SD / MI)", category: "SD" },
        { letter: "D", label: "GRUP D (SD / MI)", category: "SD" }
      ];
    }

    container.innerHTML = groupsToShow.map(g => {
      const standings = this.store.calculateGroupStandings(g.letter, g.category);

      return `
        <div class="group-card">
          <div class="group-card-header">
            <div class="group-title">
              <span class="group-badge" style="background: ${g.category === 'SD' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #047857)'};">
                ${g.category === 'SD' ? '🎒 SD' : '🏆 SMP'}
              </span>
              <span>${g.label}</span>
            </div>
            <small style="color: var(--primary); font-size: 0.72rem; font-weight: 700;">Top 2 Lolos 8 Besar</small>
          </div>

          <div class="table-responsive">
            <table class="standings-table">
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th class="th-team">Sekolah / Tim</th>
                  <th class="col-secondary">MP</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th class="col-secondary">GF</th>
                  <th class="col-secondary">GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                ${standings.map((row, idx) => {
                  const isQualify = idx < 2;
                  return `
                    <tr class="${isQualify ? 'qualify' : ''}">
                      <td class="td-pos">${idx + 1}</td>
                      <td class="td-team" onclick="app.openTeamModal('${row.team.id}')" style="cursor: pointer;" title="Klik untuk lihat skuad">
                        <span class="mini-badge" style="background: ${row.team.badgeColor};">
                          ${row.team.logo ? `<img src="${row.team.logo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : row.team.shortName.substring(0, 2)}
                        </span>
                        <span>${row.team.name}</span>
                      </td>
                      <td class="col-secondary">${row.mp}</td>
                      <td>${row.w}</td>
                      <td>${row.d}</td>
                      <td>${row.l}</td>
                      <td class="col-secondary">${row.gf}</td>
                      <td class="col-secondary">${row.ga}</td>
                      <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
                      <td class="td-pts">${row.pts}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>

          <div class="table-legend">
            <span class="legend-dot"></span>
            <span>Peringkat 1 & 2 melaju ke Babak 8 Besar (Perempat Final) ${g.category}</span>
          </div>
        </div>
      `;
    }).join("");
  },

  // 3. RENDER BRACKET (Bagan 8 Besar Lengkap per Kategori - FIFA / UEFA Tournament Tree)
  renderBracket() {
    const container = document.getElementById("bracketTree");
    if (!container) return;

    this.store.syncKnockoutFromStandings();

    const activeCat = this.currentCategory;
    const isSMP = activeCat === "SMP";

    // Sort knockout matches properly
    const qfMatches = [
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "QF1_" + activeCat || m.id === "QF1")),
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "QF2_" + activeCat || m.id === "QF2")),
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "QF3_" + activeCat || m.id === "QF3")),
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "QF4_" + activeCat || m.id === "QF4")),
    ];

    const sfMatches = [
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "SF1_" + activeCat || m.id === "SF1")),
      this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id === "SF2_" + activeCat || m.id === "SF2")),
    ];

    const thirdMatch = this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id.startsWith("3RD")));
    const finalMatch = this.store.data.matches.find(m => (m.category === activeCat || m.id.endsWith("_" + activeCat)) && (m.id.startsWith("FINAL")));

    const renderBracketCard = (m, cardType = "qf") => {
      if (!m) return "";
      const home = this.store.getTeam(m.homeId);
      const away = this.store.getTeam(m.awayId);

      const homeName = home ? home.name : (m.homePlaceholder || "TBD");
      const awayName = away ? away.name : (m.awayPlaceholder || "TBD");

      const isLive = m.status === "live";
      const isFinished = m.status === "finished";

      const homeScore = isLive ? (m.homeScoreLive ?? 0) : (isFinished ? m.homeScore : "-");
      const awayScore = isLive ? (m.awayScoreLive ?? 0) : (isFinished ? m.awayScore : "-");

      const isHomeWinner = isFinished && Number(homeScore) > Number(awayScore);
      const isAwayWinner = isFinished && Number(awayScore) > Number(homeScore);

      // Seed / placeholder hint (e.g., 1A, 2B, QF1)
      let homeSeed = "";
      let awaySeed = "";
      if (m.homePlaceholder) {
        const hMatch = m.homePlaceholder.match(/Juara\s+Grup\s+([A-D])/i);
        const hRunMatch = m.homePlaceholder.match(/Runner-up\s+Grup\s+([A-D])/i);
        if (hMatch) homeSeed = `1${hMatch[1].toUpperCase()}`;
        else if (hRunMatch) homeSeed = `2${hRunMatch[1].toUpperCase()}`;
        else if (m.homePlaceholder.includes("QF")) homeSeed = "QF";
        else if (m.homePlaceholder.includes("SF")) homeSeed = "SF";
      }
      if (m.awayPlaceholder) {
        const aMatch = m.awayPlaceholder.match(/Juara\s+Grup\s+([A-D])/i);
        const aRunMatch = m.awayPlaceholder.match(/Runner-up\s+Grup\s+([A-D])/i);
        if (aMatch) awaySeed = `1${aMatch[1].toUpperCase()}`;
        else if (aRunMatch) awaySeed = `2${aRunMatch[1].toUpperCase()}`;
        else if (m.awayPlaceholder.includes("QF")) awaySeed = "QF";
        else if (m.awayPlaceholder.includes("SF")) awaySeed = "SF";
      }

      let statusBadge = "";
      if (isLive) {
        statusBadge = `<span class="bracket-status-chip live"><span class="pulse-dot"></span> LIVE ${m.liveMinute || ''}</span>`;
      } else if (isFinished) {
        statusBadge = `<span class="bracket-status-chip ft">FT • Selesai</span>`;
      } else {
        statusBadge = `<span class="bracket-status-chip upcoming">📅 ${m.date ? m.date.replace(' Nov 2026', '') : ''} • ${m.time ? m.time.replace(' WIB', '') : ''}</span>`;
      }

      const isFinal = cardType === "final";
      const isBronze = cardType === "bronze";

      const cardClasses = [
        "bracket-match-card",
        isFinal ? "is-final" : "",
        isBronze ? "is-bronze" : "",
        isLive ? "is-live" : ""
      ].filter(Boolean).join(" ");

      return `
        <div class="${cardClasses}" onclick="app.switchTab('matches')" title="Klik untuk lihat detail jadwal babak ini">
          <div class="bracket-card-header">
            <span class="bracket-round-label">${m.roundName || 'Babak Gugur'}</span>
            ${statusBadge}
          </div>

          <div class="bracket-teams-container">
            <!-- HOME -->
            <div class="bracket-team-line ${isHomeWinner ? 'winner' : ''}">
              <div class="bracket-team-left">
                <div class="bracket-team-avatar" style="background: ${home ? home.badgeColor : '#64748b'};">
                  ${home && home.logo ? `<img src="${home.logo}" alt="${homeName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (home ? (home.shortName || 'TBD').substring(0, 2) : 'TBD')}
                </div>
                <div class="bracket-team-name" title="${homeName}">${homeName}</div>
                ${homeSeed ? `<span class="bracket-team-seed">${homeSeed}</span>` : ''}
              </div>
              <div class="bracket-score-val">${homeScore}</div>
            </div>

            <!-- AWAY -->
            <div class="bracket-team-line ${isAwayWinner ? 'winner' : ''}">
              <div class="bracket-team-left">
                <div class="bracket-team-avatar" style="background: ${away ? away.badgeColor : '#64748b'};">
                  ${away && away.logo ? `<img src="${away.logo}" alt="${awayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (away ? (away.shortName || 'TBD').substring(0, 2) : 'TBD')}
                </div>
                <div class="bracket-team-name" title="${awayName}">${awayName}</div>
                ${awaySeed ? `<span class="bracket-team-seed">${awaySeed}</span>` : ''}
              </div>
              <div class="bracket-score-val">${awayScore}</div>
            </div>
          </div>

          <div class="bracket-card-footer">
            <span>🏟️ ${m.pitch ? m.pitch.replace(" (Vinyl)", "") : "Lapangan Utama"}</span>
            <span style="color: var(--primary); font-weight: 700;">${isFinished ? 'Skor Akhir' : 'Detail Laga ➔'}</span>
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      <!-- TOP ANNOUNCEMENT & CATEGORY SWITCHER BAR -->
      <div class="bracket-top-bar">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span class="bracket-category-badge">
            ${isSMP ? '🏆 KATEGORI SMP (U-15) • BABAK 8 BESAR S/D GRAND FINAL' : '🎒 KATEGORI SD (U-12) • BABAK 8 BESAR S/D GRAND FINAL'}
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            *Juara & Runner-up Grup otomatis masuk ke bagan sistem gugur
          </span>
        </div>

        <div class="bracket-cat-switcher">
          <button type="button" class="bracket-switch-btn ${isSMP ? 'active' : ''}" onclick="app.setCategory('SMP')">
            🏆 SMP (U-15)
          </button>
          <button type="button" class="bracket-switch-btn ${!isSMP ? 'active' : ''}" onclick="app.setCategory('SD')">
            🎒 SD (U-12)
          </button>
        </div>
      </div>

      <div class="bracket-mobile-hint">
        👉 Geser layar ke samping untuk melihat Semifinal & Final
      </div>

      <!-- MAIN TREE CONTAINER -->
      <div class="bracket-tree-container">
        <!-- HEADER ROW -->
        <div class="bracket-tree-headers">
          <div class="bracket-header-cell col-qf">
            <div class="bracket-header-pill">BABAK 8 BESAR</div>
            <div class="bracket-header-title">PEREMPAT FINAL</div>
            <div class="bracket-header-sub">📅 18 Nov 2026 • 4 Pertandingan</div>
          </div>

          <div class="bracket-header-spacer"></div>

          <div class="bracket-header-cell col-sf">
            <div class="bracket-header-pill">BABAK 4 BESAR</div>
            <div class="bracket-header-title">SEMIFINAL</div>
            <div class="bracket-header-sub">📅 19 Nov 2026 • 2 Pertandingan</div>
          </div>

          <div class="bracket-header-spacer"></div>

          <div class="bracket-header-cell col-final">
            <div class="bracket-header-pill" style="color: var(--accent-gold);">BABAK PUNCAK & JUARA 3</div>
            <div class="bracket-header-title">🏆 GRAND FINAL 🏆</div>
            <div class="bracket-header-sub">📅 20 Nov 2026 • Penentuan Juara</div>
          </div>
        </div>

        <!-- TREE BODY -->
        <div class="bracket-tree-body">
          <!-- COLUMN 1: QUARTERFINALS -->
          <div class="bracket-col-qf">
            <!-- Pair 1: QF1 & QF2 -->
            <div class="bracket-pair">
              ${qfMatches[0] ? renderBracketCard(qfMatches[0], "qf") : ''}
              ${qfMatches[1] ? renderBracketCard(qfMatches[1], "qf") : ''}
            </div>
            <!-- Pair 2: QF3 & QF4 -->
            <div class="bracket-pair">
              ${qfMatches[2] ? renderBracketCard(qfMatches[2], "qf") : ''}
              ${qfMatches[3] ? renderBracketCard(qfMatches[3], "qf") : ''}
            </div>
          </div>

          <!-- CONNECTOR 1: QF TO SF -->
          <div class="bracket-connector-col">
            <svg class="bracket-connector-svg" viewBox="0 0 40 580" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 62 H 20 V 206 H 0 M 20 134 H 40 M 0 374 H 20 V 518 H 0 M 20 446 H 40" stroke="var(--border-bracket, #94a3b8)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- COLUMN 2: SEMIFINALS -->
          <div class="bracket-col-sf">
            <div class="bracket-sf-slot">
              ${sfMatches[0] ? renderBracketCard(sfMatches[0], "sf") : ''}
            </div>
            <div class="bracket-sf-slot">
              ${sfMatches[1] ? renderBracketCard(sfMatches[1], "sf") : ''}
            </div>
          </div>

          <!-- CONNECTOR 2: SF TO FINAL -->
          <div class="bracket-connector-col">
            <svg class="bracket-connector-svg" viewBox="0 0 40 580" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 134 H 20 V 446 H 0 M 20 290 H 40" stroke="var(--border-bracket, #94a3b8)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- COLUMN 3: GRAND FINAL & BRONZE -->
          <div class="bracket-col-final">
            <!-- Top Trophy Box -->
            <div class="bracket-trophy-top">
              <div style="font-size: 1.8rem; line-height: 1; margin-bottom: 4px;">🏆</div>
              <div style="color: var(--accent-gold); font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px;">
                TROFI BERGILIR ACC 2026
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                🥇 Juara 1 • 🥈 Juara 2 • 🥉 Juara 3
              </div>
              <div style="font-size: 0.68rem; color: var(--primary); font-weight: 700; margin-top: 4px;">
                + Medali & Uang Pembinaan Santri
              </div>
            </div>

            <!-- Center Grand Final Slot -->
            <div class="bracket-final-slot">
              ${finalMatch ? renderBracketCard(finalMatch, "final") : ''}
            </div>

            <!-- Bottom Bronze Match Slot -->
            <div class="bracket-bronze-slot">
              <div style="font-size: 0.75rem; font-weight: 800; color: #cd7f32; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span>🥉</span> PEREBUTAN JUARA 3 (BRONZE FINAL)
              </div>
              ${thirdMatch ? renderBracketCard(thirdMatch, "bronze") : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 4. RENDER TEAM & OFFICIAL PORTAL (FILTERED BY CATEGORY)
  renderTeams() {
    const container = document.getElementById("teamGridContainer");
    if (!container) return;

    let teams = this.store.data.teams;
    if (this.currentCategory !== "all") {
      teams = teams.filter(t => (t.category || "SMP") === this.currentCategory);
    }

    const countEl = document.getElementById("teamsTotalCount");
    if (countEl) {
      countEl.textContent = `${teams.length} Tim (${this.currentCategory === 'all' ? 'Semua Kelas' : (this.currentCategory === 'SMP' ? 'SMP / MTs' : 'SD / MI')})`;
    }

    const isPanitia = admin.isAuthenticated === true;

    container.innerHTML = teams.map(t => {
      const waNumber = t.official.phone.replace(/[^0-9]/g, "");
      const waLink = `https://wa.me/62${waNumber.startsWith('0') ? waNumber.slice(1) : waNumber}?text=Halo%20Official%20${encodeURIComponent(t.name)}%2C%20informasi%20ACC%202026`;

      return `
        <div class="school-card" onclick="app.openTeamModal('${t.id}')">
          <div class="school-card-banner" style="background: linear-gradient(135deg, ${t.badgeColor || '#10b981'}, #0f172a);">
            <span class="group-tag-corner">
              ${(t.category || 'SMP') === 'SD' ? '🎒 SD' : '🏆 SMP'} • GRUP ${t.group}
            </span>
          </div>

          <div class="school-card-body">
            <div class="school-avatar" style="background: ${t.badgeColor || '#10b981'};">
              ${t.logo ? `<img src="${t.logo}" class="team-logo-img" alt="${t.name}">` : t.shortName.substring(0, 3)}
            </div>

            <div class="school-card-name">${t.name}</div>
            <div class="school-card-city">📍 ${t.city || '-'}</div>

            <div class="official-info-box">
              <div class="official-row">
                <span>👔 Coach / Manager:</span>
                <strong title="${t.official.coach || t.official.manager}">${t.official.coach && t.official.manager && t.official.coach !== t.official.manager ? `${t.official.coach} / ${t.official.manager}` : (t.official.coach || t.official.manager || '-')}</strong>
              </div>
              <div class="official-row">
                <span>🎽 Jersey:</span>
                <strong style="font-size: 0.72rem;">${t.official.jerseyHome || '-'}</strong>
              </div>
            </div>

            <div class="school-card-footer" onclick="event.stopPropagation();">
              <span class="roster-count">👥 ${t.players.length} Pemain</span>
              <div style="display: flex; gap: 6px; align-items: center;">
                ${isPanitia ? `
                  <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); admin.openTeamEditorModal('${t.id}')" title="Edit Data Tim & Pemain" style="font-size: 0.72rem; padding: 3px 8px; border-color: var(--primary); color: var(--primary);">
                    ✏️ Edit
                  </button>
                ` : ''}
                <a href="${waLink}" target="_blank" class="btn-wa-direct" title="Hubungi Official via WA">
                  💬 WA Official
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 5. RENDER DISCIPLINARY TABLE (Crucial for Managers!)
  renderDiscipline() {
    const container = document.getElementById("disciplineTableBody");
    if (!container) return;

    const records = this.store.getDisciplinaryRecords(this.currentCategory);

    if (records.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: var(--primary);">
            ✅ Belum ada kartu kuning atau merah yang tercatat. Fair Play terjaga!
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = records.map((r, idx) => {
      const waMsg = encodeURIComponent(
        `⚠️ PEMBERITAHUAN DISIPLIN PANITIA:\nPemain an. ${r.playerName} (#${r.playerNo}) dari tim *${r.teamName}* telah menerima ${r.yellowCount} Kartu Kuning & ${r.redCount} Kartu Merah.\nStatus: *${r.status}*${r.actionNote ? ` (${r.actionNote})` : ''}.\nHarap official memperhatikan demi kelancaran pertandingan.`
      );
      const cleanPhone = r.managerPhone.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/62${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${waMsg}`;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <strong>${r.playerName}</strong> (#${r.playerNo})
            <div style="font-size: 0.7rem; color: var(--text-subtle);">
              <span class="discipline-mobile-team">${r.teamName} • </span>${r.pos}
            </div>
          </td>
          <td class="col-secondary">${r.teamName}</td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">
              <span class="card-icon-y"></span> ${r.yellowCount}
            </span>
            &nbsp;
            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">
              <span class="card-icon-r"></span> ${r.redCount}
            </span>
          </td>
          <td>
            <span class="${r.statusType === 'danger' || r.statusType === 'warning' ? 'suspension-badge' : 'safe-badge'}">
              ${r.status}
            </span>
            ${r.actionNote ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">${r.actionNote}</div>` : ''}
          </td>
          <td>
            <a href="${waUrl}" target="_blank" class="btn-wa-direct" style="font-size: 0.68rem; padding: 3px 6px;">
              📲 <span class="hide-on-mobile">Beritahu </span>WA
            </a>
          </td>
        </tr>
      `;
    }).join("");
  },

  // 6. RENDER TOP SCORER
  renderTopScorers() {
    const tableContainer = document.getElementById("topScorersTableBody");
    if (!tableContainer) return;

    const scorers = this.store.getTopScorersList(this.currentCategory);

    if (scorers.length === 0) {
      tableContainer.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">Belum ada data gol yang tercatat.</td></tr>`;
      return;
    }

    tableContainer.innerHTML = scorers.map((s, idx) => {
      // RANK 1: UKURAN BESAR (~7 BARIS TINGGI DENGAN FOTO WAJAH 180PX SANGAT JELAS)
      if (idx === 0) {
        return `
          <tr class="top-scorer-leader-row">
            <td style="text-align: center; vertical-align: middle;">
              <div class="leader-rank-badge">
                <span class="leader-crown-badge">👑</span>
                <span class="leader-rank-num">#1</span>
                <span class="leader-rank-title">TOP SKOR</span>
              </div>
            </td>
            <td style="text-align: left; vertical-align: middle;">
              <div class="leader-player-col">
                <div class="leader-avatar-frame">
                  <img src="${s.photo || 'assets/player_athar.jpg'}" alt="${s.playerName}" class="leader-avatar-img" onerror="this.onerror=null; this.src='assets/mvp_player.jpg'">
                  <span class="leader-jersey-pill" style="background: ${s.badgeColor};">
                    #${s.playerNo}
                  </span>
                </div>
                <div class="leader-name-info">
                  <div class="leader-golden-tag">👑 TOP SCORER SEMENTARA (GOLDEN BOOT)</div>
                  <div class="leader-name-text">${s.playerName}</div>
                  <div class="leader-sub-text">
                    <span class="leader-pos-badge">${s.pos}</span>
                    <span class="leader-team-inline" style="font-weight: 700; color: var(--text-main);">${s.teamName}</span>
                    <span class="player-rating-pill rating-superb" style="font-size: 0.72rem; padding: 2px 7px;">⭐ ${this.calculatePlayerRating(s)}</span>
                  </div>
                  <div class="leader-highlight-stat">
                    ⚡ Performa Tersubur • Peringkat 1 Turnamen ACC 2026
                  </div>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: left; vertical-align: middle;">
              <div class="leader-team-cell-wrap">
                <div class="leader-school-name">${s.teamName}</div>
                <div class="leader-school-sub">
                  <span>📍 Kontestan ACC 2026</span>
                  <span style="color: var(--primary); font-weight: 700;">Fase Penyisihan Grup</span>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: center; vertical-align: middle;">
              <span class="leader-pos-cell-badge">${s.pos}</span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <div class="leader-goals-wrap">
                <span class="leader-goals-big">${s.goals}</span>
                <span class="leader-goals-lbl">GOL</span>
              </div>
            </td>
          </tr>
        `;
      }

      // RANK 2, 3, & SETERUSNYA
      let rankBadgeHtml = `<span class="rank-badge rank-default">${idx + 1}</span>`;
      let avatarClass = "table-player-avatar";
      if (idx === 1) {
        rankBadgeHtml = `<span class="rank-badge rank-silver" title="Peringkat 2">🥈 2</span>`;
        avatarClass = "table-player-avatar silver-ring";
      } else if (idx === 2) {
        rankBadgeHtml = `<span class="rank-badge rank-bronze" title="Peringkat 3">🥉 3</span>`;
        avatarClass = "table-player-avatar bronze-ring";
      }

      const pRating = this.calculatePlayerRating(s);

      return `
        <tr>
          <td style="text-align: center;">
            ${rankBadgeHtml}
          </td>
          <td style="text-align: left;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${s.photo || 'assets/mvp_player.jpg'}" alt="${s.playerName}" class="${avatarClass}" onerror="this.onerror=null; this.src='assets/mvp_player.jpg'">
              <div>
                <strong style="color: var(--text-main); font-size: 0.9rem;">${s.playerName}</strong> <span style="color: var(--secondary); font-size: 0.75rem;">(#${s.playerNo})</span>
                <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                  <span class="top-scorer-mobile-team">${s.teamName} • </span>
                  <span>${s.pos}</span>
                  <span class="player-rating-pill ${pRating >= 9.0 ? 'rating-superb' : (pRating >= 8.0 ? 'rating-great' : 'rating-solid')}" style="font-size: 0.68rem; padding: 1px 5px;">
                    ⭐ ${pRating}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td class="col-secondary" style="text-align: left; color: var(--text-main); font-weight: 600;">${s.teamName}</td>
          <td class="col-secondary" style="text-align: center;"><span style="color: var(--secondary); font-size: 0.75rem; font-weight: 700;">${s.pos}</span></td>
          <td style="text-align: center; font-family: var(--font-display); font-weight: 800; font-size: 1.25rem; color: var(--primary);">
            ${s.goals}
          </td>
        </tr>
      `;
    }).join("");
  },

  // 7. RENDER JUKNIS (Buku Panduan)
  renderJuknis() {
    const container = document.getElementById("juknisContent");
    const contactEl = document.getElementById("juknisContact");
    if (!container) return;

    // Simple markdown-like to HTML converter
    const text = this.store.data.config.rulesText;
    const html = text
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/\n\n/g, '<br/>');

    container.innerHTML = html;
    if (contactEl) {
      contactEl.textContent = this.store.data.config.contactCommittee;
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  },

  // MODAL: Show Team Details & Full Roster
  openTeamModal(teamId) {
    const team = this.store.getTeam(teamId);
    if (!team) return;

    const isPanitia = admin.isAuthenticated === true;

    const modal = document.getElementById("teamModal");
    const title = document.getElementById("teamModalTitle");
    const body = document.getElementById("teamModalBody");

    title.innerHTML = `
      <span class="mini-badge" style="background: ${team.badgeColor};">${team.shortName.substring(0,2)}</span>
      <span>${team.name} (Grup ${team.group})</span>
    `;

    const waNumber = (team.official.phone || "").replace(/[^0-9]/g, "");
    const waLink = `https://wa.me/62${waNumber.startsWith('0') ? waNumber.slice(1) : waNumber}`;

    body.innerHTML = `
      ${isPanitia ? `
        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-primary btn-sm" onclick="app.closeAllModals(); admin.openTeamEditorModal('${team.id}')">
            ✏️ Edit Data Tim & Skuad Pemain
          </button>
        </div>
      ` : ''}
      <div class="team-modal-officials-box">
        <h4 class="team-modal-officials-title">Struktur Tim & Official Manajemen</h4>
        
        <!-- Combined COACH / MANAGER Card (Mobile Friendly & Ringkas) -->
        <div class="team-official-card unified-coach-manager">
          <img src="${team.official.coachPhoto || team.official.managerPhoto || 'assets/coach_bayu.jpg'}" alt="Foto Coach / Manager" class="team-official-avatar" onerror="this.onerror=null; this.src='assets/coach_bayu.jpg'">
          <div style="flex: 1; min-width: 0;">
            <span class="team-official-role">👔 COACH / MANAGER</span>
            <div class="team-official-name">
              ${team.official.coach && team.official.manager && team.official.coach !== team.official.manager ? `${team.official.coach} / ${team.official.manager}` : (team.official.coach || team.official.manager || 'Official Tim')}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              Pelatih: <strong>${team.official.coach || '-'}</strong> • Manajer: <strong>${team.official.manager || '-'}</strong>
            </div>
          </div>
        </div>

        <div class="team-meta-info-grid">
          <div><span class="team-meta-lbl">Medis:</span><strong class="team-meta-val">${team.official.medic}</strong></div>
          <div><span class="team-meta-lbl">No. WhatsApp:</span><a href="${waLink}" target="_blank" style="color: #25d366; text-decoration: none; font-weight:700;">💬 ${team.official.phone}</a></div>
          <div><span class="team-meta-lbl">Jersey Utama:</span><span class="team-meta-val">${team.official.jerseyHome}</span></div>
          <div><span class="team-meta-lbl">Jersey Cadangan:</span><span class="team-meta-val">${team.official.jerseyAway}</span></div>
        </div>
      </div>

      <div>
        <div class="team-roster-header-row">
          <span>Daftar Pemain Resmi (Roster)</span>
          <span style="color: var(--secondary); font-size: 0.78rem;">${team.players.length} Pemain</span>
        </div>

        <div class="table-responsive">
          <table class="standings-table roster-table">
            <thead>
              <tr>
                <th style="width: 32px; text-align: center;">No</th>
                <th style="width: 38px; text-align: center;">Foto</th>
                <th style="text-align: left;">Nama Pemain</th>
                <th style="text-align: center;">Pos</th>
                <th style="text-align: center;">⭐ Rating</th>
                <th style="text-align: center;">Gol</th>
                <th style="text-align: center;">Kartu</th>
              </tr>
            </thead>
            <tbody>
              ${team.players.map(p => {
                const rating = this.calculatePlayerRating(p);
                return `
                <tr>
                  <td style="text-align: center;"><strong style="color: var(--secondary);">#${p.no}</strong></td>
                  <td style="text-align: center;">
                    <img src="${p.photo || 'assets/mvp_player.jpg'}" alt="${p.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-color); display: block; margin: 0 auto;" onerror="this.onerror=null; this.src='assets/mvp_player.jpg'">
                  </td>
                  <td style="text-align: left; font-weight: 600; color: var(--text-main); font-size: 0.88rem;">${p.name}</td>
                  <td style="text-align: center;"><span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${p.pos}</span></td>
                  <td style="text-align: center;">
                    <span class="player-rating-pill ${rating >= 9.0 ? 'rating-superb' : (rating >= 8.0 ? 'rating-great' : 'rating-solid')}">
                      ⭐ ${rating}
                    </span>
                  </td>
                  <td style="font-weight: 700; color: var(--primary); text-align: center;">${p.goals}</td>
                  <td style="text-align: center;">
                    ${p.yc > 0 ? `<span class="card-icon-y" title="${p.yc} Kartu Kuning"></span> ${p.yc}` : ''}
                    ${p.rc > 0 ? `<span class="card-icon-r" title="${p.rc} Kartu Merah"></span> ${p.rc}` : ''}
                    ${p.yc === 0 && p.rc === 0 ? '<span style="color:var(--text-subtle);">-</span>' : ''}
                  </td>
                </tr>
              `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    modal.classList.add("active");
  },

  // MODAL: Match Details (Split Under Respective Teams)
  showMatchDetail(matchId) {
    const match = this.store.data.matches.find(m => m.id === matchId);
    if (!match) return;

    const home = this.store.getTeam(match.homeId) || { name: match.homePlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b" };
    const away = this.store.getTeam(match.awayId) || { name: match.awayPlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b" };

    const modal = document.getElementById("matchDetailModal");
    const title = document.getElementById("matchDetailTitle");
    const body = document.getElementById("matchDetailBody");

    const catBadge = (match.category || "SMP") === "SD" ? "🎒 Kategori SD (U-12)" : "🏆 Kategori SMP (U-15)";
    title.innerHTML = `Detail Laga: ${match.id} • ${catBadge} (${match.stage === 'group' ? 'Grup ' + match.group : match.roundName})`;

    const hScore = match.status === 'finished' ? match.homeScore : (match.status === 'live' ? match.homeScoreLive : '-');
    const aScore = match.status === 'finished' ? match.awayScore : (match.status === 'live' ? match.awayScoreLive : '-');

    const cleanMin = (m) => {
      if (!m) return "";
      const d = m.toString().replace(/[^0-9]/g, "");
      return d ? `${d}'` : m.toString().replace(/["']/g, "") + "'";
    };

    const homeScorers = (match.scorers || []).filter(s => s.team === match.homeId);
    const awayScorers = (match.scorers || []).filter(s => s.team === match.awayId);
    const homeCards = (match.cards || []).filter(c => c.team === match.homeId);
    const awayCards = (match.cards || []).filter(c => c.team === match.awayId);

    body.innerHTML = `
      <div class="match-detail-scoreboard">
        <div class="match-detail-meta">
          <span class="match-category-tag ${match.category === 'SD' ? 'cat-sd' : 'cat-smp'}">${match.category === 'SD' ? 'SD / U-12' : 'SMP / U-15'}</span>
          📍 ${match.pitch} • 📅 ${match.date} (${match.time})
        </div>

        <div class="match-detail-teams-row" style="align-items: flex-start;">
          <!-- TIM HOME & GOL DI BAWAHNYA -->
          <div class="match-detail-team-col" style="text-align: left;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="team-badge-circle" style="background: linear-gradient(135deg, ${home.badgeColor || '#10b981'}, #0f172a); width: 38px; height: 38px; font-size: 0.85rem; flex-shrink: 0;">
                ${home.logo ? `<img src="${home.logo}" class="team-logo-img" alt="${home.name}">` : home.shortName.substring(0, 3)}
              </div>
              <div class="match-detail-team-name">${home.name}</div>
            </div>

            <!-- GOL TIM HOME DI BAWAH NAMA TIM HOME -->
            <div class="team-events-box home" style="margin-top: 10px; padding: 6px 8px; background: rgba(0,0,0,0.03); border-radius: 6px;">
              <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 3px;">⚽ GOL & KARTU:</div>
              ${homeScorers.map(s => `
                <div class="event-item-badge scorer">
                  <span>⚽</span>
                  <span><strong>${s.player}</strong> (${cleanMin(s.minute)})</span>
                </div>
              `).join("")}
              ${homeCards.map(c => `
                <div class="event-item-badge">
                  <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                  <span>${c.player} (${cleanMin(c.minute)})</span>
                </div>
              `).join("")}
              ${homeScorers.length === 0 && homeCards.length === 0 ? `<span style="font-size: 0.72rem; color: var(--text-subtle);">- Tidak ada gol/kartu -</span>` : ''}
            </div>
          </div>

          <!-- SKOR TENGAH -->
          <div class="score-col-centered" style="padding: 0 10px;">
            <div class="score-box-prominent ${match.status === 'live' ? 'live' : ''}" style="font-size: 2.6rem;">
              <span>${hScore}</span>
              <span class="score-divider">:</span>
              <span>${aScore}</span>
            </div>
            <div class="match-detail-status ${match.status}" style="margin-top: 6px;">
              ${match.status === 'live' ? '🔴 Sedang Berlangsung' : (match.status === 'finished' ? 'Selesai' : 'Belum Mulai')}
            </div>
          </div>

          <!-- TIM AWAY & GOL DI BAWAHNYA -->
          <div class="match-detail-team-col" style="text-align: right;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
              <div class="match-detail-team-name">${away.name}</div>
              <div class="team-badge-circle" style="background: linear-gradient(135deg, ${away.badgeColor || '#3b82f6'}, #0f172a); width: 38px; height: 38px; font-size: 0.85rem; flex-shrink: 0;">
                ${away.logo ? `<img src="${away.logo}" class="team-logo-img" alt="${away.name}">` : away.shortName.substring(0, 3)}
              </div>
            </div>

            <!-- GOL TIM AWAY DI BAWAH NAMA TIM AWAY -->
            <div class="team-events-box away" style="margin-top: 10px; padding: 6px 8px; background: rgba(0,0,0,0.03); border-radius: 6px;">
              <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 3px;">⚽ GOL & KARTU:</div>
              ${awayScorers.map(s => `
                <div class="event-item-badge away scorer">
                  <span>(<strong>${cleanMin(s.minute)}</strong>) ${s.player}</span>
                  <span>⚽</span>
                </div>
              `).join("")}
              ${awayCards.map(c => `
                <div class="event-item-badge away">
                  <span>(${cleanMin(c.minute)}) ${c.player}</span>
                  <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                </div>
              `).join("")}
              ${awayScorers.length === 0 && awayCards.length === 0 ? `<span style="font-size: 0.72rem; color: var(--text-subtle);">- Tidak ada gol/kartu -</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");
  },

  // Toast Notification
  showToast(message) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  },

  // PWA Support
  initPwa() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      const btnInstall = document.getElementById("btnInstallPwa");
      if (btnInstall) {
        btnInstall.style.display = "inline-flex";
        btnInstall.addEventListener("click", () => {
          if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then(() => {
              window.deferredPrompt = null;
              btnInstall.style.display = "none";
            });
          }
        });
      }
    });
  }
};

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});

window.app = app;
