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

      // If triggered from a match card, open score editor or opponent editor for that match
      if (this.pendingScoreMatchId) {
        const mId = this.pendingScoreMatchId;
        this.pendingScoreMatchId = null;
        setTimeout(() => {
          this.openQuickScore(mId);
        }, 150);
      }
      if (this.pendingEditorMatchId) {
        const mId = this.pendingEditorMatchId;
        this.pendingEditorMatchId = null;
        setTimeout(() => {
          this.openMatchEditor(mId);
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

    // Bersihkan menit lama jika ada karakter petik ganda
    if (match.scorers) {
      match.scorers.forEach(s => {
        if (s.minute) {
          const d = s.minute.toString().replace(/[^0-9]/g, "");
          s.minute = (d || "1") + "'";
        }
      });
    }
    if (match.cards) {
      match.cards.forEach(c => {
        if (c.minute) {
          const d = c.minute.toString().replace(/[^0-9]/g, "");
          c.minute = (d || "1") + "'";
        }
      });
    }

    const home = app.store.getTeam(match.homeId) || { name: match.homePlaceholder || "TBD", shortName: "TBD" };
    const away = app.store.getTeam(match.awayId) || { name: match.awayPlaceholder || "TBD", shortName: "TBD" };

    const modal = document.getElementById("quickScoreModal");
    const cleanH = (home.shortName || home.name).replace(/\s*SMP\s*/gi, "").replace(/\s*SD\s*/gi, "").trim() || home.shortName;
    const cleanA = (away.shortName || away.name).replace(/\s*SMP\s*/gi, "").replace(/\s*SD\s*/gi, "").trim() || away.shortName;

    const badgeEl = document.getElementById("quickScoreMatchBadge");
    if (badgeEl) badgeEl.textContent = match.id;
    const titleEl = document.getElementById("quickScoreMatchTitle");
    if (titleEl) titleEl.textContent = `${cleanH} vs ${cleanA}`;

    document.getElementById("homeTeamLabel").textContent = home.shortName || home.name;
    document.getElementById("awayTeamLabel").textContent = away.shortName || away.name;

    let homeScoreVal = match.status === 'live' 
      ? (match.homeScoreLive !== undefined && match.homeScoreLive !== null ? match.homeScoreLive : (match.homeScore || 0)) 
      : (match.homeScore !== undefined && match.homeScore !== null ? match.homeScore : (match.homeScoreLive || 0));
    let awayScoreVal = match.status === 'live' 
      ? (match.awayScoreLive !== undefined && match.awayScoreLive !== null ? match.awayScoreLive : (match.awayScore || 0)) 
      : (match.awayScore !== undefined && match.awayScore !== null ? match.awayScore : (match.awayScoreLive || 0));

    // Sinkronkan selalu dengan catatan pencetak gol jika ada
    if (match.scorers && Array.isArray(match.scorers) && match.scorers.length > 0) {
      const hCount = match.scorers.filter(s => s.team === match.homeId).length;
      const aCount = match.scorers.filter(s => s.team === match.awayId).length;
      homeScoreVal = Math.max(parseInt(homeScoreVal, 10) || 0, hCount);
      awayScoreVal = Math.max(parseInt(awayScoreVal, 10) || 0, aCount);
    }

    document.getElementById("homeScoreDisplay").textContent = homeScoreVal;
    document.getElementById("awayScoreDisplay").textContent = awayScoreVal;
    
    const statusSelect = document.getElementById("matchStatusSelect");
    if (statusSelect) statusSelect.value = match.status;
    this.updateStatusPills(match.status);

    // Hentikan timer sebelumnya jika masih aktif
    this.stopLiveTimer();

    // Dapatkan menit awal (bersihkan petik)
    let initialMinute = "";
    if (match.liveMinute) {
      initialMinute = match.liveMinute.toString().replace(/[^0-9]/g, "");
    } else if (match.status === "live") {
      initialMinute = "1";
    }

    const matchMinInput = document.getElementById("matchMinuteInput");
    matchMinInput.value = initialMinute ? `${initialMinute}'` : "";

    const eventMinInput = document.getElementById("eventMinuteInput");
    if (eventMinInput) {
      eventMinInput.dataset.manualEdit = "false";
      eventMinInput.value = initialMinute || "";
      eventMinInput.placeholder = initialMinute ? `Menit (${initialMinute}')` : "Menit (12')";
    }

    const syncNotice = document.getElementById("eventSyncNotice");
    if (syncNotice) {
      if (initialMinute) {
        syncNotice.textContent = `Sinkron: ${initialMinute}'`;
        syncNotice.style.color = "var(--primary)";
      } else {
        syncNotice.textContent = "Sinkron ke Menit Laga";
        syncNotice.style.color = "var(--text-subtle)";
      }
    }

    if (statusSelect) {
      statusSelect.onchange = () => {
        this.updateStatusPills(statusSelect.value);
        if (statusSelect.value === "live") {
          if (!matchMinInput.value || matchMinInput.value === "0'") {
            matchMinInput.value = "1'";
            this.syncEventMinute("1");
          }
        } else {
          this.stopLiveTimer();
        }
      };
    }

    const btnTimer = document.getElementById("btnLiveTimerToggle");
    if (btnTimer) {
      btnTimer.innerHTML = "⏱️";
      btnTimer.classList.remove("active");
    }

    this.renderAdminEventsList(match);
    this.populateEventTeamSelectors(match);

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  },

  setStatus(status) {
    const statusSelect = document.getElementById("matchStatusSelect");
    if (statusSelect) statusSelect.value = status;
    this.updateStatusPills(status);

    const minInput = document.getElementById("matchMinuteInput");
    if (status === "live") {
      if (!minInput.value || minInput.value === "0'") {
        minInput.value = "1'";
        this.syncEventMinute("1");
      }
    } else {
      this.stopLiveTimer();
    }
  },

  updateStatusPills(status) {
    document.querySelectorAll(".status-pill-btn").forEach(btn => {
      const bStatus = btn.dataset.status;
      btn.classList.remove("active", "active-upcoming", "active-live", "active-finished");
      if (bStatus === status) {
        btn.classList.add("active", `active-${status}`);
      }
    });
  },

  finishMatchDirectly() {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    let hScore = parseInt(document.getElementById("homeScoreDisplay").textContent, 10) || 0;
    let aScore = parseInt(document.getElementById("awayScoreDisplay").textContent, 10) || 0;
    if (match.scorers && Array.isArray(match.scorers) && match.scorers.length > 0) {
      const hCount = match.scorers.filter(s => s.team === match.homeId).length;
      const aCount = match.scorers.filter(s => s.team === match.awayId).length;
      hScore = Math.max(hScore, hCount);
      aScore = Math.max(aScore, aCount);
    }
    const home = app.store.getTeam(match.homeId);
    const away = app.store.getTeam(match.awayId);
    const hName = home ? (home.shortName || home.name) : "Home";
    const aName = away ? (away.shortName || away.name) : "Away";

    if (confirm(`Akhiri & Selesaikan Pertandingan Ini?\n\nSkor Akhir: ${hName} ${hScore} - ${aScore} ${aName}\n\nStatus akan langsung disimpan sebagai SELESAI (Finished) dan klasemen akan langsung terupdate.`)) {
      this.setStatus("finished");
      this.saveQuickScore("finished");
    }
  },

  // Stopwatch & Sinkronisasi Menit Laga
  liveTimerInterval: null,

  stopLiveTimer() {
    if (this.liveTimerInterval) {
      clearInterval(this.liveTimerInterval);
      this.liveTimerInterval = null;
    }
    const btn = document.getElementById("btnLiveTimerToggle");
    if (btn) {
      btn.innerHTML = "⏱️";
      btn.classList.remove("active");
    }
    document.body.classList.remove("modal-open");
  },

  toggleLiveTimer() {
    const btn = document.getElementById("btnLiveTimerToggle");
    const input = document.getElementById("matchMinuteInput");
    const statusSelect = document.getElementById("matchStatusSelect");

    if (this.liveTimerInterval) {
      this.stopLiveTimer();
      app.showToast("Stopwatch live dijeda");
      return;
    }

    if (statusSelect && statusSelect.value !== "live") {
      this.setStatus("live");
    }

    let cur = parseInt((input?.value || "0").replace(/[^0-9]/g, ""), 10) || 0;
    if (cur === 0) cur = 1;
    if (input) input.value = `${cur}'`;
    this.syncEventMinute(cur);

    if (btn) {
      btn.innerHTML = `⏸️ ${cur}'`;
      btn.classList.add("active");
    }

    this.liveTimerInterval = setInterval(() => {
      let nowMin = parseInt((input?.value || "0").replace(/[^0-9]/g, ""), 10) || 0;
      nowMin += 1;
      if (input) input.value = `${nowMin}'`;
      this.syncEventMinute(nowMin);
      if (btn) btn.innerHTML = `⏸️ ${nowMin}'`;
    }, 60000);

    app.showToast(`⏱️ Stopwatch menit ${cur}' dimulai`);
  },

  stepMatchMinute(delta) {
    const input = document.getElementById("matchMinuteInput");
    if (!input) return;
    let cur = parseInt((input.value || "0").replace(/[^0-9]/g, ""), 10) || 0;
    cur = Math.max(0, cur + delta);
    input.value = cur > 0 ? `${cur}'` : "0'";
    this.syncEventMinute(cur);
  },

  syncEventMinute(val) {
    const clean = (val || "").toString().replace(/[^0-9]/g, "");
    const eventInput = document.getElementById("eventMinuteInput");
    const syncNotice = document.getElementById("eventSyncNotice");
    if (eventInput) {
      eventInput.placeholder = clean ? `Menit (${clean}')` : "Menit (12')";
      // Hanya timpa otomatis jika pengguna belum mengetik menit manual untuk kejadian tersebut
      if (!eventInput.dataset.manualEdit || eventInput.dataset.manualEdit === "false") {
        eventInput.value = clean;
      }
    }
    if (syncNotice) {
      if (clean) {
        syncNotice.textContent = `Sinkron: ${clean}'`;
        syncNotice.style.color = "var(--primary)";
      } else {
        syncNotice.textContent = "Sinkron ke Menit Laga";
        syncNotice.style.color = "var(--text-subtle)";
      }
    }
  },

  onEventMinuteChange(el) {
    const syncNotice = document.getElementById("eventSyncNotice");
    if (el && el.value.trim() !== "") {
      el.dataset.manualEdit = "true";
      if (syncNotice) {
        syncNotice.textContent = `Manual: ${el.value.trim()}'`;
        syncNotice.style.color = "var(--card-yellow)";
      }
    } else if (el) {
      el.dataset.manualEdit = "false";
      const matchMin = (document.getElementById("matchMinuteInput")?.value || "").replace(/[^0-9]/g, "");
      this.syncEventMinute(matchMin);
    }
  },

  useCurrentLiveMinute() {
    const matchMin = (document.getElementById("matchMinuteInput")?.value || "").replace(/[^0-9]/g, "");
    const eventInput = document.getElementById("eventMinuteInput");
    if (eventInput) {
      eventInput.value = matchMin || "1";
      eventInput.dataset.manualEdit = "false";
      eventInput.focus();
      this.syncEventMinute(matchMin || "1");
      app.showToast(`⏱️ Menit kejadian disamakan ke ${eventInput.value}'`);
    }
  },

  getFormattedEventMinute() {
    const eventInput = document.getElementById("eventMinuteInput");
    const matchMinInput = document.getElementById("matchMinuteInput");

    let raw = (eventInput?.value || "").trim();
    // Jika kolom kejadian kosong, otomatis ambil dari Menit Laga di atas
    if (!raw) {
      raw = (matchMinInput?.value || "").trim();
    }
    const digits = raw.replace(/[^0-9]/g, "");
    return (digits || "1") + "'";
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
    const minute = this.getFormattedEventMinute();

    if (!teamId || !player) {
      alert("Harap pilih tim dan pemain yang mencetak gol!");
      return;
    }

    if (!match.scorers) match.scorers = [];
    match.scorers.push({ team: teamId, player: player, minute: minute });

    // Update player's stats
    const team = app.store.getTeam(teamId);
    const p = team?.players.find(x => x.name === player);
    if (p) p.goals = (p.goals || 0) + 1;

    // Auto increment score display
    const hCount = match.scorers.filter(s => s.team === match.homeId).length;
    const aCount = match.scorers.filter(s => s.team === match.awayId).length;
    const curH = parseInt(document.getElementById("homeScoreDisplay").textContent, 10) || 0;
    const curA = parseInt(document.getElementById("awayScoreDisplay").textContent, 10) || 0;
    document.getElementById("homeScoreDisplay").textContent = Math.max(curH, hCount);
    document.getElementById("awayScoreDisplay").textContent = Math.max(curA, aCount);

    this.renderAdminEventsList(match);
    app.showToast(`⚽ Gol dicatat: ${player} (${minute})`);
  },

  addCardEvent(type) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    const teamId = document.getElementById("eventTeamSelect").value;
    const player = document.getElementById("eventPlayerSelect").value;
    const minute = this.getFormattedEventMinute();

    if (!teamId || !player) {
      alert("Harap pilih tim dan pemain penerima kartu!");
      return;
    }

    if (!match.cards) match.cards = [];
    match.cards.push({ team: teamId, player: player, type: type, minute: minute });

    // Update player's stats
    const team = app.store.getTeam(teamId);
    const p = team?.players.find(x => x.name === player);
    if (p) {
      if (type === "yellow") p.yc = (p.yc || 0) + 1;
      if (type === "red") p.rc = (p.rc || 0) + 1;
    }

    this.renderAdminEventsList(match);
    app.showToast(`Kartu ${type === 'yellow' ? 'Kuning 🟨' : 'Merah 🟥'} dicatat: ${player} (${minute})`);
  },

  cleanMinuteDisplay(min) {
    if (!min) return "";
    const d = min.toString().replace(/[^0-9]/g, "");
    return d ? `${d}'` : min.toString().replace(/["']/g, "") + "'";
  },

  renderAdminEventsList(match) {
    const listEl = document.getElementById("adminEventsList");
    if (!listEl) return;

    const scorers = (match.scorers || []).map((s, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; font-size:0.75rem;">
        <span>⚽ <strong>${s.player}</strong> (${this.cleanMinuteDisplay(s.minute)}) - ${app.store.getTeam(s.team)?.shortName || s.team}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="admin.removeScorer(${idx})" style="padding:2px 6px; color:#ef4444;">Hapus</button>
      </div>
    `).join("");

    const cards = (match.cards || []).map((c, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:4px; font-size:0.75rem;">
        <span><span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span> <strong>${c.player}</strong> (${this.cleanMinuteDisplay(c.minute)}) - ${app.store.getTeam(c.team)?.shortName || c.team}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="admin.removeCard(${idx})" style="padding:2px 6px; color:#ef4444;">Hapus</button>
      </div>
    `).join("");

    listEl.innerHTML = scorers + cards || `<p style="font-size:0.72rem; color:var(--text-subtle);">Belum ada gol atau kartu di laga ini.</p>`;
  },

  removeScorer(index) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match || !match.scorers || !match.scorers[index]) return;
    const removed = match.scorers[index];
    match.scorers.splice(index, 1);

    const team = app.store.getTeam(removed.team);
    const p = team?.players.find(x => x.name === removed.player);
    if (p && p.goals > 0) p.goals -= 1;

    // Recalculate score display from remaining scorers
    const hCount = match.scorers.filter(s => s.team === match.homeId).length;
    const aCount = match.scorers.filter(s => s.team === match.awayId).length;
    document.getElementById("homeScoreDisplay").textContent = hCount;
    document.getElementById("awayScoreDisplay").textContent = aCount;

    this.renderAdminEventsList(match);
    app.showToast(`Gol ${removed.player} dihapus`);
  },

  removeCard(index) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match || !match.cards || !match.cards[index]) return;
    const removed = match.cards[index];
    match.cards.splice(index, 1);

    const team = app.store.getTeam(removed.team);
    const p = team?.players.find(x => x.name === removed.player);
    if (p) {
      if (removed.type === 'yellow' && p.yc > 0) p.yc -= 1;
      if (removed.type === 'red' && p.rc > 0) p.rc -= 1;
    }

    this.renderAdminEventsList(match);
    app.showToast(`Kartu ${removed.type === 'yellow' ? 'Kuning' : 'Merah'} ${removed.player} dihapus`);
  },

  saveQuickScore(overrideStatus = null) {
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;

    this.stopLiveTimer();

    let hScore = parseInt(document.getElementById("homeScoreDisplay").textContent, 10) || 0;
    let aScore = parseInt(document.getElementById("awayScoreDisplay").textContent, 10) || 0;
    const status = overrideStatus || document.getElementById("matchStatusSelect").value;

    // Sinkronkan selalu dengan catatan gol jika ada pencetak gol resmi yang dicatat
    if (match.scorers && Array.isArray(match.scorers) && match.scorers.length > 0) {
      const hCount = match.scorers.filter(s => s.team === match.homeId).length;
      const aCount = match.scorers.filter(s => s.team === match.awayId).length;
      hScore = Math.max(hScore, hCount);
      aScore = Math.max(aScore, aCount);
    }
    
    let minute = document.getElementById("matchMinuteInput").value.trim();
    if (minute) {
      const cleanMin = minute.replace(/[^0-9]/g, "");
      minute = cleanMin ? `${cleanMin}'` : minute;
    }

    match.status = status;
    match.liveMinute = status === 'live' ? (minute || "1'") : minute;

    if (status === "live" || status === "finished") {
      match.homeScore = hScore;
      match.awayScore = aScore;
      match.homeScoreLive = hScore;
      match.awayScoreLive = aScore;
    } else {
      match.homeScore = null;
      match.awayScore = null;
      match.homeScoreLive = null;
      match.awayScoreLive = null;
    }

    if (app.store && typeof app.store.syncPlayerStatsFromMatches === 'function') {
      app.store.syncPlayerStatsFromMatches();
    }
    app.store.saveData();
    app.store.syncKnockoutFromStandings();

    // Silently synchronize to Supabase
    if (window.SupabaseService) {
      window.SupabaseService.syncMatch(match, this.adminPinHash);
    }

    document.getElementById("quickScoreModal").classList.remove("active");
    document.body.classList.remove("modal-open");
    app.showToast(status === 'finished' ? "🏁 Pertandingan selesai & hasil resmi disimpan!" : "💾 Skor pertandingan berhasil disimpan!");
    app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
  },

  // ==========================================
  // ATUR TIM LAWAN & JADWAL PERTANDINGAN (PANITIA)
  // ==========================================
  openMatchEditor(matchId = null) {
    if (!this.isAuthenticated) {
      this.pendingEditorMatchId = matchId || "first";
      this.openLoginModal();
      app.showToast("🔒 Silakan masukkan PIN 1234 untuk mengatur tim lawan!");
      return;
    }

    // Tutup modal lain jika terbuka
    const scoreModal = document.getElementById("quickScoreModal");
    if (scoreModal) scoreModal.classList.remove("active");
    const dashModal = document.getElementById("adminDashboardModal");
    if (dashModal) dashModal.classList.remove("active");

    const matches = (app.store && app.store.data && app.store.data.matches) || [];
    if (!matches.length) {
      alert("Belum ada data pertandingan!");
      return;
    }

    if (!matchId || matchId === "first") {
      matchId = matches[0].id;
    }

    this.activeMatchId = matchId;
    this.switchEditorMatch(matchId, true);

    const modal = document.getElementById("matchEditorModal");
    if (modal) modal.classList.add("active");
  },

  switchEditorMatch(matchId, populateSelect = false) {
    const matches = (app.store && app.store.data && app.store.data.matches) || [];
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    this.activeMatchId = match.id;
    const idInput = document.getElementById("editMatchId");
    if (idInput) idInput.value = match.id;

    const cat = match.category || "SMP";
    const stageName = match.stage === "knockout" ? (match.roundName || "Babak Gugur") : `Grup ${match.group || 'A'}`;
    const titleEl = document.getElementById("editMatchTitle");
    if (titleEl) {
      titleEl.textContent = `⚙️ Atur Lawan: ${match.id} (${cat} - ${stageName})`;
    }

    // Populate Match Selector Dropdown if requested or if options don't match
    const matchSelect = document.getElementById("editMatchSelect");
    if (matchSelect) {
      if (populateSelect || matchSelect.children.length === 0) {
        let optHtml = "";
        ["SMP", "SD"].forEach(c => {
          const catMatches = matches.filter(m => (m.category || "SMP") === c);
          if (catMatches.length) {
            optHtml += `<optgroup label="=== KATEGORI ${c} ===">`;
            catMatches.forEach(m => {
              const hTeam = app.store.getTeam(m.homeId);
              const aTeam = app.store.getTeam(m.awayId);
              const h = hTeam ? hTeam.shortName : (m.homePlaceholder || "TBD");
              const a = aTeam ? aTeam.shortName : (m.awayPlaceholder || "TBD");
              const stage = m.stage === "knockout" ? (m.roundName || "Gugur") : `Grup ${m.group}`;
              optHtml += `<option value="${m.id}" ${m.id === match.id ? 'selected' : ''}>${m.id} [${stage}]: ${h} vs ${a} (${m.date || ''})</option>`;
            });
            optHtml += `</optgroup>`;
          }
        });
        matchSelect.innerHTML = optHtml;
      }
      matchSelect.value = match.id;
    }

    // Ambil daftar tim sesuai kategori laga (SMP / SD)
    const teams = (app.store && app.store.data && app.store.data.teams) ? app.store.data.teams.filter(t => (t.category || "SMP") === cat) : [];

    const homeSelect = document.getElementById("editMatchHomeSelect");
    const awaySelect = document.getElementById("editMatchAwaySelect");

    // Kelompokkan tim berdasarkan grup yang relevan
    const inGroupTeams = teams.filter(t => t.group === match.group);
    const otherTeams = teams.filter(t => t.group !== match.group);

    let teamOptions = `<option value="">-- Pilih Tim (TBD / Kosong) --</option>`;
    if (match.stage === "group" && inGroupTeams.length > 0) {
      teamOptions += `<optgroup label="Tim Grup ${match.group || 'A'} (${inGroupTeams.length} Tim)">`;
      inGroupTeams.forEach(t => {
        teamOptions += `<option value="${t.id}">${t.name} (Grup ${t.group})</option>`;
      });
      teamOptions += `</optgroup>`;
      if (otherTeams.length > 0) {
        teamOptions += `<optgroup label="Tim Grup Lain (${cat})">`;
        otherTeams.forEach(t => {
          teamOptions += `<option value="${t.id}">${t.name} (Grup ${t.group})</option>`;
        });
        teamOptions += `</optgroup>`;
      }
    } else {
      teamOptions += `<optgroup label="Semua Tim ${cat} (${teams.length} Tim)">`;
      teams.forEach(t => {
        teamOptions += `<option value="${t.id}">${t.name} (Grup ${t.group})</option>`;
      });
      teamOptions += `</optgroup>`;
    }

    if (homeSelect) homeSelect.innerHTML = teamOptions;
    if (awaySelect) awaySelect.innerHTML = teamOptions;

    if (homeSelect) homeSelect.value = match.homeId || "";
    if (awaySelect) awaySelect.value = match.awayId || "";

    const dateInput = document.getElementById("editMatchDateInput");
    if (dateInput) dateInput.value = match.date || "22 Nov 2026";
    const timeInput = document.getElementById("editMatchTimeInput");
    if (timeInput) timeInput.value = match.time || "08:00 - 08:40 WITA";
    const pitchInput = document.getElementById("editMatchPitchInput");
    if (pitchInput) pitchInput.value = match.pitch || "Lapangan Utama (Vinyl) - GOR Futsal MTQ Al-Fayyadh Maros";
  },

  saveMatchSchedule(andNext = false) {
    const idInput = document.getElementById("editMatchId");
    if (!idInput) return;
    const mId = idInput.value;
    const matches = (app.store && app.store.data && app.store.data.matches) || [];
    const match = matches.find(m => m.id === mId);
    if (!match) return;

    const homeSelect = document.getElementById("editMatchHomeSelect");
    const awaySelect = document.getElementById("editMatchAwaySelect");
    const homeId = homeSelect ? homeSelect.value : "";
    const awayId = awaySelect ? awaySelect.value : "";

    if (homeId && awayId && homeId === awayId) {
      alert("⚠️ Tim 1 (Home) dan Tim 2 (Away) tidak boleh tim yang sama!");
      return;
    }

    match.homeId = homeId || null;
    match.awayId = awayId || null;
    const dateInput = document.getElementById("editMatchDateInput");
    if (dateInput && dateInput.value.trim()) match.date = dateInput.value.trim();
    const timeInput = document.getElementById("editMatchTimeInput");
    if (timeInput && timeInput.value.trim()) match.time = timeInput.value.trim();
    const pitchInput = document.getElementById("editMatchPitchInput");
    if (pitchInput && pitchInput.value.trim()) match.pitch = pitchInput.value.trim();

    if (app.store && typeof app.store.syncPlayerStatsFromMatches === 'function') {
      app.store.syncPlayerStatsFromMatches();
    }
    app.store.saveData();
    app.store.syncKnockoutFromStandings();

    // Sinkronisasi ke Supabase jika terhubung
    if (window.SupabaseService) {
      window.SupabaseService.syncMatch(match, this.adminPinHash);
    }

    const homeTeam = app.store.getTeam(match.homeId);
    const awayTeam = app.store.getTeam(match.awayId);
    const hName = homeTeam ? homeTeam.shortName : (match.homePlaceholder || "TBD");
    const aName = awayTeam ? awayTeam.shortName : (match.awayPlaceholder || "TBD");

    app.showToast(`✅ Lawan laga ${match.id} berhasil disimpan: ${hName} vs ${aName}!`);
    app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }

    if (andNext) {
      // Cari index laga berikutnya
      const currIdx = matches.findIndex(m => m.id === mId);
      if (currIdx >= 0 && currIdx < matches.length - 1) {
        const nextMatch = matches[currIdx + 1];
        this.switchEditorMatch(nextMatch.id, true);
        return;
      }
    }

    const modal = document.getElementById("matchEditorModal");
    if (modal) modal.classList.remove("active");
  },

  // ==========================================
  // PENGATURAN SIARAN LANGSUNG YOUTUBE (PANITIA)
  // ==========================================
  openYoutubeLiveModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      app.showToast("🔒 Silakan masukkan PIN 1234 untuk mengubah siaran langsung YouTube!");
      return;
    }
    const cfg = (app.store && app.store.data && app.store.data.config) || {};
    const titleInput = document.getElementById("ytLiveTitleInput");
    const urlInput = document.getElementById("ytLiveUrlInput");
    if (titleInput) titleInput.value = cfg.youtubeLiveTitle || "🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros";
    if (urlInput) urlInput.value = cfg.youtubeLiveUrl || "https://www.youtube.com/embed/5qap5aO4i9A";

    this.previewYoutubeUrl(urlInput ? urlInput.value : "");

    const modal = document.getElementById("youtubeLiveModal");
    if (modal) modal.classList.add("active");
  },

  previewYoutubeUrl(url) {
    const frame = document.getElementById("ytPreviewFrame");
    if (!frame) return;
    const embedUrl = app.formatYoutubeEmbedUrl(url);
    frame.src = embedUrl;
  },

  saveYoutubeLiveConfig() {
    const titleInput = document.getElementById("ytLiveTitleInput");
    const urlInput = document.getElementById("ytLiveUrlInput");
    if (!urlInput) return;

    const title = titleInput ? titleInput.value.trim() : "";
    const url = urlInput.value.trim();

    if (!app.store.data.config) app.store.data.config = {};
    app.store.data.config.youtubeLiveTitle = title || "🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros";
    app.store.data.config.youtubeLiveUrl = url || "https://www.youtube.com/embed/5qap5aO4i9A";

    app.store.saveData();

    if (window.SupabaseService) {
      window.SupabaseService.syncConfig(app.store.data.config, this.adminPinHash);
    }

    const modal = document.getElementById("youtubeLiveModal");
    if (modal) modal.classList.remove("active");

    app.showToast("✅ Siaran Langsung YouTube Berhasil Diperbarui!");
    app.renderLiveStreamHero();
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
    let cleanAnn = cfg.runningAnnouncement || "";
    if (cleanAnn.includes("Selamat Datang")) {
      cleanAnn = "🏆 " + cleanAnn.replace(/^.*Selamat Datang/i, "Selamat Datang").trim();
    }
    setVal("settingAnnouncement", cleanAnn);

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
    let savedAnn = document.getElementById("settingAnnouncement").value.trim();
    if (savedAnn.includes("Selamat Datang")) {
      savedAnn = "🏆 " + savedAnn.replace(/^.*Selamat Datang/i, "Selamat Datang").trim();
    }
    cfg.runningAnnouncement = savedAnn;

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
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
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
  // DEVICE SYNC (HP ↔ LAPTOP) SUITE
  // ==========================================
  openDeviceSyncModal(tab = 'export') {
    const modal = document.getElementById("deviceSyncModal");
    if (!modal) return;
    this.switchSyncTab(tab);

    // Generate fresh export code
    const exportTextarea = document.getElementById("deviceSyncExportCode");
    if (exportTextarea && window.app && app.store && app.store.data) {
      exportTextarea.value = JSON.stringify(app.store.data);
    }

    modal.classList.add("active");
  },

  switchSyncTab(tab) {
    const tabExport = document.getElementById("syncTabExport");
    const tabImport = document.getElementById("syncTabImport");
    const tabCloud = document.getElementById("syncTabCloud");
    const btnExport = document.getElementById("tabBtnSyncExport");
    const btnImport = document.getElementById("tabBtnSyncImport");
    const btnCloud = document.getElementById("tabBtnSyncCloud");

    if (tab === 'import') {
      if (tabExport) tabExport.style.display = "none";
      if (tabImport) tabImport.style.display = "block";
      if (tabCloud) tabCloud.style.display = "none";

      if (btnExport) { btnExport.className = "btn btn-sm btn-outline"; }
      if (btnImport) { btnImport.className = "btn btn-sm btn-primary"; }
      if (btnCloud) { btnCloud.className = "btn btn-sm btn-outline"; }
    } else if (tab === 'cloud') {
      if (tabExport) tabExport.style.display = "none";
      if (tabImport) tabImport.style.display = "none";
      if (tabCloud) tabCloud.style.display = "block";

      if (btnExport) { btnExport.className = "btn btn-sm btn-outline"; }
      if (btnImport) { btnImport.className = "btn btn-sm btn-outline"; }
      if (btnCloud) { btnCloud.className = "btn btn-sm btn-primary"; }
    } else {
      if (tabExport) tabExport.style.display = "block";
      if (tabImport) tabImport.style.display = "none";
      if (tabCloud) tabCloud.style.display = "none";

      if (btnExport) { btnExport.className = "btn btn-sm btn-primary"; }
      if (btnImport) { btnImport.className = "btn btn-sm btn-outline"; }
      if (btnCloud) { btnCloud.className = "btn btn-sm btn-outline"; }
    }
  },

  async copySyncCode() {
    const exportTextarea = document.getElementById("deviceSyncExportCode");
    if (!exportTextarea || !exportTextarea.value) {
      if (window.app && app.store && app.store.data) {
        exportTextarea.value = JSON.stringify(app.store.data);
      }
    }
    const code = (exportTextarea && exportTextarea.value) || "";
    if (!code) {
      alert("Belum ada data untuk disalin.");
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        exportTextarea.select();
        document.execCommand('copy');
      }
      app.showToast("📋 Kode data berhasil disalin! Buka laptop dan tempel di tab 'Terima di Laptop'");
    } catch (e) {
      exportTextarea.select();
      document.execCommand('copy');
      app.showToast("📋 Kode data tersalin ke clipboard!");
    }
  },

  shareSyncWhatsApp() {
    this.copySyncCode();
    const text = `*SYNC DATA ACC FUTSAL 2026*\n\nData turnamen terbaru dari HP siap disinkronkan ke Laptop.\nBuka tautan website di Laptop:\nhttps://accfutsal2026.vercel.app\n\nKlik tombol 📲 Sinkron HP ↔ Laptop, lalu tempel kode data backup.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  },

  async pasteFromClipboardToInput() {
    const input = document.getElementById("deviceSyncInputCode");
    if (!input) return;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          input.value = text;
          app.showToast("Kode berhasil ditempel dari clipboard!");
          return;
        }
      }
    } catch (err) {}
    input.focus();
    app.showToast("Silakan klik kanan / tahan di kotak lalu pilih Tempel (Paste).");
  },

  applySyncCode() {
    const input = document.getElementById("deviceSyncInputCode");
    if (!input || !input.value.trim()) {
      alert("Harap masukkan atau tempel kode data sinkronisasi terlebih dahulu!");
      return;
    }
    const raw = input.value.trim();
    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (e1) {
      try {
        parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
      } catch (e2) {
        alert("Format kode tidak valid. Pastikan Anda menyalin seluruh teks kode tanpa terpotong.");
        return;
      }
    }

    if (!parsed) {
      alert("Data tidak dapat dibaca.");
      return;
    }

    // Kasus 1: Full tournament data (teams & matches)
    if (parsed.teams && parsed.matches) {
      app.store.data = parsed;
      app.store.saveData();
      app.store.syncKnockoutFromStandings();
      if (typeof app.renderHeader === 'function') app.renderHeader();
      if (typeof app.renderCurrentView === 'function') app.renderCurrentView();
      if (typeof app.renderTeams === 'function') app.renderTeams();
      if (typeof app.renderStandings === 'function') app.renderStandings();

      const modal = document.getElementById("deviceSyncModal");
      if (modal) modal.classList.remove("active");
      app.showToast("🎉 Sinkronisasi Berhasil! Seluruh data dari HP telah masuk ke Laptop!");
      return;
    }

    // Kasus 2: Single Team object (misal editan SMP Alfayyadh)
    if (parsed.id && parsed.name && app.store && app.store.data && app.store.data.teams) {
      const idx = app.store.data.teams.findIndex(t => t.id === parsed.id || t.name.toLowerCase() === parsed.name.toLowerCase());
      if (idx !== -1) {
        app.store.data.teams[idx] = { ...app.store.data.teams[idx], ...parsed };
      } else {
        app.store.data.teams.push(parsed);
      }
      app.store.saveData();
      if (typeof app.renderTeams === 'function') app.renderTeams();
      if (typeof app.renderCurrentView === 'function') app.renderCurrentView();

      const modal = document.getElementById("deviceSyncModal");
      if (modal) modal.classList.remove("active");
      app.showToast(`🎉 Berhasil sinkronisasi Tim ${parsed.name} ke Laptop!`);
      return;
    }

    alert("Struktur data tidak dikenali. Harap gunakan kode backup resmi.");
  },

  async pushAllToSupabase() {
    if (!window.SupabaseService) {
      alert("Supabase client belum tersedia.");
      return;
    }
    app.showToast("☁️ Sedang mengunggah data ke Supabase Cloud...");
    const res = await window.SupabaseService.syncAllData(app.store.data);
    if (res.ok) {
      app.showToast("✅ Berhasil! Semua data turnamen tersimpan di Supabase Cloud!");
    } else {
      if (res.isRls) {
        alert("Pemberitahuan Supabase RLS:\nSupabase menolak pengunggahan karena proteksi Row-Level Security (RLS) masih aktif.\n\nSilakan jalankan script SQL yang ada di tab Supabase Cloud pada SQL Editor di dashboard Supabase Anda.");
      } else {
        alert("Gagal unggah ke Supabase: " + (res.message || "Periksa koneksi"));
      }
    }
  },

  async pullAllFromSupabase() {
    if (!window.SupabaseService) {
      alert("Supabase client belum tersedia.");
      return;
    }
    app.showToast("☁️ Mengunduh data terbaru dari Supabase...");
    const data = await window.SupabaseService.fetchAllData();
    if (data && (data.matches || data.teams)) {
      if (data.matches && data.matches.length > 0) app.store.data.matches = data.matches;
      if (data.teams && data.teams.length > 0) app.store.data.teams = data.teams;
      if (data.config) Object.assign(app.store.data.config, data.config);
      app.store.saveData();
      app.store.syncKnockoutFromStandings();
      if (typeof app.renderHeader === 'function') app.renderHeader();
      if (typeof app.renderCurrentView === 'function') app.renderCurrentView();
      app.showToast("🎉 Data terbaru dari Cloud Supabase berhasil diterapkan!");
      const modal = document.getElementById("deviceSyncModal");
      if (modal) modal.classList.remove("active");
    } else {
      alert("Belum ada data turnamen yang tersimpan di database Supabase Cloud.");
    }
  },

  async copySupabaseSqlScript() {
    const sql = `ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.tournament_config DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.moments DISABLE ROW LEVEL SECURITY;\nALTER TABLE public.sponsors DISABLE ROW LEVEL SECURITY;`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sql);
      } else {
        const ta = document.createElement("textarea");
        ta.value = sql;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      app.showToast("📋 Script SQL Supabase berhasil disalin!");
    } catch (e) {
      app.showToast("Gagal salin otomatis. Silakan salin teks manual.");
    }
  },
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

    if (app.store && typeof app.store.syncPlayerStatsFromMatches === 'function') {
      app.store.syncPlayerStatsFromMatches();
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
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }

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

  async saveSponsor() {
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
    if (!Array.isArray(app.store.data.sponsors[tier])) {
      app.store.data.sponsors[tier] = [];
    }

    const sponsorObj = {
      id: id || ("sp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)),
      name,
      type: role,
      role,
      icon,
      image
    };

    if (id) {
      // Find and update across tiers (in case tier was changed)
      ['platinum', 'gold', 'media'].forEach(t => {
        const arr = app.store.data.sponsors[t] || [];
        const idx = arr.findIndex(s => (s.id && s.id === id) || s.name === id);
        if (idx !== -1) {
          arr.splice(idx, 1);
        }
      });
      app.store.data.sponsors[tier].push(sponsorObj);
    } else {
      // Add new sponsor (unlimited count)
      app.store.data.sponsors[tier].push(sponsorObj);
    }

    app.store.saveData();
    app.renderSponsors();
    this.renderSponsorsList();
    this.resetSponsorForm();

    // Sinkronisasi ke Supabase Cloud (jika terhubung) agar HP & laptop sama-sama terupdate
    if (window.SupabaseService && window.SupabaseService.isConfigured) {
      try {
        await window.SupabaseService.syncSponsor(sponsorObj, tier);
      } catch (err) {
        console.warn("Supabase syncSponsor notice:", err);
      }
    }

    app.showToast(`✅ Sponsor "${name}" tersimpan! Silakan input sponsor berikutnya.`);

    // Auto-focus ke input nama agar panitia bisa langsung mengetik sponsor selanjutnya tanpa jeda
    setTimeout(() => {
      const nameInp = document.getElementById("sponsorNameInput");
      if (nameInp) nameInp.focus();
    }, 120);
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
    document.getElementById("sponsorTierSelect").value = (tier === 'platinum') ? 'platinum' : 'gold';
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

  async deleteSponsor(tier, idOrName) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (confirm(`Hapus data sponsor ini?`)) {
      let deletedId = idOrName;
      if (app.store.data.sponsors && app.store.data.sponsors[tier]) {
        const item = app.store.data.sponsors[tier].find(s => (s.id ? s.id === idOrName : s.name === idOrName));
        if (item && item.id) deletedId = item.id;

        app.store.data.sponsors[tier] = app.store.data.sponsors[tier].filter(
          s => (s.id ? s.id !== idOrName : s.name !== idOrName)
        );
        app.store.saveData();
        app.renderSponsors();
        this.renderSponsorsList();

        // Hapus juga di Supabase jika terhubung
        if (window.SupabaseService && window.SupabaseService.isConfigured) {
          try {
            await window.SupabaseService.deleteSponsor(deletedId);
          } catch (e) {}
        }

        app.showToast("Sponsor telah dihapus.");
      }
    }
  },

  confirmClearAllSponsors() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (confirm("Yakin ingin mengosongkan semua data sponsor? Tindakan ini menghapus seluruh daftar sponsor yang ada agar panitia bisa menginput sponsor resmi dari awal.")) {
      app.store.data.sponsors = { platinum: [], gold: [], media: [] };
      app.store.saveData();
      app.renderSponsors();
      this.renderSponsorsList();
      this.resetSponsorForm();
      app.showToast("Semua data sponsor telah dikosongkan. Silakan input sponsor baru!");
    }
  },

  renderSponsorsList() {
    const container = document.getElementById("adminSponsorsList");
    if (!container) return;

    let sponsors = app.store.data.sponsors || {};
    if (Array.isArray(sponsors) && typeof app.formatSponsorsFromDb === 'function') {
      sponsors = app.formatSponsorsFromDb(sponsors);
      app.store.data.sponsors = sponsors;
    }
    const primaryItems = Array.isArray(sponsors.platinum) ? sponsors.platinum : [];
    const secondaryItems = [
      ...(Array.isArray(sponsors.gold) ? sponsors.gold : []),
      ...(Array.isArray(sponsors.media) ? sponsors.media : [])
    ];

    let html = "";

    // 1. Baris Atas (Ukuran Besar)
    html += `
      <div style="font-size: 0.78rem; font-weight: 800; color: #fbbf24; margin-top: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span>⭐ Baris Atas (Ukuran Besar)</span>
        <span style="font-size: 0.7rem; opacity: 0.8;">${primaryItems.length} Sponsor</span>
      </div>
    `;

    if (primaryItems.length === 0) {
      html += `<div style="font-size: 0.72rem; color: var(--text-muted); padding: 4px; margin-bottom: 8px;">Belum ada sponsor di baris atas.</div>`;
    } else {
      primaryItems.forEach(s => {
        const idVal = s.id || s.name;
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${s.image ? `<img src="${s.image}" style="max-height: 28px; max-width: 50px; object-fit: contain; background: #fff; padding: 2px; border-radius: 4px;">` : `<span style="font-size: 1.2rem;">${s.icon || '🏦'}</span>`}
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">${s.name}</strong>
                ${s.role || s.type ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${s.role || s.type}</div>` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('platinum', '${idVal}')" style="font-size: 0.7rem; padding: 2px 8px;">Edit</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('platinum', '${idVal}')" style="color: #ef4444; font-size: 0.7rem; padding: 2px 8px;">Hapus</button>
            </div>
          </div>
        `;
      });
    }

    // 2. Baris Bawah (Ukuran Normal)
    html += `
      <div style="font-size: 0.78rem; font-weight: 800; color: #60a5fa; margin-top: 10px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span>🔹 Baris Bawah (Ukuran Normal)</span>
        <span style="font-size: 0.7rem; opacity: 0.8;">${secondaryItems.length} Sponsor</span>
      </div>
    `;

    if (secondaryItems.length === 0) {
      html += `<div style="font-size: 0.72rem; color: var(--text-muted); padding: 4px;">Belum ada sponsor di baris bawah.</div>`;
    } else {
      secondaryItems.forEach(s => {
        const idVal = s.id || s.name;
        const tierKey = (sponsors.gold && sponsors.gold.some(g => (g.id && g.id === s.id) || g.name === s.name)) ? 'gold' : 'media';
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${s.image ? `<img src="${s.image}" style="max-height: 24px; max-width: 44px; object-fit: contain; background: #fff; padding: 2px; border-radius: 4px;">` : `<span style="font-size: 1.1rem;">${s.icon || '⚽'}</span>`}
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">${s.name}</strong>
                ${s.role || s.type ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${s.role || s.type}</div>` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="admin.editSponsor('${tierKey}', '${idVal}')" style="font-size: 0.7rem; padding: 2px 8px;">Edit</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="admin.deleteSponsor('${tierKey}', '${idVal}')" style="color: #ef4444; font-size: 0.7rem; padding: 2px 8px;">Hapus</button>
            </div>
          </div>
        `;
      });
    }

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

  // ==========================================
  // DEMO SIMULATION & RESET (PRESENTASI YAYASAN & PANITIA)
  // ==========================================
  resetAllData() {
    this.resetDemo();
  },

  resetDemo() {
    if (confirm("Reset seluruh data turnamen ke kondisi awal siap presentasi?")) {
      app.store.resetData();
      app.renderHeader();
      app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
      app.showToast("🔄 Data turnamen berhasil di-reset ke kondisi awal demo!");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
    }
  },

  runDemoSimulation(scenario) {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }

    if (scenario === 'live') {
      // Set Match M20 to LIVE
      const m20 = app.store.data.matches.find(m => m.id === "M20");
      if (m20) {
        m20.status = "live";
        m20.liveMinute = "24'";
        m20.homeScore = 2;
        m20.awayScore = 2;
        m20.homeScoreLive = 2;
        m20.awayScoreLive = 2;
      }
      app.store.saveData();
      app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
      app.switchTab("matches");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
      app.showToast("🔴 Mode Live Match Aktif: Laga M20 sedang berjalan 2-2 di menit 24'!");
      return;
    }

    if (scenario === 'finish_groups') {
      // 1. Finish M20
      const m20 = app.store.data.matches.find(m => m.id === "M20");
      if (m20) {
        m20.status = "finished";
        m20.homeScore = 3;
        m20.awayScore = 2;
        delete m20.homeScoreLive;
        delete m20.awayScoreLive;
      }

      // 2. Finish all upcoming group stage matches
      const groupMatches = app.store.data.matches.filter(m => m.stage === "group" && m.status !== "finished");
      const sampleScores = [
        { h: 3, a: 1 }, { h: 2, a: 0 }, { h: 4, a: 2 }, { h: 1, a: 1 },
        { h: 2, a: 3 }, { h: 3, a: 2 }, { h: 0, a: 2 }, { h: 4, a: 1 },
        { h: 2, a: 2 }, { h: 3, a: 0 }, { h: 1, a: 2 }, { h: 2, a: 1 }
      ];

      groupMatches.forEach((m, idx) => {
        const sc = sampleScores[idx % sampleScores.length];
        m.status = "finished";
        m.homeScore = sc.h;
        m.awayScore = sc.a;
        delete m.homeScoreLive;
        delete m.awayScoreLive;
        if (!m.scorers || m.scorers.length === 0) {
          const homeTeam = app.store.getTeam(m.homeId);
          const awayTeam = app.store.getTeam(m.awayId);
          m.scorers = [];
          if (homeTeam && homeTeam.players && homeTeam.players.length > 3) {
            for (let g = 0; g < sc.h; g++) {
              const p = homeTeam.players[(g + 2) % homeTeam.players.length];
              m.scorers.push({ team: m.homeId, player: p.name, minute: `${(g + 1) * 7}'` });
              p.goals = (p.goals || 0) + 1;
            }
          }
          if (awayTeam && awayTeam.players && awayTeam.players.length > 3) {
            for (let g = 0; g < sc.a; g++) {
              const p = awayTeam.players[(g + 3) % awayTeam.players.length];
              m.scorers.push({ team: m.awayId, player: p.name, minute: `${(g + 1) * 9}'` });
              p.goals = (p.goals || 0) + 1;
            }
          }
        }
      });

      app.store.saveData();
      app.store.syncKnockoutFromStandings();
      app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
      app.switchTab("standings");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
      app.showToast("⚡ Seluruh Laga Grup Tuntas! Bagan 8 Besar Otomatis Terisi Lengkap.");
      return;
    }

    if (scenario === 'finish_knockout') {
      // First ensure group stage is finished
      this.runDemoSimulation('finish_groups');

      // Helper to finish match with score
      const finishMatch = (mId, hScore, aScore, defaultHome, defaultAway) => {
        const m = app.store.data.matches.find(x => x.id === mId);
        if (!m) return;
        if (!m.homeId && defaultHome) m.homeId = defaultHome;
        if (!m.awayId && defaultAway) m.awayId = defaultAway;
        m.status = "finished";
        m.homeScore = hScore;
        m.awayScore = aScore;
        const homeTeam = app.store.getTeam(m.homeId);
        const awayTeam = app.store.getTeam(m.awayId);
        m.scorers = [];
        if (homeTeam && homeTeam.players) {
          for (let g = 0; g < hScore; g++) {
            const p = homeTeam.players[(g + 2) % homeTeam.players.length];
            m.scorers.push({ team: m.homeId, player: p.name, minute: `${(g + 1) * 8}'` });
            p.goals = (p.goals || 0) + 1;
          }
        }
        if (awayTeam && awayTeam.players) {
          for (let g = 0; g < aScore; g++) {
            const p = awayTeam.players[(g + 3) % awayTeam.players.length];
            m.scorers.push({ team: m.awayId, player: p.name, minute: `${(g + 1) * 11}'` });
            p.goals = (p.goals || 0) + 1;
          }
        }
      };

      // 1. Finish QF SMP & SD
      finishMatch("QF1_SMP", 3, 2, "T01", "T06");
      finishMatch("QF2_SMP", 4, 1, "T09", "T14");
      finishMatch("QF3_SMP", 2, 3, "T05", "T02");
      finishMatch("QF4_SMP", 3, 1, "T13", "T10");

      finishMatch("QF1_SD", 3, 1, "T17", "T22");
      finishMatch("QF2_SD", 2, 0, "T25", "T30");
      finishMatch("QF3_SD", 1, 2, "T21", "T18");
      finishMatch("QF4_SD", 4, 2, "T32", "T26");

      app.store.syncKnockoutFromStandings();

      // 2. Finish SF SMP & SD
      finishMatch("SF1_SMP", 3, 2, "T01", "T09");
      finishMatch("SF2_SMP", 1, 3, "T02", "T13");

      finishMatch("SF1_SD", 4, 3, "T17", "T25");
      finishMatch("SF2_SD", 2, 4, "T18", "T32");

      app.store.syncKnockoutFromStandings();

      // 3. Finish 3RD & FINAL
      finishMatch("3RD_SMP", 3, 1, "T09", "T02");
      finishMatch("FINAL_SMP", 2, 3, "T01", "T13");

      finishMatch("3RD_SD", 2, 0, "T25", "T18");
      finishMatch("FINAL_SD", 3, 4, "T17", "T32");

      app.store.saveData();
      app.store.syncKnockoutFromStandings();
      app.renderCurrentView();
    if (app && typeof app.updateHeroLiveBadge === 'function') {
      app.updateHeroLiveBadge();
    }
      app.switchTab("bracket");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
      app.showToast("🏆 Turnamen Tuntas! Juara 1, 2, 3 & Top Skor Telah Ditetapkan.");
    }
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
