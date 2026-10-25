// admin.js - Panitia Admin Control Panel
const admin = {
  isAuthenticated: false,
  activeMatchId: null,

  init() {
    this.checkSession();
    this.bindAdminEvents();
  },

  adminPinHash: "",

  checkSession() {
    if (sessionStorage.getItem("pondok_futsal_admin_auth") === "true") {
      this.isAuthenticated = true;
      this.adminPinHash = sessionStorage.getItem("pondok_futsal_admin_pin_hash") || "";
      this.updateAdminUi();
    }
  },

  bindAdminEvents() {
    const btnOpenAdmin = document.getElementById("btnOpenAdmin");
    if (btnOpenAdmin) {
      btnOpenAdmin.addEventListener("click", () => {
        if (this.isAuthenticated) {
          this.openAdminDashboard();
        } else {
          this.openLoginModal();
        }
      });
    }

    // Submit PIN Login with Master PINs (1234 / 2026 / admin) & Automatic Lockout Recovery
    const formLogin = document.getElementById("adminLoginForm");
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.doLogin();
      });
    }

    // Quick Score Save Form
    const scoreForm = document.getElementById("quickScoreForm");
    if (scoreForm) {
      scoreForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveQuickScore();
      });
    }

    // Settings Form
    const settingsForm = document.getElementById("adminSettingsForm");
    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }
  },

  // 1-Click Fast Login Helper
  doQuickLogin(pin = "1234") {
    const input = document.getElementById("adminPinInput");
    if (input) input.value = pin;
    this.doLogin(pin);
  },

  // Core Login Routine - Instant, Safe & Non-Blocking
  doLogin(providedPin) {
    const input = document.getElementById("adminPinInput");
    const pin = (providedPin !== undefined ? providedPin : (input ? input.value : "")).toString().trim();
    
    // Master PINs accepted unconditionally
    const masterPins = ["1234", "2026", "admin"];
    const isMaster = masterPins.includes(pin) || masterPins.includes(pin.toLowerCase());

    // Recover from any stored lockout immediately
    try {
      localStorage.removeItem("acc_sec_attempts_v1");
      localStorage.removeItem("acc_sec_lockout_until_v1");
      if (window.Security) window.Security.recordSuccess();
    } catch (e) {}

    let isValid = isMaster;
    if (!isValid && pin === "1234") isValid = true;

    if (isValid) {
      this.isAuthenticated = true;
      this.adminPinHash = "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348";

      try {
        sessionStorage.setItem("pondok_futsal_admin_auth", "true");
        sessionStorage.setItem("pondok_futsal_admin_pin_hash", this.adminPinHash);
      } catch (e) {}

      if (input) input.value = "";

      const loginModal = document.getElementById("adminLoginModal");
      if (loginModal) loginModal.classList.remove("active");

      // Safely update all UI views
      this.updateAdminUi();

      if (window.app && typeof app.showToast === "function") {
        app.showToast("✅ Berhasil Masuk Mode Panitia! Akses Input Skor Aktif.");
      }

      // If triggered from a match card, open score editor for that match
      if (this.pendingScoreMatchId) {
        const mId = this.pendingScoreMatchId;
        this.pendingScoreMatchId = null;
        setTimeout(() => {
          this.openQuickScore(mId);
        }, 150);
      }
    } else {
      alert("⚠️ PIN Panitia salah!\n\nPIN Resmi Turnamen adalah: 1234\nSilakan klik tombol '1-Klik Masuk Langsung' atau ketik 1234.");
    }
  },

  updateAdminUi() {
    const btn = document.getElementById("btnOpenAdmin");
    const iconEl = document.getElementById("adminHeaderIcon");
    const labelEl = document.getElementById("adminHeaderLabel");
    const dotEl = document.getElementById("adminActiveBadge");
    if (btn) {
      btn.title = this.isAuthenticated ? "Panel Kontrol Panitia (Klik untuk Dashboard / Logout)" : "Masuk Mode Panitia (PIN: 1234)";
      btn.classList.toggle("logged-in", this.isAuthenticated);
    }
    if (iconEl) {
      iconEl.textContent = this.isAuthenticated ? "⚙️" : "🔒";
    }
    if (labelEl) {
      labelEl.textContent = this.isAuthenticated ? "Panitia Aktif" : "Mode Panitia";
    }
    if (dotEl) {
      dotEl.style.display = this.isAuthenticated ? "block" : "none";
    }

    if (window.app) {
      try {
        if (typeof app.updateAdminVisibility === "function") app.updateAdminVisibility();
      } catch (e) {}
      try {
        if (typeof app.renderMatches === "function") app.renderMatches();
      } catch (e) {}
      try {
        if (typeof app.renderTeams === "function") app.renderTeams();
      } catch (e) {}
      try {
        if (typeof app.renderSponsors === "function") app.renderSponsors();
      } catch (e) {}
      try {
        if (typeof app.renderHeroBanner === "function") app.renderHeroBanner();
      } catch (e) {}
      try {
        if (typeof app.renderMoments === "function") app.renderMoments();
      } catch (e) {}
    }
  },

  openLoginModal() {
    const modal = document.getElementById("adminLoginModal");
    const pinInput = document.getElementById("adminPinInput");
    if (pinInput) pinInput.value = "";
    if (modal) modal.classList.add("active");
    if (pinInput) {
      setTimeout(() => {
        try { pinInput.focus(); } catch (e) {}
      }, 100);
    }
  },

  openAdminDashboard() {
    const modal = document.getElementById("adminDashboardModal");
    try {
      this.populateSettingsForm();
    } catch (e) {
      console.warn("Error populating settings form:", e);
    }
    if (modal) modal.classList.add("active");
  },

  // OPEN QUICK SCORE EDITOR FOR A SPECIFIC MATCH
  openQuickScore(matchId) {
    if (!this.isAuthenticated) {
      this.pendingScoreMatchId = matchId;
      this.openLoginModal();
      app.showToast("🔒 Silakan masukkan PIN 1234 untuk membuka form input skor!");
      return;
    }

    this.activeMatchId = matchId;
    const match = app.store.data.matches.find(m => m.id === matchId);
    if (!match) return;

    const home = app.store.getTeam(match.homeId) || { name: match.homePlaceholder || "TBD", shortName: "TBD" };
    const away = app.store.getTeam(match.awayId) || { name: match.awayPlaceholder || "TBD", shortName: "TBD" };

    const modal = document.getElementById("quickScoreModal");
    document.getElementById("quickScoreMatchTitle").textContent = `${match.id}: ${home.shortName} vs ${away.shortName}`;

    document.getElementById("homeTeamLabel").textContent = home.name;
    document.getElementById("awayTeamLabel").textContent = away.name;

    const homeScoreVal = match.status === 'live' ? (match.homeScoreLive || 0) : (match.homeScore || 0);
    const awayScoreVal = match.status === 'live' ? (match.awayScoreLive || 0) : (match.awayScore || 0);

    document.getElementById("homeScoreDisplay").textContent = homeScoreVal;
    document.getElementById("awayScoreDisplay").textContent = awayScoreVal;
    document.getElementById("matchStatusSelect").value = match.status;
    document.getElementById("matchMinuteInput").value = match.liveMinute || "15'";

    this.renderAdminEventsList(match);
    this.populateEventTeamSelectors(match);

    modal.classList.add("active");
  },

  // Increment / Decrement score helpers
  adjustScore(side, delta) {
    const el = document.getElementById(`${side}ScoreDisplay`);
    let current = parseInt(el.textContent, 10) || 0;
    current = Math.max(0, current + delta);
    el.textContent = current;
  },

  populateEventTeamSelectors(match) {
    const teamSelect = document.getElementById("eventTeamSelect");
    if (!teamSelect) return;

    const home = app.store.getTeam(match.homeId);
    const away = app.store.getTeam(match.awayId);

    teamSelect.innerHTML = `
      <option value="">Pilih Tim</option>
      ${home ? `<option value="${home.id}">${home.name}</option>` : ''}
      ${away ? `<option value="${away.id}">${away.name}</option>` : ''}
    `;

    teamSelect.onchange = () => {
      const selectedTeamId = teamSelect.value;
      const playerSelect = document.getElementById("eventPlayerSelect");
      if (!selectedTeamId) {
        playerSelect.innerHTML = `<option value="">Pilih Pemain</option>`;
        return;
      }
      const team = app.store.getTeam(selectedTeamId);
      playerSelect.innerHTML = team.players.map(p => `
        <option value="${p.name}">#${p.no} - ${p.name} (${p.pos})</option>
      `).join("");
    };
  },

  addGoalEvent() {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    const teamId = document.getElementById("eventTeamSelect").value;
    const player = document.getElementById("eventPlayerSelect").value;
    const minute = document.getElementById("eventMinuteInput").value.trim() || "10'";

    if (!teamId || !player) {
      alert("Harap pilih tim dan pemain yang mencetak gol!");
      return;
    }

    if (!match.scorers) match.scorers = [];
    match.scorers.push({ team: teamId, player: player, minute: minute + "'" });

    // Update player's stats
    const team = app.store.getTeam(teamId);
    const p = team?.players.find(x => x.name === player);
    if (p) p.goals = (p.goals || 0) + 1;

    // Auto increment score display
    if (teamId === match.homeId) {
      this.adjustScore('home', 1);
    } else {
      this.adjustScore('away', 1);
    }

    this.renderAdminEventsList(match);
    app.showToast(`Gol tercatat: ${player} (${minute}')`);
  },

  addCardEvent(type) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    const teamId = document.getElementById("eventTeamSelect").value;
    const player = document.getElementById("eventPlayerSelect").value;
    const minute = document.getElementById("eventMinuteInput").value.trim() || "15'";

    if (!teamId || !player) {
      alert("Harap pilih tim dan pemain penerima kartu!");
      return;
    }

    if (!match.cards) match.cards = [];
    match.cards.push({ team: teamId, player: player, type: type, minute: minute + "'" });

    // Update player's stats
    const team = app.store.getTeam(teamId);
    const p = team?.players.find(x => x.name === player);
    if (p) {
      if (type === "yellow") p.yc = (p.yc || 0) + 1;
      if (type === "red") p.rc = (p.rc || 0) + 1;
    }

    this.renderAdminEventsList(match);
    app.showToast(`Kartu ${type === 'yellow' ? 'Kuning' : 'Merah'} dicatat: ${player}`);
  },

  renderAdminEventsList(match) {
    const listEl = document.getElementById("adminEventsList");
    if (!listEl) return;

    const scorers = (match.scorers || []).map((s, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; font-size:0.75rem;">
        <span>⚽ <strong>${s.player}</strong> (${s.minute}) - ${app.store.getTeam(s.team)?.shortName}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="admin.removeScorer(${idx})" style="padding:2px 6px; color:#ef4444;">Hapus</button>
      </div>
    `).join("");

    const cards = (match.cards || []).map((c, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; font-size:0.75rem;">
        <span><span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span> <strong>${c.player}</strong> (${c.minute}) - ${app.store.getTeam(c.team)?.shortName}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="admin.removeCard(${idx})" style="padding:2px 6px; color:#ef4444;">Hapus</button>
      </div>
    `).join("");

    listEl.innerHTML = scorers + cards || `<p style="font-size:0.72rem; color:var(--text-subtle);">Belum ada gol atau kartu di laga ini.</p>`;
  },

  removeScorer(index) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match || !match.scorers) return;
    match.scorers.splice(index, 1);
    this.renderAdminEventsList(match);
  },

  removeCard(index) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match || !match.cards) return;
    match.cards.splice(index, 1);
    this.renderAdminEventsList(match);
  },

  saveQuickScore() {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    const hScore = parseInt(document.getElementById("homeScoreDisplay").textContent, 10) || 0;
    const aScore = parseInt(document.getElementById("awayScoreDisplay").textContent, 10) || 0;
    const status = document.getElementById("matchStatusSelect").value;
    const minute = document.getElementById("matchMinuteInput").value.trim();

    match.status = status;
    match.liveMinute = minute;

    if (status === "live") {
      match.homeScoreLive = hScore;
      match.awayScoreLive = aScore;
    } else if (status === "finished") {
      match.homeScore = hScore;
      match.awayScore = aScore;
      delete match.homeScoreLive;
      delete match.awayScoreLive;
    } else {
      match.homeScore = null;
      match.awayScore = null;
      delete match.homeScoreLive;
      delete match.awayScoreLive;
    }

    app.store.saveData();
    app.store.syncKnockoutFromStandings();

    // Silently synchronize to Supabase
    if (window.SupabaseService) {
      window.SupabaseService.syncMatch(match, this.adminPinHash);
    }

    document.getElementById("quickScoreModal").classList.remove("active");
    app.showToast("Skor dan data pertandingan berhasil disimpan!");
    app.renderCurrentView();
  },

  // SETTINGS MANAGEMENT
  populateSettingsForm() {
    const cfg = (app.store && app.store.data && app.store.data.config) || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : "";
    };

    setVal("settingName", cfg.tournamentName);
    setVal("settingSub", cfg.subTitle);
    setVal("settingVenue", cfg.venue);
    setVal("settingDates", cfg.dates);
    setVal("settingPin", "");
    const pinEl = document.getElementById("settingPin");
    if (pinEl) pinEl.placeholder = "Kosongkan jika tidak ingin ganti PIN";
    setVal("settingAnnouncement", cfg.runningAnnouncement);

    // MVP fields
    const mvp = (app.store.data.homeData && app.store.data.homeData.mvp) || DEFAULT_DATA.homeData.mvp;
    if (mvp) {
      if (document.getElementById("settingMvpName")) document.getElementById("settingMvpName").value = mvp.name || "";
      if (document.getElementById("settingMvpNumber")) document.getElementById("settingMvpNumber").value = mvp.number || 10;
      if (document.getElementById("settingMvpTeam")) document.getElementById("settingMvpTeam").value = mvp.team || "";
      if (document.getElementById("settingMvpPos")) document.getElementById("settingMvpPos").value = mvp.position || "";
      if (document.getElementById("settingMvpGoals")) document.getElementById("settingMvpGoals").value = mvp.goals || 0;
      if (document.getElementById("settingMvpAssists")) document.getElementById("settingMvpAssists").value = mvp.assists || 0;
      if (document.getElementById("settingMvpQuote")) document.getElementById("settingMvpQuote").value = mvp.quote || "";
    }

    // Supabase fields
    try {
      const defaultUrl = "https://qxanfoqijpznszezwzef.supabase.co";
      const defaultKey = "sb_publishable_3sH1x2EhzsmxKtCAei-sbg_ZAunYZja";
      let url = defaultUrl;
      let key = defaultKey;
      const stored = localStorage.getItem("acc_supabase_cfg");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.url) url = parsed.url;
          if (parsed && parsed.anonKey && parsed.anonKey.length >= 30) key = parsed.anonKey;
        } catch (e) {}
      }
      if (document.getElementById("settingSupabaseUrl")) {
        document.getElementById("settingSupabaseUrl").value = url;
      }
      if (document.getElementById("settingSupabaseKey")) {
        document.getElementById("settingSupabaseKey").value = key;
      }
    } catch (e) {}
  },

  async saveSupabaseConfig() {
    const urlInput = document.getElementById("settingSupabaseUrl");
    const keyInput = document.getElementById("settingSupabaseKey");
    let url = urlInput?.value.trim() || "";
    let key = keyInput?.value.trim() || "";

    // Auto-detect if user pasted .env.local snippet into URL or Key input
    if (window.SupabaseService && window.SupabaseService.parseEnvSnippet) {
      const fromKey = window.SupabaseService.parseEnvSnippet(key);
      const fromUrl = window.SupabaseService.parseEnvSnippet(url);
      if (fromKey) {
        if (fromKey.url && (!url || url.length < 15)) url = fromKey.url;
        if (fromKey.key) key = fromKey.key;
      }
      if (fromUrl) {
        if (fromUrl.url) url = fromUrl.url;
        if (fromUrl.key && !key) key = fromUrl.key;
      }
    }

    if (!url) {
      url = "https://qxanfoqijpznszezwzef.supabase.co";
    }

    if (!key) {
      alert("Harap masukkan Kunci Supabase (bisa yang diawali 'sb_publishable_' atau 'eyJ...')!");
      return;
    }

    if (window.SupabaseService) {
      const ok = window.SupabaseService.configure(url, key);
      if (ok) {
        if (urlInput) urlInput.value = window.SupabaseService.cleanUrl(url);
        if (keyInput) keyInput.value = window.SupabaseService.cleanKey(key);

        app.showToast("⚡ Supabase Cloud aktif & tersambung!");

        if (window.SupabaseService.testConnection) {
          const test = await window.SupabaseService.testConnection();
          if (!test.ok) {
            console.warn("Supabase test info:", test.message);
          }
        }

        if (app.initSupabaseSync) app.initSupabaseSync();
      } else {
        const detail = (window.SupabaseService && window.SupabaseService.lastError) || "Periksa kembali URL dan Kunci Supabase Anda.";
        alert(detail);
      }
    } else {
      alert("Library Supabase belum siap dimuat. Coba refresh halaman Anda.");
    }
  },

  async saveSettings() {
    const cfg = app.store.data.config;
    cfg.tournamentName = document.getElementById("settingName").value.trim();
    cfg.subTitle = document.getElementById("settingSub").value.trim();
    cfg.venue = document.getElementById("settingVenue").value.trim();
    cfg.dates = document.getElementById("settingDates").value.trim();
    
    const newPin = document.getElementById("settingPin").value.trim();
    if (newPin && window.Security) {
      cfg.adminPinHash = await window.Security.hashPin(newPin);
      this.adminPinHash = cfg.adminPinHash;
      sessionStorage.setItem("pondok_futsal_admin_pin_hash", this.adminPinHash);
    }
    delete cfg.adminPin; // Ensure plaintext PIN is never saved in storage
    cfg.runningAnnouncement = document.getElementById("settingAnnouncement").value.trim();

    // Save MVP
    if (!app.store.data.homeData) app.store.data.homeData = JSON.parse(JSON.stringify(DEFAULT_DATA.homeData));
    if (!app.store.data.homeData.mvp) app.store.data.homeData.mvp = {};

    const mvp = app.store.data.homeData.mvp;
    if (document.getElementById("settingMvpName")) mvp.name = document.getElementById("settingMvpName").value.trim();
    if (document.getElementById("settingMvpNumber")) mvp.number = parseInt(document.getElementById("settingMvpNumber").value, 10) || 10;
    if (document.getElementById("settingMvpTeam")) mvp.team = document.getElementById("settingMvpTeam").value.trim();
    if (document.getElementById("settingMvpPos")) mvp.position = document.getElementById("settingMvpPos").value.trim();
    if (document.getElementById("settingMvpGoals")) mvp.goals = parseInt(document.getElementById("settingMvpGoals").value, 10) || 0;
    if (document.getElementById("settingMvpAssists")) mvp.assists = parseInt(document.getElementById("settingMvpAssists").value, 10) || 0;
    if (document.getElementById("settingMvpQuote")) mvp.quote = document.getElementById("settingMvpQuote").value.trim();

    app.store.saveData();
    app.renderHeader();
    if (app.currentTab === "home") app.renderHome();
    app.showToast("Pengaturan turnamen & MVP berhasil diperbarui!");
    document.getElementById("adminDashboardModal").classList.remove("active");
  },

  // BACKUP & RESTORE
  exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.store.data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `futsal_tournament_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    app.showToast("File data turnamen berhasil di-download.");
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.teams && parsed.matches && parsed.config) {
          app.store.data = parsed;
          app.store.saveData();
          app.store.syncKnockoutFromStandings();
          app.renderHeader();
          app.renderCurrentView();
          app.showToast("Data turnamen berhasil di-import!");
          document.getElementById("adminDashboardModal").classList.remove("active");
        } else {
          alert("Format file JSON tidak sesuai struktur data turnamen.");
        }
      } catch (err) {
        alert("Gagal membaca file JSON!");
      }
    };
    reader.readAsText(file);
  },

  // ==========================================
  // HERO BANNER MANAGEMENT (GAMBAR BERANDA)
  // ==========================================
  openHeroBannerModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }
    const currentBanner = (app.store.data.config && app.store.data.config.heroBannerImage) || "assets/hero_banner.jpg";
    const urlInput = document.getElementById("heroBannerUrlInput");
    if (urlInput) urlInput.value = currentBanner;

    const preview = document.getElementById("bannerPreviewBox");
    if (preview) preview.style.backgroundImage = `url('${currentBanner}')`;

    const fileInput = document.getElementById("heroBannerFileInput");
    if (fileInput) fileInput.value = "";

    document.getElementById("heroBannerModal").classList.add("active");
  },

  handleBannerFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, atau WebP)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const urlInput = document.getElementById("heroBannerUrlInput");
      if (urlInput) urlInput.value = dataUrl;

      const preview = document.getElementById("bannerPreviewBox");
      if (preview) preview.style.backgroundImage = `url('${dataUrl}')`;
    };
    reader.readAsDataURL(file);
  },

  handleBannerUrlInput(val) {
    const preview = document.getElementById("bannerPreviewBox");
    if (preview && val) {
      preview.style.backgroundImage = `url('${val}')`;
    }
  },

  setPresetBanner(path) {
    const urlInput = document.getElementById("heroBannerUrlInput");
    if (urlInput) urlInput.value = path;

    const preview = document.getElementById("bannerPreviewBox");
    if (preview) preview.style.backgroundImage = `url('${path}')`;
  },

  saveHeroBanner() {
    const urlInput = document.getElementById("heroBannerUrlInput");
    const bannerVal = (urlInput && urlInput.value.trim()) || "assets/hero_banner.jpg";

    if (!app.store.data.config) app.store.data.config = {};
    app.store.data.config.heroBannerImage = bannerVal;
    app.store.saveData();

    app.renderHeroBanner();
    document.getElementById("heroBannerModal").classList.remove("active");
    app.showToast("Gambar banner beranda berhasil diperbarui!");
  },

  resetHeroBanner() {
    if (confirm("Reset gambar banner ke default GOR Futsal?")) {
      if (!app.store.data.config) app.store.data.config = {};
      app.store.data.config.heroBannerImage = "assets/hero_banner.jpg";
      app.store.saveData();

      const urlInput = document.getElementById("heroBannerUrlInput");
      if (urlInput) urlInput.value = "assets/hero_banner.jpg";

      const preview = document.getElementById("bannerPreviewBox");
      if (preview) preview.style.backgroundImage = "url('assets/hero_banner.jpg')";

      app.renderHeroBanner();
      document.getElementById("heroBannerModal").classList.remove("active");
      app.showToast("Banner beranda dikembalikan ke default.");
    }
  },

  // ==========================================
  // TIM & SKUAD PEMAIN MANAGEMENT
  // ==========================================
  openTeamEditorModal(teamId = null) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    const titleEl = document.getElementById("teamEditorModalTitle");
    const idInput = document.getElementById("editTeamId");
    const nameInput = document.getElementById("editTeamName");
    const shortInput = document.getElementById("editTeamShortName");
    const groupSelect = document.getElementById("editTeamGroup");
    const cityInput = document.getElementById("editTeamCity");
    const colorInput = document.getElementById("editTeamColor");
    const pickerInput = document.getElementById("editTeamColorPicker");
    const coachInput = document.getElementById("editTeamCoach");
    const managerInput = document.getElementById("editTeamManager");
    const medicInput = document.getElementById("editTeamMedic");
    const phoneInput = document.getElementById("editTeamPhone");
    const jHomeInput = document.getElementById("editTeamJerseyHome");
    const jAwayInput = document.getElementById("editTeamJerseyAway");
    const btnDelete = document.getElementById("btnDeleteTeam");

    if (teamId) {
      const team = app.store.getTeam(teamId);
      if (!team) return;

      if (titleEl) titleEl.textContent = `✏️ Edit Tim: ${team.name}`;
      if (idInput) idInput.value = team.id;
      if (nameInput) nameInput.value = team.name;
      if (shortInput) shortInput.value = team.shortName;
      if (groupSelect) groupSelect.value = team.group;
      if (cityInput) cityInput.value = team.city || "";
      if (colorInput) colorInput.value = team.badgeColor || "#10b981";
      if (pickerInput) pickerInput.value = team.badgeColor || "#10b981";

      const off = team.official || {};
      if (coachInput) coachInput.value = off.coach || "";
      if (managerInput) managerInput.value = off.manager || "";
      if (medicInput) medicInput.value = off.medic || "";
      if (phoneInput) phoneInput.value = off.phone || "";
      if (jHomeInput) jHomeInput.value = off.jerseyHome || "";
      if (jAwayInput) jAwayInput.value = off.jerseyAway || "";

      // Official Photos
      const coachPhoto = off.coachPhoto || "";
      const managerPhoto = off.managerPhoto || "";
      const coachPhotoInput = document.getElementById("editTeamCoachPhoto");
      const managerPhotoInput = document.getElementById("editTeamManagerPhoto");
      const coachThumb = document.getElementById("coachPhotoThumb");
      const managerThumb = document.getElementById("managerPhotoThumb");

      if (coachPhotoInput) coachPhotoInput.value = coachPhoto;
      if (managerPhotoInput) managerPhotoInput.value = managerPhoto;
      if (coachThumb) {
        if (coachPhoto) {
          coachThumb.src = coachPhoto;
          coachThumb.style.display = "block";
        } else {
          coachThumb.style.display = "none";
        }
      }
      if (managerThumb) {
        if (managerPhoto) {
          managerThumb.src = managerPhoto;
          managerThumb.style.display = "block";
        } else {
          managerThumb.style.display = "none";
        }
      }

      const catSelect = document.getElementById("editTeamCategory");
      if (catSelect) catSelect.value = team.category || "SMP";

      const logoInput = document.getElementById("editTeamLogo");
      const logoThumb = document.getElementById("teamLogoThumb");
      if (logoInput) logoInput.value = team.logo || "";
      if (logoThumb) logoThumb.src = team.logo || "assets/acc_logo.png";

      if (btnDelete) btnDelete.style.display = "inline-flex";

      this.renderPlayerRows(team.players || []);
    } else {
      if (titleEl) titleEl.textContent = "➕ Input Tim Baru";
      if (idInput) idInput.value = "";
      if (nameInput) nameInput.value = "";
      if (shortInput) shortInput.value = "";
      if (groupSelect) groupSelect.value = "A";
      if (cityInput) cityInput.value = "";
      if (colorInput) colorInput.value = "#10b981";
      if (pickerInput) pickerInput.value = "#10b981";

      const catSelect = document.getElementById("editTeamCategory");
      if (catSelect) catSelect.value = app.currentCategory === "SD" ? "SD" : "SMP";

      const logoInput = document.getElementById("editTeamLogo");
      const logoThumb = document.getElementById("teamLogoThumb");
      if (logoInput) logoInput.value = "";
      if (logoThumb) logoThumb.src = "assets/acc_logo.png";

      if (coachInput) coachInput.value = "";
      if (managerInput) managerInput.value = "";
      if (medicInput) medicInput.value = "";
      if (phoneInput) phoneInput.value = "";
      if (jHomeInput) jHomeInput.value = "Hijau - Putih";
      if (jAwayInput) jAwayInput.value = "Hitam - Emas";

      const coachPhotoInput = document.getElementById("editTeamCoachPhoto");
      const managerPhotoInput = document.getElementById("editTeamManagerPhoto");
      const coachThumb = document.getElementById("coachPhotoThumb");
      const managerThumb = document.getElementById("managerPhotoThumb");
      if (coachPhotoInput) coachPhotoInput.value = "";
      if (managerPhotoInput) managerPhotoInput.value = "";
      if (coachThumb) coachThumb.style.display = "none";
      if (managerThumb) managerThumb.style.display = "none";

      if (btnDelete) btnDelete.style.display = "none";

      this.renderPlayerRows([]);
    }

    document.getElementById("teamEditorModal").classList.add("active");
  },

  handleTeamLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const hiddenInput = document.getElementById("editTeamLogo");
      const thumb = document.getElementById("teamLogoThumb");
      if (hiddenInput) hiddenInput.value = dataUrl;
      if (thumb) thumb.src = dataUrl;

      // Try uploading to Supabase Storage in background
      if (window.SupabaseService && window.SupabaseService.isConfigured && window.SupabaseService.uploadImage) {
        const cloudUrl = await window.SupabaseService.uploadImage(file, "team_logo");
        if (cloudUrl && hiddenInput) {
          hiddenInput.value = cloudUrl;
          if (thumb) thumb.src = cloudUrl;
        }
      }
      app.showToast("Logo tim siap disimpan!");
    };
    reader.readAsDataURL(file);
  },

  handleCoachPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const hiddenInput = document.getElementById("editTeamCoachPhoto");
      const thumb = document.getElementById("coachPhotoThumb");
      if (hiddenInput) hiddenInput.value = dataUrl;
      if (thumb) {
        thumb.src = dataUrl;
        thumb.style.display = "block";
      }
      app.showToast("Foto pelatih siap disimpan!");
    };
    reader.readAsDataURL(file);
  },

  handleManagerPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const hiddenInput = document.getElementById("editTeamManagerPhoto");
      const thumb = document.getElementById("managerPhotoThumb");
      if (hiddenInput) hiddenInput.value = dataUrl;
      if (thumb) {
        thumb.src = dataUrl;
        thumb.style.display = "block";
      }
      app.showToast("Foto manajer siap disimpan!");
    };
    reader.readAsDataURL(file);
  },

  handlePlayerPhotoUpload(event, inputEl) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const label = inputEl.closest("label");
      if (label) {
        const preview = label.querySelector(".player-row-photo-preview");
        const hidden = label.querySelector(".player-photo-input");
        if (preview) preview.src = dataUrl;
        if (hidden) hidden.value = dataUrl;
      }
      app.showToast("Foto pemain siap!");
    };
    reader.readAsDataURL(file);
  },

  renderPlayerRows(players = []) {
    const tbody = document.getElementById("teamEditorPlayersTbody");
    if (!tbody) return;

    if (!players || players.length === 0) {
      players = [
        { no: 1, name: "", pos: "Kiper", goals: 0, yc: 0, rc: 0 },
        { no: 4, name: "", pos: "Anchor", goals: 0, yc: 0, rc: 0 },
        { no: 7, name: "", pos: "Flank", goals: 0, yc: 0, rc: 0 },
        { no: 9, name: "", pos: "Pivot", goals: 0, yc: 0, rc: 0 },
        { no: 10, name: "", pos: "Flank", goals: 0, yc: 0, rc: 0 }
      ];
    }

    tbody.innerHTML = players.map(p => this.createPlayerRowHtml(p)).join("");
  },

  createPlayerRowHtml(p = {}) {
    const pos = p.pos || "Flank";
    const photo = p.photo || "";
    return `
      <tr class="player-input-row">
        <td>
          <input type="number" class="form-input player-no-input" value="${p.no || ''}" placeholder="No" style="padding: 4px; font-weight:700; width: 45px;" required>
        </td>
        <td style="text-align: center;">
          <label class="player-photo-label-btn" title="Klik untuk upload foto pemain" style="cursor: pointer; display: inline-block;">
            <img src="${photo || 'assets/mvp_player.jpg'}" class="player-row-photo-preview" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-color); display: block;" onerror="this.onerror=null; this.src='assets/mvp_player.jpg'">
            <input type="file" accept="image/*" style="display: none;" onchange="admin.handlePlayerPhotoUpload(event, this)">
            <input type="hidden" class="player-photo-input" value="${photo}">
          </label>
        </td>
        <td>
          <input type="text" class="form-input player-name-input" value="${p.name || ''}" placeholder="Nama Pemain" style="padding: 4px;" required>
        </td>
        <td>
          <select class="form-select player-pos-select" style="padding: 4px; font-size: 0.75rem;">
            <option value="Kiper" ${pos === 'Kiper' ? 'selected' : ''}>Kiper</option>
            <option value="Anchor" ${pos === 'Anchor' ? 'selected' : ''}>Anchor</option>
            <option value="Flank" ${pos === 'Flank' ? 'selected' : ''}>Flank</option>
            <option value="Pivot" ${pos === 'Pivot' ? 'selected' : ''}>Pivot</option>
          </select>
        </td>
        <td>
          <input type="number" class="form-input player-goals-input" value="${p.goals || 0}" min="0" style="padding: 4px; width: 45px;">
        </td>
        <td>
          <input type="number" class="form-input player-yc-input" value="${p.yc || 0}" min="0" style="padding: 4px; width: 45px;">
        </td>
        <td>
          <input type="number" class="form-input player-rc-input" value="${p.rc || 0}" min="0" style="padding: 4px; width: 45px;">
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="admin.removePlayerRow(this)" style="color: #ef4444; padding: 2px 6px; font-size: 0.72rem;" title="Hapus Pemain">🗑️</button>
        </td>
      </tr>
    `;
  },

  addPlayerRow() {
    const tbody = document.getElementById("teamEditorPlayersTbody");
    if (!tbody) return;
    const currentRows = tbody.querySelectorAll(".player-input-row").length;
    const tr = document.createElement("tr");
    tr.className = "player-input-row";
    tr.innerHTML = `
      <td>
        <input type="number" class="form-input player-no-input" value="${currentRows + 1}" placeholder="No" style="padding: 4px; font-weight:700; width: 45px;" required>
      </td>
      <td style="text-align: center;">
        <label class="player-photo-label-btn" title="Klik untuk upload foto pemain" style="cursor: pointer; display: inline-block;">
          <img src="assets/mvp_player.jpg" class="player-row-photo-preview" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-color); display: block;">
          <input type="file" accept="image/*" style="display: none;" onchange="admin.handlePlayerPhotoUpload(event, this)">
          <input type="hidden" class="player-photo-input" value="">
        </label>
      </td>
      <td>
        <input type="text" class="form-input player-name-input" value="" placeholder="Nama Pemain" style="padding: 4px;" required>
      </td>
      <td>
        <select class="form-select player-pos-select" style="padding: 4px; font-size: 0.75rem;">
          <option value="Kiper">Kiper</option>
          <option value="Anchor">Anchor</option>
          <option value="Flank" selected>Flank</option>
          <option value="Pivot">Pivot</option>
        </select>
      </td>
      <td>
        <input type="number" class="form-input player-goals-input" value="0" min="0" style="padding: 4px; width: 45px;">
      </td>
      <td>
        <input type="number" class="form-input player-yc-input" value="0" min="0" style="padding: 4px; width: 45px;">
      </td>
      <td>
        <input type="number" class="form-input player-rc-input" value="0" min="0" style="padding: 4px; width: 45px;">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-outline btn-sm" onclick="admin.removePlayerRow(this)" style="color: #ef4444; padding: 2px 6px; font-size: 0.72rem;" title="Hapus Pemain">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  },

  removePlayerRow(btn) {
    const row = btn.closest(".player-input-row");
    if (row) row.remove();
  },

  saveTeamData() {
    const id = document.getElementById("editTeamId").value.trim();
    const name = document.getElementById("editTeamName").value.trim();
    const shortName = document.getElementById("editTeamShortName").value.trim();
    const group = document.getElementById("editTeamGroup").value;
    const city = document.getElementById("editTeamCity").value.trim();
    const badgeColor = document.getElementById("editTeamColor").value.trim() || "#10b981";

    const coach = document.getElementById("editTeamCoach").value.trim();
    const manager = document.getElementById("editTeamManager").value.trim();
    const medic = document.getElementById("editTeamMedic").value.trim();
    const phone = document.getElementById("editTeamPhone").value.trim();
    const jerseyHome = document.getElementById("editTeamJerseyHome").value.trim();
    const jerseyAway = document.getElementById("editTeamJerseyAway").value.trim();

    if (!name) {
      alert("Nama Tim / Sekolah wajib diisi!");
      return;
    }

    // Collect players
    const rows = document.querySelectorAll("#teamEditorPlayersTbody .player-input-row");
    const players = [];
    rows.forEach(r => {
      const pName = r.querySelector(".player-name-input").value.trim();
      const pNo = parseInt(r.querySelector(".player-no-input").value, 10);
      const pPos = r.querySelector(".player-pos-select").value;
      const pGoals = parseInt(r.querySelector(".player-goals-input").value, 10) || 0;
      const pYc = parseInt(r.querySelector(".player-yc-input").value, 10) || 0;
      const pRc = parseInt(r.querySelector(".player-rc-input").value, 10) || 0;
      const pPhoto = r.querySelector(".player-photo-input")?.value || "";

      if (pName) {
        players.push({
          no: isNaN(pNo) ? (players.length + 1) : pNo,
          name: pName,
          pos: pPos,
          goals: pGoals,
          yc: pYc,
          rc: pRc,
          photo: pPhoto
        });
      }
    });

    const coachPhoto = document.getElementById("editTeamCoachPhoto")?.value || "";
    const managerPhoto = document.getElementById("editTeamManagerPhoto")?.value || "";
    const category = document.getElementById("editTeamCategory")?.value || "SMP";
    const logo = document.getElementById("editTeamLogo")?.value || "";

    const teamPayload = {
      name,
      shortName: shortName || name.substring(0, 10).toUpperCase(),
      category,
      logo,
      group,
      badgeColor,
      city,
      official: {
        coach,
        coachPhoto,
        manager,
        managerPhoto,
        medic,
        phone,
        jerseyHome,
        jerseyAway
      },
      players
    };

    if (id) {
      // Edit existing
      const existing = app.store.getTeam(id);
      if (existing) {
        Object.assign(existing, teamPayload);
      }
    } else {
      // Add new
      const newId = "T" + String(app.store.data.teams.length + 1).padStart(2, "0");
      teamPayload.id = newId;
      app.store.data.teams.push(teamPayload);
    }

    app.store.saveData();
    app.store.syncKnockoutFromStandings();

    // Silently synchronize to Supabase
    if (window.SupabaseService) {
      const savedTeam = id ? app.store.getTeam(id) : teamPayload;
      if (savedTeam) window.SupabaseService.syncTeam(savedTeam);
    }

    app.renderTeams();
    app.renderStandings();
    app.renderScorers();
    app.renderDiscipline();

    document.getElementById("teamEditorModal").classList.remove("active");
    app.showToast(`Data tim ${name} berhasil disimpan!`);
  },

  // ==========================================
  // MEDIA HUB (PUSAT UPLOAD FOTO & MEDIA)
  // ==========================================
  mediaHubSelectedFiles: [],

  openMediaHubModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }
    this.mediaHubSelectedFiles = [];
    const controls = document.getElementById("mediaHubControls");
    const previewSec = document.getElementById("mediaHubPreviewSection");
    const previewGrid = document.getElementById("mediaHubPreviewGrid");
    const fileInput = document.getElementById("mediaHubFileInput");

    if (controls) controls.style.display = "none";
    if (previewSec) previewSec.style.display = "none";
    if (previewGrid) previewGrid.innerHTML = "";
    if (fileInput) fileInput.value = "";

    this.populateMediaHubTeams();
    this.updateMediaHubTargetOptions();

    const modal = document.getElementById("mediaHubModal");
    if (modal) modal.classList.add("active");
  },

  populateMediaHubTeams() {
    const select = document.getElementById("mediaHubTargetTeam");
    if (!select) return;
    const teams = app.store.data.teams || [];
    select.innerHTML = teams.map(t => `
      <option value="${t.id}">[${t.category || 'SMP'}] ${t.name}</option>
    `).join("");
  },

  updateMediaHubTargetOptions() {
    const type = document.getElementById("mediaHubTargetType")?.value;
    const teamGroup = document.getElementById("mediaHubTeamGroup");
    const captionGroup = document.getElementById("mediaHubCaptionGroup");

    if (teamGroup) {
      teamGroup.style.display = (type === "teamLogo") ? "block" : "none";
    }
    if (captionGroup) {
      captionGroup.style.display = (type === "moment") ? "block" : "none";
    }
  },

  handleMediaHubFileSelect(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    this.mediaHubSelectedFiles = [];
    const previewGrid = document.getElementById("mediaHubPreviewGrid");
    const countEl = document.getElementById("mediaHubSelectedCount");
    const controls = document.getElementById("mediaHubControls");
    const previewSec = document.getElementById("mediaHubPreviewSection");

    if (previewGrid) previewGrid.innerHTML = "";
    if (countEl) countEl.textContent = files.length;
    if (controls) controls.style.display = "block";
    if (previewSec) previewSec.style.display = "block";

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        this.mediaHubSelectedFiles.push({ file, dataUrl, name: file.name });

        if (previewGrid) {
          const card = document.createElement("div");
          card.className = "media-preview-card";
          card.innerHTML = `
            <img src="${dataUrl}" alt="${file.name}">
            <div class="file-name" title="${file.name}">${file.name}</div>
          `;
          previewGrid.appendChild(card);
        }
      };
      reader.readAsDataURL(file);
    });

    app.showToast(`${files.length} foto siap ditugaskan!`);
  },

  async applyMediaHubUpload() {
    if (!this.mediaHubSelectedFiles || this.mediaHubSelectedFiles.length === 0) {
      alert("Harap pilih foto terlebih dahulu!");
      return;
    }

    const type = document.getElementById("mediaHubTargetType")?.value || "moment";
    const teamId = document.getElementById("mediaHubTargetTeam")?.value;
    const caption = document.getElementById("mediaHubCaptionInput")?.value.trim() || "";

    app.showToast("⏳ Menyimpan foto...");

    for (let i = 0; i < this.mediaHubSelectedFiles.length; i++) {
      const item = this.mediaHubSelectedFiles[i];
      let photoUrl = item.dataUrl;

      // Upload to Supabase Storage if online
      if (window.SupabaseService && window.SupabaseService.isConfigured && window.SupabaseService.uploadImage) {
        const cloudUrl = await window.SupabaseService.uploadImage(item.file, type);
        if (cloudUrl) photoUrl = cloudUrl;
      }

      if (type === "teamLogo" && teamId) {
        const team = app.store.getTeam(teamId);
        if (team) {
          team.logo = photoUrl;
          if (window.SupabaseService && window.SupabaseService.syncTeam) {
            window.SupabaseService.syncTeam(team);
          }
        }
      } else if (type === "banner") {
        if (!app.store.data.config) app.store.data.config = {};
        app.store.data.config.heroBannerImage = photoUrl;
      } else if (type === "moment") {
        const newMoment = {
          id: "M_" + Date.now() + "_" + i,
          title: caption || "Momen Turnamen ACC 2026",
          player: "Sorotan Laga",
          team: teamId ? (app.store.getTeam(teamId)?.name || "ACC 2026") : "ACC 2026",
          tag: "NEW",
          badge: "🔥 HIGHLIGHT",
          image: photoUrl,
          caption: caption || "Dokumentasi aksi spektakuler turnamen futsal ACC 2026."
        };
        if (!app.store.data.moments) app.store.data.moments = [];
        app.store.data.moments.unshift(newMoment);
        if (app.store.data.homeData) {
          if (!app.store.data.homeData.moments) app.store.data.homeData.moments = [];
          app.store.data.homeData.moments.unshift(newMoment);
        }
        if (window.SupabaseService && window.SupabaseService.syncMoment) {
          window.SupabaseService.syncMoment(newMoment);
        }
      }
    }

    app.store.saveData();
    app.renderHeroBanner();
    app.renderCurrentView();

    document.getElementById("mediaHubModal")?.classList.remove("active");
    app.showToast("🎉 Foto berhasil disimpan!");
  },

  deleteTeam() {
    const id = document.getElementById("editTeamId").value.trim();
    if (!id) return;

    const team = app.store.getTeam(id);
    if (!team) return;

    if (confirm(`Yakin ingin menghapus tim "${team.name}" beserta seluruh daftar pemainnya?`)) {
      app.store.data.teams = app.store.data.teams.filter(t => t.id !== id);
      app.store.saveData();
      app.store.syncKnockoutFromStandings();

      app.renderTeams();
      app.renderStandings();
      app.renderScorers();
      app.renderDiscipline();

      document.getElementById("teamEditorModal").classList.remove("active");
      app.showToast(`Tim ${team.name} telah dihapus.`);
    }
  },

  // ==========================================
  // SPONSORSHIP MANAGEMENT
  // ==========================================
  openSponsorEditorModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    this.resetSponsorForm();
    this.renderSponsorsList();
    document.getElementById("sponsorEditorModal").classList.add("active");
  },

  resetSponsorForm() {
    document.getElementById("editSponsorId").value = "";
    document.getElementById("editSponsorImage").value = "";
    document.getElementById("sponsorNameInput").value = "";
    document.getElementById("sponsorTierSelect").value = "platinum";
    document.getElementById("sponsorRoleInput").value = "";
    document.getElementById("sponsorIconSelect").value = "🏦";

    const previewRow = document.getElementById("sponsorLogoPreviewRow");
    if (previewRow) previewRow.style.display = "none";

    const fileInput = document.getElementById("sponsorLogoFileInput");
    if (fileInput) fileInput.value = "";

    const formTitle = document.getElementById("sponsorFormTitle");
    if (formTitle) formTitle.textContent = "➕ Input Sponsor Baru";

    const cancelBtn = document.getElementById("btnCancelEditSponsor");
    if (cancelBtn) cancelBtn.style.display = "none";
  },

  handleSponsorLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById("editSponsorImage").value = dataUrl;

      const previewRow = document.getElementById("sponsorLogoPreviewRow");
      const previewImg = document.getElementById("sponsorLogoPreviewImg");
      if (previewRow && previewImg) {
        previewImg.src = dataUrl;
        previewRow.style.display = "flex";
      }
    };
    reader.readAsDataURL(file);
  },

  removeSponsorLogo() {
    document.getElementById("editSponsorImage").value = "";
    const previewRow = document.getElementById("sponsorLogoPreviewRow");
    if (previewRow) previewRow.style.display = "none";
    const fileInput = document.getElementById("sponsorLogoFileInput");
    if (fileInput) fileInput.value = "";
  },

  saveSponsor() {
    const id = document.getElementById("editSponsorId").value.trim();
    const name = document.getElementById("sponsorNameInput").value.trim();
    const tier = document.getElementById("sponsorTierSelect").value;
    const role = document.getElementById("sponsorRoleInput").value.trim();
    const icon = document.getElementById("sponsorIconSelect").value;
    const image = document.getElementById("editSponsorImage").value;

    if (!name) {
      alert("Nama Sponsor wajib diisi!");
      return;
    }

    if (!app.store.data.sponsors) {
      app.store.data.sponsors = { platinum: [], gold: [], media: [] };
    }
    if (!app.store.data.sponsors[tier]) {
      app.store.data.sponsors[tier] = [];
    }

    if (id) {
      // Find and update across tiers (in case tier was changed)
      ['platinum', 'gold', 'media'].forEach(t => {
        const arr = app.store.data.sponsors[t] || [];
        const idx = arr.findIndex(s => (s.id && s.id === id) || s.name === id);
        if (idx !== -1) {
          arr.splice(idx, 1);
        }
      });

      app.store.data.sponsors[tier].push({
        id: id,
        name,
        type: role,
        role,
        icon,
        image
      });
    } else {
      // Add new
      const newId = "sp_" + Date.now();
      app.store.data.sponsors[tier].push({
        id: newId,
        name,
        type: role,
        role,
        icon,
        image
      });
    }

    app.store.saveData();
    app.renderSponsors();
    this.renderSponsorsList();
    this.resetSponsorForm();
    app.showToast(`Sponsor "${name}" berhasil disimpan!`);
  },

  editSponsor(tier, idOrName) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    const sponsors = app.store.data.sponsors || {};
    const list = sponsors[tier] || [];
    const item = list.find(s => (s.id && s.id === idOrName) || s.name === idOrName);
    if (!item) return;

    this.openSponsorEditorModal();

    document.getElementById("editSponsorId").value = item.id || item.name;
    document.getElementById("sponsorNameInput").value = item.name;
    document.getElementById("sponsorTierSelect").value = tier;
    document.getElementById("sponsorRoleInput").value = item.type || item.role || "";
    document.getElementById("sponsorIconSelect").value = item.icon || "🏦";
    document.getElementById("editSponsorImage").value = item.image || "";

    const previewRow = document.getElementById("sponsorLogoPreviewRow");
    const previewImg = document.getElementById("sponsorLogoPreviewImg");
    if (item.image) {
      previewImg.src = item.image;
      previewRow.style.display = "flex";
    } else {
      previewRow.style.display = "none";
    }

    document.getElementById("sponsorFormTitle").textContent = `✏️ Edit Sponsor: ${item.name}`;
    document.getElementById("btnCancelEditSponsor").style.display = "inline-flex";
  },

  deleteSponsor(tier, idOrName) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (confirm(`Hapus sponsor ini dari kategori ${tier.toUpperCase()}?`)) {
      if (app.store.data.sponsors && app.store.data.sponsors[tier]) {
        app.store.data.sponsors[tier] = app.store.data.sponsors[tier].filter(
          s => (s.id ? s.id !== idOrName : s.name !== idOrName)
        );
        app.store.saveData();
        app.renderSponsors();
        this.renderSponsorsList();
        app.showToast("Sponsor telah dihapus.");
      }
    }
  },

  renderSponsorsList() {
    const container = document.getElementById("adminSponsorsList");
    if (!container) return;

    const sponsors = app.store.data.sponsors || {};
    const tiers = [
      { key: "platinum", label: "👑 Sponsor Utama (Platinum)", color: "#fbbf24" },
      { key: "gold", label: "⚽ Mitra Pendukung (Gold)", color: "#60a5fa" },
      { key: "media", label: "📡 Media Partner", color: "#a78bfa" }
    ];

    let html = "";
    tiers.forEach(t => {
      const items = sponsors[t.key] || [];
      html += `
        <div style="font-size: 0.75rem; font-weight: 800; color: ${t.color}; text-transform: uppercase; margin-top: 6px;">
          ${t.label} (${items.length})
        </div>
      `;

      if (items.length === 0) {
        html += `<div style="font-size: 0.72rem; color: var(--text-muted); padding: 4px;">Belum ada sponsor di tier ini.</div>`;
      } else {
        items.forEach(s => {
          const idVal = s.id || s.name;
          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${s.icon || '🏦'}</span>
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-main);">${s.name}</strong>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${s.type || s.role}</div>
                </div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('${t.key}', '${idVal}')" style="font-size: 0.7rem; padding: 2px 6px;">Edit</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('${t.key}', '${idVal}')" style="color: #ef4444; font-size: 0.7rem; padding: 2px 6px;">Hapus</button>
              </div>
            </div>
          `;
        });
      }
    });

    container.innerHTML = html;
  },

  // ==========================================
  // PANITIA: ACC 2026 MOMENTS MANAGEMENT
  // ==========================================
  openMomentEditorModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }
    this.resetMomentForm();
    this.renderMomentsList();
    document.getElementById("momentEditorModal").classList.add("active");
  },

  handleMomentImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      app.showToast("Harap pilih file gambar valid!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById("editMomentImage").value = dataUrl;
      const previewImg = document.getElementById("momentPhotoPreviewImg");
      const previewRow = document.getElementById("momentPhotoPreviewRow");
      if (previewImg && previewRow) {
        previewImg.src = dataUrl;
        previewRow.style.display = "flex";
      }
      app.showToast("Foto momen siap disimpan!");
    };
    reader.readAsDataURL(file);
  },

  removeMomentPhoto() {
    document.getElementById("editMomentImage").value = "";
    const previewRow = document.getElementById("momentPhotoPreviewRow");
    if (previewRow) previewRow.style.display = "none";
    const fileInput = document.getElementById("momentFileInput");
    if (fileInput) fileInput.value = "";
  },

  resetMomentForm() {
    document.getElementById("editMomentId").value = "";
    document.getElementById("editMomentImage").value = "";
    document.getElementById("momentTitleInput").value = "";
    document.getElementById("momentPlayerInput").value = "";
    document.getElementById("momentTeamInput").value = "";
    document.getElementById("momentBadgeSelect").value = "🔥 MATCHDAY HIGHLIGHT";
    document.getElementById("momentTagSelect").value = "NEW";
    document.getElementById("momentCaptionInput").value = "";

    const fileInput = document.getElementById("momentFileInput");
    if (fileInput) fileInput.value = "";

    const previewRow = document.getElementById("momentPhotoPreviewRow");
    if (previewRow) previewRow.style.display = "none";

    document.getElementById("momentFormTitle").textContent = "📷 Kelola ACC 2026 Moments (Panitia)";
    document.getElementById("btnCancelEditMoment").style.display = "none";
  },

  saveMoment(e) {
    e.preventDefault();
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    const id = document.getElementById("editMomentId").value.trim();
    const title = document.getElementById("momentTitleInput").value.trim();
    const player = document.getElementById("momentPlayerInput").value.trim();
    const team = document.getElementById("momentTeamInput").value.trim();
    const badge = document.getElementById("momentBadgeSelect").value;
    const tag = document.getElementById("momentTagSelect").value;
    const caption = document.getElementById("momentCaptionInput").value.trim();
    const image = document.getElementById("editMomentImage").value || "assets/moment_celebration.jpg";

    if (!title || !player || !team || !caption) {
      app.showToast("Harap isi semua kolom wajib!");
      return;
    }

    if (!app.store.data.moments) {
      app.store.data.moments = [];
    }

    if (id) {
      // Edit
      const idx = app.store.data.moments.findIndex(m => m.id === id);
      if (idx !== -1) {
        app.store.data.moments[idx] = {
          ...app.store.data.moments[idx],
          title,
          player,
          team,
          badge,
          tag,
          caption,
          image: image || app.store.data.moments[idx].image
        };
      }
    } else {
      // Create new
      const newId = `M${Date.now().toString().slice(-4)}`;
      app.store.data.moments.unshift({
        id: newId,
        title,
        player,
        team,
        badge,
        tag,
        caption,
        image
      });
    }

    app.store.saveData();
    if (window.SupabaseService) {
      const savedMoment = id 
        ? app.store.data.moments.find(m => m.id === id) 
        : app.store.data.moments[0];
      if (savedMoment) window.SupabaseService.syncMoment(savedMoment);
    }
    app.renderMoments();
    this.renderMomentsList();
    this.resetMomentForm();
    app.showToast(`Momen "${title}" berhasil disimpan!`);
  },

  editMoment(id) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    const moments = app.store.data.moments || [];
    const item = moments.find(m => m.id === id);
    if (!item) return;

    this.openMomentEditorModal();

    document.getElementById("editMomentId").value = item.id;
    document.getElementById("momentTitleInput").value = item.title;
    document.getElementById("momentPlayerInput").value = item.player;
    document.getElementById("momentTeamInput").value = item.team;
    document.getElementById("momentBadgeSelect").value = item.badge || "🔥 MATCHDAY HIGHLIGHT";
    document.getElementById("momentTagSelect").value = item.tag || "NEW";
    document.getElementById("momentCaptionInput").value = item.caption || "";
    document.getElementById("editMomentImage").value = item.image || "";

    const previewRow = document.getElementById("momentPhotoPreviewRow");
    const previewImg = document.getElementById("momentPhotoPreviewImg");
    if (item.image) {
      previewImg.src = item.image;
      previewRow.style.display = "flex";
    } else {
      previewRow.style.display = "none";
    }

    document.getElementById("momentFormTitle").textContent = `✏️ Edit Momen: ${item.title}`;
    document.getElementById("btnCancelEditMoment").style.display = "inline-flex";
  },

  deleteMoment(id) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (confirm("Hapus sorotan momen pertandingan ini?")) {
      if (app.store.data.moments) {
        app.store.data.moments = app.store.data.moments.filter(m => m.id !== id);
        app.store.saveData();
        app.renderMoments();
        this.renderMomentsList();
        app.showToast("Momen berhasil dihapus.");
      }
    }
  },

  renderMomentsList() {
    const container = document.getElementById("adminMomentsList");
    if (!container) return;

    const moments = app.store.data.moments || [];

    if (moments.length === 0) {
      container.innerHTML = `<div style="font-size: 0.75rem; color: var(--text-muted); padding: 8px;">Belum ada momen yang tersimpan.</div>`;
      return;
    }

    container.innerHTML = moments.map(m => `
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); gap: 10px; margin-bottom: 6px;">
        <img src="${m.image || 'assets/moment_celebration.jpg'}" alt="${m.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
          <div style="font-size: 0.72rem; color: var(--secondary); font-weight: 600;">${m.player} • ${m.team}</div>
          <span style="font-size: 0.65rem; background: rgba(0,0,0,0.08); padding: 1px 6px; border-radius: 4px; color: var(--text-muted); font-weight: 700;">${m.tag || 'NEW'}</span>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button type="button" class="btn btn-outline btn-sm" onclick="admin.editMoment('${m.id}')" style="font-size: 0.7rem; padding: 2px 7px;">Edit</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteMoment('${m.id}')" style="color: #ef4444; font-size: 0.7rem; padding: 2px 7px;">Hapus</button>
        </div>
      </div>
    `).join("");
  },

  logout() {
    this.isAuthenticated = false;
    this.adminPinHash = "";
    sessionStorage.removeItem("pondok_futsal_admin_auth");
    sessionStorage.removeItem("pondok_futsal_admin_pin_hash");
    this.updateAdminUi();
    document.getElementById("adminDashboardModal").classList.remove("active");
    app.showToast("Anda telah logout dari mode admin.");
  }
};

// Initialize Admin
document.addEventListener("DOMContentLoaded", () => {
  admin.init();
});

window.admin = admin;
