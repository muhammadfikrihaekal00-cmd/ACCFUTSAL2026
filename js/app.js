// app.js - Main Tournament Logic & UI Rendering
class TournamentStore {
  constructor() {
    this.STORAGE_KEY = "acc_futsal_tournament_2026";
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
    if (!data) {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
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
    // Pastikan foto pemain dan pelatih terhubung jika belum ada
    if (data.teams && Array.isArray(data.teams)) {
      data.teams.forEach(t => {
        const defTeam = DEFAULT_DATA.teams.find(dt => dt.id === t.id);
        if (defTeam) {
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

  // Calculate Standings for a specific group
  calculateGroupStandings(groupLetter) {
    const groupTeams = this.data.teams.filter(t => t.group === groupLetter);
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
      m => m.stage === "group" && m.group === groupLetter && (m.status === "finished" || m.status === "live")
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

  // Automatically sync Group Winners & Runners-Up to Knockout Quarterfinals
  syncKnockoutFromStandings() {
    const standingsA = this.calculateGroupStandings("A");
    const standingsB = this.calculateGroupStandings("B");
    const standingsC = this.calculateGroupStandings("C");
    const standingsD = this.calculateGroupStandings("D");

    const qf1 = this.data.matches.find(m => m.id === "QF1");
    if (qf1 && standingsA[0] && standingsB[1]) {
      qf1.homeId = standingsA[0].team.id;
      qf1.awayId = standingsB[1].team.id;
    }

    const qf2 = this.data.matches.find(m => m.id === "QF2");
    if (qf2 && standingsC[0] && standingsD[1]) {
      qf2.homeId = standingsC[0].team.id;
      qf2.awayId = standingsD[1].team.id;
    }

    const qf3 = this.data.matches.find(m => m.id === "QF3");
    if (qf3 && standingsB[0] && standingsA[1]) {
      qf3.homeId = standingsB[0].team.id;
      qf3.awayId = standingsA[1].team.id;
    }

    const qf4 = this.data.matches.find(m => m.id === "QF4");
    if (qf4 && standingsD[0] && standingsC[1]) {
      qf4.homeId = standingsD[0].team.id;
      qf4.awayId = standingsC[1].team.id;
    }
  }

  // Calculate Disciplinary status (Yellow/Red Cards across all matches)
  getDisciplinaryRecords() {
    const playerStats = {};

    this.data.teams.forEach(t => {
      t.players.forEach(p => {
        const key = `${t.id}-${p.name}`;
        playerStats[key] = {
          teamId: t.id,
          teamName: t.name,
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
  getTopScorersList() {
    const scorers = {};

    this.data.teams.forEach(t => {
      t.players.forEach(p => {
        const key = `${t.id}-${p.name}`;
        scorers[key] = {
          teamId: t.id,
          teamName: t.name,
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
  filterDay: "all",
  filterPitch: "all",
  filterGroup: "all",
  currentTheme: "light", // Default ramah dengan white space luas
  currentViewMode: "participant", // "participant" atau "operator"

  init() {
    this.initThemeAndViewMode();
    this.renderHeader();
    this.bindEvents();
    this.renderCurrentView();
    this.initPwa();
    this.initSupabaseSync();
  },

  initSupabaseSync() {
    if (!window.SupabaseService) return;

    // Listen for realtime live score & match changes
    window.SupabaseService.onRemoteUpdate((table, payload) => {
      this.handleRemoteSync(table, payload);
    });

    // Initial silent load from Supabase if configured
    window.SupabaseService.fetchAllData().then(data => {
      if (data && (data.matches || data.teams)) {
        if (data.config) Object.assign(this.store.data.config, data.config);
        if (data.matches && data.matches.length > 0) this.store.data.matches = data.matches;
        if (data.teams && data.teams.length > 0) this.store.data.teams = data.teams;
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
        Object.assign(this.store.data.matches[idx], payload);
        this.store.saveData();
        this.store.syncKnockoutFromStandings();
        this.renderMatches();
        this.renderStandings();
        this.renderBracket();
      }
    } else if (table === 'teams') {
      const idx = this.store.data.teams.findIndex(t => t.id === payload.id);
      if (idx !== -1) {
        Object.assign(this.store.data.teams[idx], payload);
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
    document.getElementById("heroSub").textContent = config.subTitle;
    document.getElementById("heroVenue").textContent = config.venue;
    document.getElementById("heroDates").textContent = config.dates;
    document.getElementById("tickerText").textContent = config.runningAnnouncement;
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
  },

  switchTab(tabId) {
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

  // 1. RENDER MATCHES
  renderMatches() {
    const container = document.getElementById("matchesList");
    if (!container) return;

    let matches = this.store.data.matches;

    // Filter
    if (this.filterDay !== "all") {
      matches = matches.filter(m => String(m.matchday) === this.filterDay);
    }
    if (this.filterPitch !== "all") {
      matches = matches.filter(m => m.pitch.includes(this.filterPitch));
    }
    if (this.filterGroup !== "all") {
      matches = matches.filter(m => m.group === this.filterGroup);
    }

    if (matches.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg);">
          <p>Tidak ada jadwal pertandingan pada filter yang dipilih.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(m => {
      const home = this.store.getTeam(m.homeId) || { name: m.homePlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b", city: "-" };
      const away = this.store.getTeam(m.awayId) || { name: m.awayPlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b", city: "-" };

      const isLive = m.status === "live";
      const isFinished = m.status === "finished";

      const homeScore = isLive ? (m.homeScoreLive ?? 0) : (isFinished ? m.homeScore : "-");
      const awayScore = isLive ? (m.awayScoreLive ?? 0) : (isFinished ? m.awayScore : "-");

      // Scorers detail
      const hasEvents = (m.scorers && m.scorers.length > 0) || (m.cards && m.cards.length > 0);
      let eventsHtml = "";
      if (hasEvents) {
        eventsHtml = `
          <div class="match-details-drawer">
            ${(m.scorers || []).map(s => `
              <div class="event-row scorer">
                <span>⚽</span>
                <strong>${s.player}</strong> (${s.minute}) - <small style="color:var(--text-subtle)">${this.store.getTeam(s.team)?.shortName || ""}</small>
              </div>
            `).join("")}
            ${(m.cards || []).map(c => `
              <div class="event-row">
                <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                <span>${c.player} (${c.minute})</span>
              </div>
            `).join("")}
          </div>
        `;
      }

      return `
        <div class="match-card ${isLive ? 'is-live' : ''}">
          <div class="match-header-meta">
            <span class="match-pitch-badge">🏟️ ${m.pitch}</span>
            <span class="match-status-tag ${m.status}">
              ${isLive ? `<span class="pulse-dot"></span> LIVE ${m.liveMinute || ''}` : (isFinished ? 'Selesai' : m.time)}
            </span>
          </div>

          <div class="match-body">
            <div class="team-col">
              <div class="team-badge-circle" style="background: linear-gradient(135deg, ${home.badgeColor}, #0f172a);">
                ${home.shortName.substring(0, 3)}
              </div>
              <div class="team-name-label" title="${home.name}">${home.name}</div>
              <div class="team-city-label">${home.city || ''}</div>
            </div>

            <div class="score-col">
              <div class="score-box ${isLive ? 'live' : ''}">
                <span>${homeScore}</span>
                <span class="score-divider">:</span>
                <span>${awayScore}</span>
              </div>
              <div class="match-time-sub">${m.date}</div>
            </div>

            <div class="team-col">
              <div class="team-badge-circle" style="background: linear-gradient(135deg, ${away.badgeColor}, #0f172a);">
                ${away.shortName.substring(0, 3)}
              </div>
              <div class="team-name-label" title="${away.name}">${away.name}</div>
              <div class="team-city-label">${away.city || ''}</div>
            </div>
          </div>

          ${eventsHtml}

          <div class="match-footer-actions">
            <button class="btn btn-outline btn-sm" onclick="app.showMatchDetail('${m.id}')">
              ℹ️ Detail Laga
            </button>
            ${admin.isAuthenticated === true ? `
              <button class="btn btn-admin btn-sm" onclick="admin.openQuickScore('${m.id}')">
                ✏️ Input Skor
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  // 2. RENDER STANDINGS (4 Groups)
  renderStandings() {
    const container = document.getElementById("groupsStandingsContainer");
    if (!container) return;

    const groups = ["A", "B", "C", "D"];

    container.innerHTML = groups.map(g => {
      const standings = this.store.calculateGroupStandings(g);

      return `
        <div class="group-card">
          <div class="group-card-header">
            <div class="group-title">
              <span class="group-badge">GRUP ${g}</span>
              <span>Klasemen Sementara</span>
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
                          ${row.team.shortName.substring(0, 2)}
                        </span>
                        <span>${row.team.shortName}</span>
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
            <span>Peringkat 1 & 2 melaju ke Babak Perempat Final</span>
          </div>
        </div>
      `;
    }).join("");
  },

  // 3. RENDER BRACKET (Knockout Stage)
  renderBracket() {
    const container = document.getElementById("bracketTree");
    if (!container) return;

    this.store.syncKnockoutFromStandings();

    const qfMatches = this.store.data.matches.filter(m => m.id.startsWith("QF"));
    const sfMatches = this.store.data.matches.filter(m => m.id.startsWith("SF"));
    const thirdMatch = this.store.data.matches.find(m => m.id === "3RD");
    const finalMatch = this.store.data.matches.find(m => m.id === "FINAL");

    const renderBracketCard = (m, isFinal = false) => {
      const home = this.store.getTeam(m.homeId);
      const away = this.store.getTeam(m.awayId);

      const homeName = home ? home.shortName : (m.homePlaceholder || "TBD");
      const awayName = away ? away.shortName : (m.awayPlaceholder || "TBD");

      const homeScore = m.status === "finished" ? m.homeScore : "-";
      const awayScore = m.status === "finished" ? m.awayScore : "-";

      const isHomeWinner = m.status === "finished" && m.homeScore > m.awayScore;
      const isAwayWinner = m.status === "finished" && m.awayScore > m.homeScore;

      return `
        <div class="bracket-match ${isFinal ? 'final-card' : ''}">
          <div style="font-size: 0.68rem; color: ${isFinal ? 'var(--accent-gold)' : 'var(--text-subtle)'}; font-weight: 800; text-align: center;">
            ${m.roundName}
          </div>
          <div class="bracket-team-row ${isHomeWinner ? 'winner' : ''}">
            <div class="bracket-team-info">
              <span class="mini-badge" style="background: ${home ? home.badgeColor : '#475569'};">${homeName.substring(0,2)}</span>
              <span>${homeName}</span>
            </div>
            <div class="bracket-score">${homeScore}</div>
          </div>
          <div class="bracket-team-row ${isAwayWinner ? 'winner' : ''}">
            <div class="bracket-team-info">
              <span class="mini-badge" style="background: ${away ? away.badgeColor : '#475569'};">${awayName.substring(0,2)}</span>
              <span>${awayName}</span>
            </div>
            <div class="bracket-score">${awayScore}</div>
          </div>
          <div class="bracket-meta-time">
            📅 ${m.date} • ${m.time}
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      <div class="bracket-round">
        <div class="round-title">Perempat Final (8 Besar)</div>
        ${qfMatches.map(m => renderBracketCard(m)).join("")}
      </div>

      <div class="bracket-round">
        <div class="round-title">Semifinal</div>
        ${sfMatches.map(m => renderBracketCard(m)).join("")}
        <div style="margin-top: 20px;">
          <div class="round-title" style="color: #94a3b8;">Perebutan Juara 3</div>
          ${thirdMatch ? renderBracketCard(thirdMatch) : ''}
        </div>
      </div>

      <div class="bracket-round">
        <div class="round-title" style="color: var(--accent-gold); border-color: var(--accent-gold);">🏆 GRAND FINAL 🏆</div>
        ${finalMatch ? renderBracketCard(finalMatch, true) : ''}
        <div style="text-align: center; margin-top: 20px; padding: 14px; background: rgba(251, 191, 36, 0.1); border: 1px dashed var(--accent-gold); border-radius: var(--radius-md);">
          <div style="font-size: 1.6rem;">🥇</div>
          <strong style="color: var(--accent-gold); font-size: 0.85rem;">TROFI BERGILIR & UANG PEMBINAAN</strong>
          <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Piala Juara 1, 2, 3 + Best Player & Top Scorer</p>
        </div>
      </div>
    `;
  },

  // 4. RENDER TEAM & OFFICIAL PORTAL
  renderTeams() {
    const container = document.getElementById("teamGridContainer");
    if (!container) return;

    const teams = this.store.data.teams;
    const countEl = document.getElementById("teamsTotalCount");
    if (countEl) countEl.textContent = teams.length;

    const isPanitia = admin.isAuthenticated === true;

    container.innerHTML = teams.map(t => {
      const waNumber = t.official.phone.replace(/[^0-9]/g, "");
      const waLink = `https://wa.me/62${waNumber.startsWith('0') ? waNumber.slice(1) : waNumber}?text=Halo%20Official%20${encodeURIComponent(t.name)}%2C%20informasi%20Pondok%20Futsal%20Cup%202026`;

      return `
        <div class="school-card" onclick="app.openTeamModal('${t.id}')">
          <div class="school-card-banner" style="background: linear-gradient(135deg, ${t.badgeColor}, #0f172a);">
            <span class="group-tag-corner">GRUP ${t.group}</span>
          </div>

          <div class="school-card-body">
            <div class="school-avatar" style="background: ${t.badgeColor};">
              ${t.shortName.substring(0, 3)}
            </div>

            <div class="school-card-name">${t.name}</div>
            <div class="school-card-city">📍 ${t.city}</div>

            <div class="official-info-box">
              <div class="official-row">
                <span>👔 Coach / Manager:</span>
                <strong title="${t.official.coach || t.official.manager}">${t.official.coach && t.official.manager && t.official.coach !== t.official.manager ? `${t.official.coach} / ${t.official.manager}` : (t.official.coach || t.official.manager || '-')}</strong>
              </div>
              <div class="official-row">
                <span>🎽 Jersey:</span>
                <strong style="font-size: 0.72rem;">${t.official.jerseyHome}</strong>
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

    const records = this.store.getDisciplinaryRecords();

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

    const scorers = this.store.getTopScorersList();

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

  // MODAL: Match Details
  showMatchDetail(matchId) {
    const match = this.store.data.matches.find(m => m.id === matchId);
    if (!match) return;

    const home = this.store.getTeam(match.homeId) || { name: match.homePlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b" };
    const away = this.store.getTeam(match.awayId) || { name: match.awayPlaceholder || "TBD", shortName: "TBD", badgeColor: "#64748b" };

    const modal = document.getElementById("matchDetailModal");
    const title = document.getElementById("matchDetailTitle");
    const body = document.getElementById("matchDetailBody");

    title.innerHTML = `Detail Laga: ${match.id} (${match.stage === 'group' ? 'Grup ' + match.group : match.roundName})`;

    const hScore = match.status === 'finished' ? match.homeScore : (match.status === 'live' ? match.homeScoreLive : '-');
    const aScore = match.status === 'finished' ? match.awayScore : (match.status === 'live' ? match.awayScoreLive : '-');

    body.innerHTML = `
      <div class="match-detail-scoreboard">
        <div class="match-detail-meta">
          📍 ${match.pitch} • 📅 ${match.date} (${match.time})
        </div>
        <div class="match-detail-teams-row">
          <div class="match-detail-team-col">
            <div class="match-detail-team-name">${home.name}</div>
          </div>
          <div class="match-detail-score">
            ${hScore} : ${aScore}
          </div>
          <div class="match-detail-team-col">
            <div class="match-detail-team-name">${away.name}</div>
          </div>
        </div>
        <div class="match-detail-status ${match.status}">
          Status: ${match.status === 'live' ? '🔴 Sedang Berlangsung' : (match.status === 'finished' ? 'Selesai' : 'Belum Mulai')}
        </div>
      </div>

      <div class="match-detail-section">
        <h4 class="match-detail-section-title">⚽ Kejadian Gol</h4>
        ${match.scorers && match.scorers.length > 0 ? `
          <ul class="match-detail-list">
            ${match.scorers.map(s => `<li><strong>${s.minute}</strong> - ${s.player} (${this.store.getTeam(s.team)?.shortName})</li>`).join("")}
          </ul>
        ` : `<p class="match-detail-empty-note">Belum ada gol tercatat.</p>`}
      </div>

      <div class="match-detail-section">
        <h4 class="match-detail-section-title yellow">🟨 Kartu & Disiplin</h4>
        ${match.cards && match.cards.length > 0 ? `
          <ul class="match-detail-list">
            ${match.cards.map(c => `<li><span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span> <strong>${c.minute}</strong> - ${c.player} (${this.store.getTeam(c.team)?.shortName})</li>`).join("")}
          </ul>
        ` : `<p class="match-detail-empty-note">Pertandingan bersih tanpa kartu.</p>`}
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
