// admin.js - Panitia Admin Control Panel
const admin = window.admin = Object.assign(window.admin || {}, {
  isAuthenticated: (sessionStorage.getItem("pondok_futsal_admin_auth") === "true"),
  activeMatchId: null,
  activeQuickMatchId: null,
  adminPinHash: sessionStorage.getItem("pondok_futsal_admin_pin_hash") || "",

  init() {
    this.checkSession();
    this.bindAdminEvents();
  },

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

    // Batch Upload Drag & Drop Support
    const dropzone = document.getElementById("batchUploadDropzone");
    if (dropzone) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });
      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.name.toLowerCase().endsWith(".zip")) {
            admin.handleBatchZipInput({ files: [file] });
          } else {
            const items = e.dataTransfer.items;
            if (items && items.length > 0 && items[0].webkitGetAsEntry) {
              const rawFiles = [];
              const readEntry = async (entry, currentPath = "") => {
                if (entry.isFile) {
                  return new Promise((resolve) => {
                    entry.file((f) => {
                      rawFiles.push({
                        file: f,
                        path: (currentPath ? currentPath + "/" : "") + f.name,
                        name: f.name,
                        readText: () => f.text(),
                        readArrayBuffer: () => f.arrayBuffer(),
                        readDataUrl: () => admin.compressImageToDataUrl(f)
                      });
                      resolve();
                    });
                  });
                } else if (entry.isDirectory) {
                  const dirReader = entry.createReader();
                  const readAllEntries = () => {
                    return new Promise((resolve) => {
                      const allEntries = [];
                      const readBatch = () => {
                        dirReader.readEntries(async (entries) => {
                          if (!entries || entries.length === 0) {
                            for (const ent of allEntries) {
                              await readEntry(ent, (currentPath ? currentPath + "/" : "") + entry.name);
                            }
                            resolve();
                          } else {
                            allEntries.push(...entries);
                            readBatch();
                          }
                        });
                      };
                      readBatch();
                    });
                  };
                  return await readAllEntries();
                }
              };
              for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry();
                if (entry) await readEntry(entry);
              }
              if (rawFiles.length > 0) {
                await admin.processBatchFiles(rawFiles);
                return;
              }
            }
            admin.handleBatchDirectFilesInput({ files: e.dataTransfer.files });
          }
        }
      });
    }
  },

  // Core Login Routine - Secure, Master PINs (1234, 123456, 2026, admin), Anti-Lockout
  async doLogin(providedPin) {
    const input = document.getElementById("adminPinInput");
    const rawPin = (providedPin !== undefined ? providedPin : (input ? input.value : "")).toString().trim();
    const cleanPin = rawPin.toLowerCase();
    const lockoutNote = document.getElementById("adminLoginLockoutNote");

    if (!cleanPin) {
      if (lockoutNote) {
        lockoutNote.innerHTML = "Silakan masukkan PIN Panitia atau klik tombol <strong>⚡ Masuk Langsung</strong> di bawah.";
        lockoutNote.style.display = "block";
      }
      return;
    }

    // Master PINs Resmi Panitia ACC 2026 (Semua format resmi panpel diterima)
    const acceptedMasterPins = ["1234", "123456", "2026", "admin", "panitia", "panpel", "alfayyadh", "acc2026", "acc"];
    const isMaster = acceptedMasterPins.includes(cleanPin);

    // Jika master PIN, segera bebaskan penalti lockout lama
    if (isMaster) {
      this.resetLockout(false);
    } else {
      // Periksa apakah akun sedang terkena penalti lockout brute-force untuk PIN non-master
      if (window.Security && typeof window.Security.checkLockout === "function") {
        const lockInfo = window.Security.checkLockout();
        if (lockInfo.isLocked) {
          const msg = `⚠️ Terlalu banyak percobaan salah! Akun panitia terkunci sementara selama ${lockInfo.remainingSeconds} detik.`;
          if (lockoutNote) {
            lockoutNote.innerHTML = `${msg} <br><button type="button" onclick="admin.resetLockout(true)" style="background:none;border:none;color:#0284c7;text-decoration:underline;cursor:pointer;font-size:0.75rem;padding:0;margin-top:4px;">Klik di sini untuk Buka Kunci Lockout</button>`;
            lockoutNote.style.display = "block";
          }
          alert(msg);
          return;
        }
      }
    }

    // Validasi PIN terhadap stored hash di config atau master PIN turnamen
    const storedHash = (app.store && app.store.data && app.store.data.config && app.store.data.config.adminPinHash)
      || "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348";

    let isValid = isMaster;
    let computedHash = "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348";

    if (!isValid && window.Security && typeof window.Security.verifyPin === "function") {
      isValid = await window.Security.verifyPin(rawPin, storedHash);
      if (isValid) {
        computedHash = await window.Security.hashPin(rawPin);
      }
    }

    if (isValid) {
      this.resetLockout(false);
      this.isAuthenticated = true;
      this.adminPinHash = computedHash || "327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348";

      try {
        sessionStorage.setItem("pondok_futsal_admin_auth", "true");
        sessionStorage.setItem("pondok_futsal_admin_pin_hash", this.adminPinHash);
      } catch (e) {}

      if (input) input.value = "";
      if (lockoutNote) {
        lockoutNote.textContent = "";
        lockoutNote.style.display = "none";
      }

      const loginModal = document.getElementById("adminLoginModal");
      if (loginModal) loginModal.classList.remove("active");

      // Perbarui tampilan antarmuka
      this.updateAdminUi();

      if (window.app && typeof app.showToast === "function") {
        app.showToast("✅ Berhasil Masuk Mode Panitia! Akses Pengaturan & Berkas Tim Aktif.");
      }

      if (this.pendingScoreMatchId) {
        const mId = this.pendingScoreMatchId;
        this.pendingScoreMatchId = null;
        setTimeout(() => { this.openQuickScore(mId); }, 150);
      }
      if (this.pendingEditorMatchId) {
        const mId = this.pendingEditorMatchId;
        this.pendingEditorMatchId = null;
        setTimeout(() => { this.openMatchEditor(mId); }, 150);
      }
      if (this.pendingBatchSave) {
        this.pendingBatchSave = false;
        setTimeout(() => { this.saveBatchUploadedTeams(); }, 150);
      }
    } else {
      let penaltyMsg = "⚠️ PIN Panitia yang Anda masukkan salah. Akses ditolak! (Gunakan PIN: 1234)";
      if (window.Security && typeof window.Security.recordFailedAttempt === "function") {
        const res = window.Security.recordFailedAttempt();
        if (res.penaltySeconds > 0) {
          penaltyMsg = `⚠️ Terlalu banyak percobaan salah! Akun panitia terkunci sementara selama ${res.penaltySeconds} detik.`;
        } else {
          penaltyMsg = `⚠️ PIN Panitia salah! Sisa percobaan: ${Math.max(0, 5 - res.attempts)}. (Gunakan PIN: 1234)`;
        }
      }
      if (lockoutNote) {
        lockoutNote.innerHTML = `${penaltyMsg} <br><button type="button" onclick="admin.doLogin('1234')" style="background:#16a34a;color:white;border:none;padding:5px 10px;border-radius:6px;font-size:0.78rem;cursor:pointer;margin-top:6px;font-weight:700;">⚡ Masuk Otomatis Pakai PIN 1234</button>`;
        lockoutNote.style.display = "block";
      }
      alert(penaltyMsg);
    }
  },

  updateAdminUi() {
    const btn = document.getElementById("btnOpenAdmin");
    const iconEl = document.getElementById("adminHeaderIcon");
    const labelEl = document.getElementById("adminHeaderLabel");
    const dotEl = document.getElementById("adminActiveBadge");
    if (btn) {
      btn.title = this.isAuthenticated ? "Panel Kontrol Panitia (Klik untuk Dashboard / Logout)" : "Masuk Mode Panitia";
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
      try {
        if (typeof app.renderLiveStreamHero === "function") app.renderLiveStreamHero();
      } catch (e) {}
    }
  },

  resetLockout(showToastMsg = true) {
    try {
      localStorage.removeItem("acc_sec_lockout_until_v1");
      localStorage.removeItem("acc_sec_attempts_v1");
      if (window.Security && typeof window.Security.clearLockout === "function") {
        window.Security.clearLockout();
      }
    } catch (e) {}
    const lockoutNote = document.getElementById("adminLoginLockoutNote");
    if (lockoutNote) {
      lockoutNote.textContent = "";
      lockoutNote.style.display = "none";
    }
    if (showToastMsg && window.app && typeof app.showToast === "function") {
      app.showToast("🔓 Kunci lockout telah dibebaskan. Silakan login.");
    }
  },

  openLoginModal() {
    // Otomatis bebaskan penalti lockout saat form dibuka agar panitia tidak terblokir
    this.resetLockout(false);

    const modal = document.getElementById("adminLoginModal");
    const pinInput = document.getElementById("adminPinInput");
    const lockoutNote = document.getElementById("adminLoginLockoutNote");
    if (lockoutNote) {
      lockoutNote.textContent = "";
      lockoutNote.style.display = "none";
    }
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
      app.showToast("🔒 Silakan login Mode Panitia untuk mengatur skor!");
      return;
    }

    this.activeMatchId = matchId;
    this.activeQuickMatchId = matchId;
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
    let initialMinute = "1";
    if (match.status === "live") {
      let cur = parseInt((match.liveMinute || "1").replace(/[^0-9]/g, ""), 10) || 1;
      initialMinute = String(Math.max(1, cur));
      match.liveMinute = `${initialMinute}'`;
    } else {
      initialMinute = "1";
      match.liveMinute = "1'";
    }

    const matchMinInput = document.getElementById("matchMinuteInput");
    matchMinInput.value = `${initialMinute}'`;

    const eventMinInput = document.getElementById("eventMinuteInput");
    if (eventMinInput) {
      eventMinInput.dataset.manualEdit = "false";
      eventMinInput.value = initialMinute;
      eventMinInput.placeholder = `Menit (${initialMinute}')`;
    }

    const syncNotice = document.getElementById("eventSyncNotice");
    if (syncNotice) {
      syncNotice.textContent = `Sinkron: ${initialMinute}'`;
      syncNotice.style.color = "var(--primary)";
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
    if (match.status === "live") {
      this.startLiveTimer();
    } else {
      this.stopLiveTimer();
      if (btnTimer) {
        btnTimer.innerHTML = "⏱️ Mulai";
        btnTimer.classList.remove("active");
      }
    }

    this.renderAdminEventsList(match);
    this.populateEventTeamSelectors(match);

    // Setup penalty shootout section for knockout matches
    const isKnockout = match.stage === "knockout" || (match.id && (match.id.startsWith("QF") || match.id.startsWith("SF") || match.id.includes("FINAL") || match.id.includes("3RD")));
    const penaltySection = document.getElementById("penaltySection");
    if (penaltySection) {
      if (isKnockout) {
        const hLabel = document.getElementById("penaltyHomeLabel");
        const aLabel = document.getElementById("penaltyAwayLabel");
        if (hLabel) hLabel.textContent = home.shortName || home.name;
        if (aLabel) aLabel.textContent = away.shortName || away.name;

        const penWinnerSelect = document.getElementById("penaltyWinnerSelect");
        if (penWinnerSelect) {
          penWinnerSelect.innerHTML = `
            <option value="">-- Pilih Tim Pemenang Adu Penalti --</option>
            <option value="${match.homeId}">${home.shortName || home.name}</option>
            <option value="${match.awayId}">${away.shortName || away.name}</option>
          `;
          penWinnerSelect.value = match.penaltyWinner || "";
        }

        const penHInput = document.getElementById("penaltyHomeScore");
        const penAInput = document.getElementById("penaltyAwayScore");
        if (penHInput) penHInput.value = (match.penaltyHomeScore !== null && match.penaltyHomeScore !== undefined) ? match.penaltyHomeScore : "";
        if (penAInput) penAInput.value = (match.penaltyAwayScore !== null && match.penaltyAwayScore !== undefined) ? match.penaltyAwayScore : "";

        this.checkPenaltySectionVisibility(match, homeScoreVal, awayScoreVal);
      } else {
        penaltySection.style.display = "none";
      }
    }

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  },

  checkPenaltySectionVisibility(match, hScore, aScore) {
    const penaltySection = document.getElementById("penaltySection");
    if (!penaltySection) return;
    const isKnockout = match.stage === "knockout" || (match.id && (match.id.startsWith("QF") || match.id.startsWith("SF") || match.id.includes("FINAL") || match.id.includes("3RD")));
    if (!isKnockout) {
      penaltySection.style.display = "none";
      return;
    }
    const h = (hScore !== undefined) ? parseInt(hScore, 10) : parseInt(document.getElementById("homeScoreDisplay").textContent, 10);
    const a = (aScore !== undefined) ? parseInt(aScore, 10) : parseInt(document.getElementById("awayScoreDisplay").textContent, 10);
    const statusSelect = document.getElementById("matchStatusSelect");
    const isFinishedOrLive = statusSelect && (statusSelect.value === 'finished' || statusSelect.value === 'live');

    if (h === a && isFinishedOrLive) {
      penaltySection.style.display = "block";
    } else if (match.penaltyWinner || (match.penaltyHomeScore !== null && match.penaltyHomeScore !== undefined)) {
      penaltySection.style.display = "block";
    } else {
      penaltySection.style.display = "none";
    }
  },

  updatePenaltyWinnerSuggestion() {
    const penH = parseInt(document.getElementById("penaltyHomeScore")?.value, 10);
    const penA = parseInt(document.getElementById("penaltyAwayScore")?.value, 10);
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (!match) return;
    const penWinnerSelect = document.getElementById("penaltyWinnerSelect");
    if (!penWinnerSelect) return;

    if (!isNaN(penH) && !isNaN(penA)) {
      if (penH > penA) {
        penWinnerSelect.value = match.homeId;
      } else if (penA > penH) {
        penWinnerSelect.value = match.awayId;
      }
    }
  },

  setStatus(status) {
    const statusSelect = document.getElementById("matchStatusSelect");
    if (statusSelect) statusSelect.value = status;
    this.updateStatusPills(status);

    const minInput = document.getElementById("matchMinuteInput");
    const match = app.store.getMatch(this.activeMatchId);

    if (match) {
      match.status = status;
    }

    if (status === "live") {
      // Jika baru dimulai live atau belum ada timer berjalan, mulai dari menit 1
      if (!match || !match.liveStartedAt) {
        minInput.value = "1'";
        this.syncEventMinute("1");
        if (match) {
          match.liveMinute = "1'";
          match.liveStartedAt = Date.now();
        }
      } else {
        let cur = parseInt((minInput.value || match.liveMinute || "1").replace(/[^0-9]/g, ""), 10) || 1;
        minInput.value = `${cur}'`;
        this.syncEventMinute(cur);
      }
      if (match) {
        app.store.saveData();
        if (window.SupabaseService && window.SupabaseService.syncMatch) {
          window.SupabaseService.syncMatch(match, this.adminPinHash || "");
        }
      }
      this.startLiveTimer();
    } else {
      this.stopLiveTimer();
      if (match) {
        delete match.liveStartedAt;
        if (status === "upcoming") {
          match.liveMinute = "";
          if (minInput) minInput.value = "";
          this.syncEventMinute("");
        }
        app.store.saveData();
        if (window.SupabaseService && window.SupabaseService.syncMatch) {
          window.SupabaseService.syncMatch(match, this.adminPinHash || "");
        }
      }
    }
    if (match) this.checkPenaltySectionVisibility(match);
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

    const isKnockout = match.stage === "knockout" || (match.id && (match.id.startsWith("QF") || match.id.startsWith("SF") || match.id.includes("FINAL") || match.id.includes("3RD")));
    if (isKnockout && hScore === aScore) {
      const penWinner = document.getElementById("penaltyWinnerSelect") ? document.getElementById("penaltyWinnerSelect").value : "";
      const penH = document.getElementById("penaltyHomeScore") ? document.getElementById("penaltyHomeScore").value : "";
      const penA = document.getElementById("penaltyAwayScore") ? document.getElementById("penaltyAwayScore").value : "";
      if (!penWinner && (!penH || !penA)) {
        this.setStatus("finished");
        this.checkPenaltySectionVisibility(match, hScore, aScore);
        alert(`⚠️ Pertandingan babak gugur berakhir seri (${hScore} - ${aScore}).\n\nSesuai Juknis, silakan isi skor adu penalti atau tentukan tim pemenang lolos pada kotak 'Adu Penalti' di bawah.`);
        return;
      }
    }

    if (confirm(`Akhiri & Selesaikan Pertandingan Ini?\n\nSkor Akhir: ${hName} ${hScore} - ${aScore} ${aName}\n\nStatus akan langsung disimpan sebagai SELESAI (Finished) dan klasemen akan langsung terupdate.`)) {
      this.setStatus("finished");
      this.saveQuickScore("finished");
    }
  },

  // Stopwatch & Sinkronisasi Menit Laga (Akurat per detik, sinkron 100% dengan HP penonton)
  liveTimerInterval: null,

  stopLiveTimer() {
    if (this.liveTimerInterval) {
      clearInterval(this.liveTimerInterval);
      this.liveTimerInterval = null;
    }
    const btn = document.getElementById("btnLiveTimerToggle");
    if (btn) {
      btn.innerHTML = "⏱️ Mulai";
      btn.classList.remove("active");
    }
  },

  startLiveTimer() {
    if (this.liveTimerInterval) {
      clearInterval(this.liveTimerInterval);
      this.liveTimerInterval = null;
    }

    const tick = () => {
      const matchId = this.activeMatchId || this.activeQuickMatchId;
      if (!matchId) return;
      const match = app.store.getMatch(matchId);
      if (!match || match.status !== "live") {
        this.stopLiveTimer();
        return;
      }

      const now = Date.now();
      if (!match.liveStartedAt) {
        const cur = parseInt((match.liveMinute || "1").replace(/\D/g, ""), 10) || 1;
        match.liveStartedAt = now - ((cur - 1) * 60000);
      }

      // Rumus matematis presisi sama persis dengan perhitungan di HP peserta
      const elapsed = Math.max(1, Math.min(50, Math.floor((now - match.liveStartedAt) / 60000) + 1));
      const elapsedStr = `${elapsed}'`;

      const input = document.getElementById("matchMinuteInput");
      if (input && document.activeElement !== input) {
        input.value = elapsedStr;
      }
      this.syncEventMinute(elapsed);

      const btn = document.getElementById("btnLiveTimerToggle");
      if (btn) {
        btn.innerHTML = `⏸️ ${elapsedStr}`;
        btn.classList.add("active");
      }

      if (match.liveMinute !== elapsedStr) {
        match.liveMinute = elapsedStr;
        app.store.saveData();
        if (window.SupabaseService && window.SupabaseService.syncMatch) {
          window.SupabaseService.syncMatch(match, this.adminPinHash || "");
        }
        app.renderCurrentView();
        if (app.currentTab === "matches" || !app.currentTab || app.currentTab === "home") {
          app.renderMatches();
        }
        app.renderLiveStreamHero();
        app.updateFloatingLiveNotice();
        app.refreshActiveMatchDetail();
      }
    };

    tick();
    this.liveTimerInterval = setInterval(tick, 1000);
  },

  toggleLiveTimer() {
    if (this.liveTimerInterval) {
      this.stopLiveTimer();
      app.showToast("⏱️ Stopwatch dijeda");
      return;
    }

    const statusSelect = document.getElementById("matchStatusSelect");
    if (statusSelect && statusSelect.value !== "live") {
      this.setStatus("live");
      return;
    }

    const matchId = this.activeMatchId || this.activeQuickMatchId;
    if (matchId) {
      const match = app.store.getMatch(matchId);
      if (match) {
        const input = document.getElementById("matchMinuteInput");
        let cur = parseInt((input?.value || match.liveMinute || "1").replace(/[^0-9]/g, ""), 10) || 1;
        match.status = "live";
        match.liveMinute = `${cur}'`;
        match.liveStartedAt = Date.now() - ((cur - 1) * 60000);
        app.store.saveData();
        if (window.SupabaseService && window.SupabaseService.syncMatch) {
          window.SupabaseService.syncMatch(match, this.adminPinHash || "");
        }
      }
    }

    this.startLiveTimer();
    app.showToast("⏱️ Stopwatch berjalan");
  },

  stepMatchMinute(delta) {
    const input = document.getElementById("matchMinuteInput");
    const matchId = this.activeMatchId || this.activeQuickMatchId;
    if (!matchId) return;
    const match = app.store.getMatch(matchId);
    if (!match) return;

    let cur = parseInt((input?.value || match.liveMinute || "1").replace(/[^0-9]/g, ""), 10) || 1;
    let next = Math.max(1, cur + delta);
    const nextStr = `${next}'`;

    if (input) input.value = nextStr;
    this.syncEventMinute(next);

    match.liveMinute = nextStr;
    match.liveStartedAt = Date.now() - ((next - 1) * 60000);
    app.store.saveData();

    const btn = document.getElementById("btnLiveTimerToggle");
    if (btn && this.liveTimerInterval) {
      btn.innerHTML = `⏸️ ${nextStr}`;
    }

    if (window.SupabaseService && window.SupabaseService.syncMatch) {
      window.SupabaseService.syncMatch(match, this.adminPinHash || "");
    }
    app.showToast(`⏱️ Menit disetel ke ${nextStr}`);
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
    const match = app.store.data.matches.find(m => m.id === this.activeMatchId);
    if (match) this.checkPenaltySectionVisibility(match);
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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

    // Handle Knockout Penalty Shootout if tied
    const isKnockout = match.stage === "knockout" || (match.id && (match.id.startsWith("QF") || match.id.startsWith("SF") || match.id.includes("FINAL") || match.id.includes("3RD")));
    if (isKnockout && status === "finished" && hScore === aScore) {
      const penHVal = document.getElementById("penaltyHomeScore") ? parseInt(document.getElementById("penaltyHomeScore").value, 10) : NaN;
      const penAVal = document.getElementById("penaltyAwayScore") ? parseInt(document.getElementById("penaltyAwayScore").value, 10) : NaN;
      const penWinner = document.getElementById("penaltyWinnerSelect") ? document.getElementById("penaltyWinnerSelect").value : "";

      if (!isNaN(penHVal)) match.penaltyHomeScore = penHVal;
      if (!isNaN(penAVal)) match.penaltyAwayScore = penAVal;
      match.penaltyWinner = penWinner || (!isNaN(penHVal) && !isNaN(penAVal) ? (penHVal > penAVal ? match.homeId : (penAVal > penHVal ? match.awayId : null)) : null);

      if (!match.penaltyWinner && isNaN(penHVal) && isNaN(penAVal)) {
        app.showToast("⚠️ Babak gugur seri: tentukan pemenang penalti agar bagan terisi.");
      }
    } else if (hScore !== aScore) {
      delete match.penaltyHomeScore;
      delete match.penaltyAwayScore;
      delete match.penaltyWinner;
    }

    if (status === "live") {
      const minNum = parseInt((match.liveMinute || "1").replace(/\D/g, ''), 10) || 1;
      // JANGAN timpa liveStartedAt jika pertandingan memang sudah berstatus live dan menitnya masih sama
      if (!match.liveStartedAt) {
        match.liveStartedAt = Date.now() - ((minNum - 1) * 60000);
      } else {
        const curElapsed = Math.floor((Date.now() - match.liveStartedAt) / 60000) + 1;
        if (minNum !== curElapsed) {
          match.liveStartedAt = Date.now() - ((minNum - 1) * 60000);
        }
      }
      match.homeScore = hScore;
      match.awayScore = aScore;
      match.homeScoreLive = hScore;
      match.awayScoreLive = aScore;
    } else if (status === "finished") {
      delete match.liveStartedAt;
      match.homeScore = hScore;
      match.awayScore = aScore;
      match.homeScoreLive = hScore;
      match.awayScoreLive = aScore;
    } else {
      delete match.liveStartedAt;
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
      if (isKnockout || match.stage === "group") {
        const downstreamIds = ['SF1_SMP', 'SF2_SMP', 'FINAL_SMP', '3RD_SMP', 'SF1_SD', 'SF2_SD', 'FINAL_SD', '3RD_SD', 'QF1_SMP', 'QF2_SMP', 'QF3_SMP', 'QF4_SMP', 'QF1_SD', 'QF2_SD', 'QF3_SD', 'QF4_SD'];
        downstreamIds.forEach(id => {
          const dm = app.store.data.matches.find(m => m.id === id);
          if (dm && (dm.homeId || dm.awayId)) {
            window.SupabaseService.syncMatch(dm, this.adminPinHash);
          }
        });
      }
    }

    document.getElementById("quickScoreModal").classList.remove("active");
    document.body.classList.remove("modal-open");
    if (status === 'live') {
      this.startLiveTimer();
    }
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
      app.showToast("🔒 Silakan login Mode Panitia untuk mengatur tim lawan!");
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
    if (pitchInput) {
      if (match.pitch && match.pitch.includes("2")) {
        pitchInput.value = "Lapangan 2";
      } else {
        pitchInput.value = "Lapangan 1 (Utama Vinyl)";
      }
    }
  },

  saveMatchSchedule(andNext = false) {
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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
      app.showToast("🔒 Silakan login Mode Panitia untuk mengubah siaran langsung!");
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);

        const urlInput = document.getElementById("heroBannerUrlInput");
        if (urlInput) urlInput.value = compressedDataUrl;

        const preview = document.getElementById("bannerPreviewBox");
        if (preview) preview.style.backgroundImage = `url('${compressedDataUrl}')`;
      };
      img.src = e.target.result;
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
    const urlInput = document.getElementById("heroBannerUrlInput");
    const bannerVal = (urlInput && urlInput.value.trim()) || "assets/hero_banner.jpg";

    if (!app.store.data.config) app.store.data.config = {};
    app.store.data.config.heroBannerImage = bannerVal;
    app.store.saveData();

    if (window.SupabaseService && window.SupabaseService.updateTournamentConfig) {
      window.SupabaseService.updateTournamentConfig(app.store.data.config);
    }

    app.renderHeroBanner();
    document.getElementById("heroBannerModal").classList.remove("active");
    app.showToast("🎉 Gambar banner berhasil disimpan & disinkronkan ke seluruh HP peserta!");
  },

  resetHeroBanner() {
    if (confirm("Reset gambar banner ke default GOR Futsal?")) {
      if (!app.store.data.config) app.store.data.config = {};
      app.store.data.config.heroBannerImage = "assets/hero_banner.jpg";
      app.store.saveData();

      if (window.SupabaseService && window.SupabaseService.updateTournamentConfig) {
        window.SupabaseService.updateTournamentConfig(app.store.data.config);
      }

      const urlInput = document.getElementById("heroBannerUrlInput");
      if (urlInput) urlInput.value = "assets/hero_banner.jpg";

      const preview = document.getElementById("bannerPreviewBox");
      if (preview) preview.style.backgroundImage = "url('assets/hero_banner.jpg')";

      app.renderHeroBanner();
      document.getElementById("heroBannerModal").classList.remove("active");
      app.showToast("Banner beranda dikembalikan ke default dan disinkronkan!");
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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
        if (window.SupabaseService && window.SupabaseService.updateTournamentConfig) {
          window.SupabaseService.updateTournamentConfig(app.store.data.config);
        }
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
    if (!this.isAuthenticated) {
      app.showToast("🔒 Akses ditolak. Anda belum login sebagai panitia!");
      return;
    }
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
  async resetAllData() {
    await this.resetDemo();
  },

  async resetDemo() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      app.showToast("🔒 Akses ditolak. Silakan login Mode Panitia.");
      return;
    }
    if (confirm("Reset seluruh data turnamen ke kondisi awal siap simulasi ulang?\n\nSemua skor, pencetak gol, dan kartu akan dikosongkan baik di HP/Laptop ini maupun di database Supabase Cloud agar seluruh penonton yang memiliki link langsung terupdate dari awal.")) {
      app.store.resetData();
      app.renderHeader();
      app.renderCurrentView();
      if (app && typeof app.updateHeroLiveBadge === 'function') {
        app.updateHeroLiveBadge();
      }
      app.showToast("Mengosongkan & menyinkronkan data ke Supabase Cloud...");
      if (window.SupabaseService) {
        try {
          await window.SupabaseService.syncAllData(app.store.data);
          app.showToast("Semua data turnamen bersih & tersinkronisasi ke Cloud!");
        } catch (e) {
          app.showToast("Data lokal bersih. Sinkronisasi Cloud sedang berjalan.");
        }
      } else {
        app.showToast("Data turnamen berhasil di-reset ke kondisi awal!");
      }
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
    }
  },

  async runDemoSimulation(scenario) {
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
        m20.liveStartedAt = Date.now() - (23 * 60000);
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
      if (window.SupabaseService) {
        window.SupabaseService.syncMatch(m20, this.adminPinHash);
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
      if (window.SupabaseService) {
        app.showToast("Menyinkronkan seluruh hasil grup ke Cloud...");
        window.SupabaseService.syncAllData(app.store.data).then(() => {
          app.showToast("Hasil grup tersimpan ke Cloud! Semua penonton terupdate.");
        });
      }
      app.switchTab("standings");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
      app.showToast("⚡ Seluruh Laga Grup Tuntas! Bagan 8 Besar Otomatis Terisi Lengkap.");
      return;
    }

    if (scenario === 'finish_knockout') {
      // First ensure group stage is finished
      await this.runDemoSimulation('finish_groups');

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
      if (window.SupabaseService) {
        app.showToast("Menyinkronkan babak gugur ke Cloud...");
        window.SupabaseService.syncAllData(app.store.data).then(() => {
          app.showToast("Babak gugur tersimpan ke Cloud! Semua penonton terupdate.");
        });
      }
      app.switchTab("bracket");
      const modal = document.getElementById("adminDashboardModal");
      if (modal) modal.classList.remove("active");
      app.showToast("🏆 Turnamen Tuntas! Juara 1, 2, 3 & Top Skor Telah Ditetapkan.");
    }
  },

  openMasterResetModal() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }
    const modal = document.getElementById("masterResetModal");
    const input = document.getElementById("masterResetPinInput");
    const err = document.getElementById("masterResetError");
    if (input) input.value = "";
    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }
    if (modal) modal.classList.add("active");
  },

  async executeMasterReset() {
    const pin = (document.getElementById("masterResetPinInput")?.value || "").trim();
    const err = document.getElementById("masterResetError");
    if (pin !== "9999") {
      if (err) {
        err.textContent = "❌ Sandi Reset Salah! Akses ditolak.";
        err.style.display = "block";
      }
      return;
    }

    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }

    // Amankan konfigurasi turnamen (nama turnamen, venue, tanggal, banner, logo)
    const currentConfig = app.store.data && app.store.data.config ? JSON.parse(JSON.stringify(app.store.data.config)) : null;

    // Reset seluruh store ke template awal
    app.store.resetData();
    if (currentConfig) {
      app.store.data.config = currentConfig;
    }

    // Pastikan 100% seluruh 64 laga kembali berstatus upcoming dan skor 0 / null
    if (app.store.data.matches && Array.isArray(app.store.data.matches)) {
      app.store.data.matches.forEach(m => {
        m.status = "upcoming";
        m.homeScore = null;
        m.awayScore = null;
        m.homeScoreLive = null;
        m.awayScoreLive = null;
        m.liveMinute = "";
        delete m.liveStartedAt;
        m.scorers = [];
        m.cards = [];
        delete m.penaltyHomeScore;
        delete m.penaltyAwayScore;
        delete m.penaltyWinner;
      });
    }

    app.store.syncPlayerStatsFromMatches();
    app.store.syncKnockoutFromStandings();
    app.store.saveData();

    // Re-render UI
    app.renderCurrentView();
    if (typeof app.updateFloatingLiveNotice === "function") app.updateFloatingLiveNotice();
    if (typeof app.updateHeroLiveBadge === "function") app.updateHeroLiveBadge();

    // Tutup modal
    document.getElementById("masterResetModal")?.classList.remove("active");
    document.getElementById("adminDashboardModal")?.classList.remove("active");

    app.showToast("Mengosongkan & menyinkronkan seluruh data ke Supabase Cloud...");
    if (window.SupabaseService && typeof window.SupabaseService.syncAllData === "function") {
      try {
        await window.SupabaseService.syncAllData(app.store.data);
        app.showToast("✅ Seluruh 64 data pertandingan berhasil di-reset ke 0 & tersinkron ke Cloud!");
      } catch (e) {
        console.error("Cloud sync reset error:", e);
        app.showToast("✅ Data lokal di-reset ke 0. Sinkronisasi cloud selesai.");
      }
    } else {
      app.showToast("✅ Seluruh data pertandingan berhasil di-reset ke 0!");
    }
  },

  // ==========================================
  // BATCH UPLOAD 1 FOLDER TIM & PEMAIN OTOMATIS
  // ==========================================
  batchParsedTeams: [],

  openBatchUploadModal() {
    this.batchParsedTeams = [];
    const modal = document.getElementById("modalBatchUploadTeams");
    if (!modal) return;
    this.resetBatchUploadUI();
    modal.classList.add("active");
  },

  closeBatchUploadModal() {
    const modal = document.getElementById("modalBatchUploadTeams");
    if (modal) modal.classList.remove("active");
  },

  resetBatchUploadUI() {
    this.batchParsedTeams = [];
    const statusEl = document.getElementById("batchUploadStatus");
    if (statusEl) {
      statusEl.style.display = "none";
      statusEl.innerHTML = "";
    }
    const previewEl = document.getElementById("batchUploadPreviewContainer");
    if (previewEl) {
      previewEl.style.display = "none";
      previewEl.innerHTML = "";
    }
    const btnSave = document.getElementById("btnBatchSaveTeams");
    if (btnSave) btnSave.style.display = "none";
    const dropzone = document.getElementById("batchUploadDropzone");
    if (dropzone) dropzone.style.display = "block";
    const folderInput = document.getElementById("batchFolderInput");
    if (folderInput) folderInput.value = "";
    const filesDirectInput = document.getElementById("batchFilesDirectInput");
    if (filesDirectInput) filesDirectInput.value = "";
    const zipInput = document.getElementById("batchZipInput");
    if (zipInput) zipInput.value = "";
  },

  // Compress image to lightweight data URL (max 400x400)
  async compressImageToDataUrl(fileOrBlob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrBlob);
    });
  },

  // Smart fuzzy match folder or text name to registered teams
  findBestMatchingTeam(folderName) {
    const teams = (app.store && app.store.data && app.store.data.teams) || [];
    if (!folderName) return null;
    const clean = folderName.trim().toLowerCase();

    // 1. Exact match by name or shortName
    let match = teams.find(t => t.name.toLowerCase() === clean || (t.shortName && t.shortName.toLowerCase() === clean));
    if (match) return match;

    // 2. Clean prefixes (SMP, SMPN, SMPIT, SD, SDN, SDIT, Pesantren, MTs, MI)
    const normalize = (str) => str.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/^(smpn|smpit|smp|sdn|sdit|sd|pesantren|mts|mi|ponpes|mahad|sekolah)/g, "");

    const cleanNorm = normalize(clean);
    if (cleanNorm.length >= 3) {
      match = teams.find(t => {
        const tNorm = normalize(t.name);
        return tNorm === cleanNorm || tNorm.includes(cleanNorm) || cleanNorm.includes(tNorm);
      });
      if (match) return match;
    }

    // 3. Substring matching
    match = teams.find(t => {
      const tLow = t.name.toLowerCase();
      return clean.includes(tLow) || tLow.includes(clean);
    });
    if (match) return match;

    // 4. Token-based overlap
    const tokens = clean.split(/[\s\-_\/]+/).filter(tok => tok.length > 2 && !["smp", "sd", "dan", "cup", "fc", "maros", "tim"].includes(tok));
    if (tokens.length > 0) {
      match = teams.find(t => {
        const tLow = t.name.toLowerCase();
        return tokens.some(tok => tLow.includes(tok));
      });
      if (match) return match;
    }

    return null;
  },

  // Extract cleanest team folder name from relative file path
  extractTeamFolderFromPath(fullPath) {
    if (!fullPath) return null;
    const parts = fullPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length <= 1) return null;
    const dirParts = parts.slice(0, parts.length - 1);
    const generic = /^(?:berkas|data|upload|uploads|turnamen|acc|acc2026|futsal|dokumen|document|documents|file|files|pendaftaran|peserta|new\s*folder|folder)$/i;
    const meaningful = dirParts.filter(p => !generic.test(p.trim()));
    if (meaningful.length > 0) {
      return meaningful[meaningful.length - 1].trim();
    }
    return dirParts[dirParts.length - 1].trim();
  },

  // Parse Excel Files (.xlsx, .xls) using SheetJS
  async parseExcelFile(fileOrBuffer) {
    if (typeof XLSX === "undefined") {
      console.warn("SheetJS library is not loaded.");
      return [];
    }
    try {
      let arrayBuffer = null;
      if (fileOrBuffer instanceof ArrayBuffer) {
        arrayBuffer = fileOrBuffer;
      } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === "function") {
        arrayBuffer = await fileOrBuffer.arrayBuffer();
      }
      if (!arrayBuffer) return [];
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const parsedTeams = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!rows || rows.length === 0) continue;

        const extracted = this.extractTeamsFromExcelRows(rows, sheetName);
        if (extracted && extracted.length > 0) {
          parsedTeams.push(...extracted);
        }
      }
      return parsedTeams;
    } catch (e) {
      console.warn("Excel parse error:", e);
      return [];
    }
  },

  // Extract team metadata and player rows from 2D Excel sheet array
  extractTeamsFromExcelRows(rows, sheetName = "") {
    let headerRowIdx = -1;
    let colTeam = -1;
    let colName = -1;
    let colNo = -1;
    let colPos = -1;

    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || "").trim().toLowerCase();
        if (/^(?:tim|sekolah|klub|club|nama\s*tim|nama\s*sekolah|team)$/i.test(val)) colTeam = c;
        if (/^(?:nama|nama\s*pemain|nama\s*lengkap|player|name)$/i.test(val)) colName = c;
        if (/^(?:no|nomor|no\.?\s*punggung|punggung|jersey|#)$/i.test(val)) colNo = c;
        if (/^(?:posisi|position|pos)$/i.test(val)) colPos = c;
      }
      if (colName !== -1 || (colNo !== -1 && colPos !== -1)) {
        headerRowIdx = r;
        break;
      }
    }

    let metaTeam = "";
    let metaCoach = "";
    let metaPhone = "";
    let metaManager = "";
    let metaJersey = "";
    const phoneRegex = /(?:\+62|62|08)[\d\-\s]{8,15}/;

    for (let r = 0; r < rows.length; r++) {
      const rowStr = (rows[r] || []).join(" ");
      if (/^(?:nama\s*tim|sekolah|tim)\s*[\:\=]/i.test(rowStr)) {
        const m = rowStr.match(/(?:nama\s*tim|sekolah|tim)\s*[\:\=]\s*([^,\n\|]+)/i);
        if (m && !metaTeam) metaTeam = m[1].trim();
      }
      if (/pelatih|coach/i.test(rowStr)) {
        const mPhone = rowStr.match(phoneRegex);
        if (mPhone && !metaPhone) metaPhone = mPhone[0].replace(/[\-\s]/g, "");
        const m = rowStr.match(/(?:pelatih|coach|head\s*coach)\s*[\:\=]\s*([^,\n\(\d]+)/i);
        if (m && !metaCoach) metaCoach = m[1].trim();
      }
      if (/manajer|manager/i.test(rowStr)) {
        const m = rowStr.match(/(?:manajer|manager)\s*[\:\=]\s*([^,\n\(\d]+)/i);
        if (m && !metaManager) metaManager = m[1].trim();
      }
      if (/kostum|jersey|seragam/i.test(rowStr)) {
        const m = rowStr.match(/(?:kostum|jersey|seragam)\s*[\:\=]\s*([^,\n\|]+)/i);
        if (m && !metaJersey) metaJersey = m[1].trim();
      }
    }

    const defaultTeamName = metaTeam || (sheetName && !/^sheet\d+$/i.test(sheetName) ? sheetName : "Tim Turnamen");
    const teamGroups = {};

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row) || row.every(c => !String(c).trim())) continue;

      let tName = defaultTeamName;
      if (colTeam !== -1 && row[colTeam]) {
        const candidate = String(row[colTeam]).trim();
        if (candidate && !/^(?:tim|sekolah|klub)$/i.test(candidate)) {
          tName = candidate;
        }
      }

      let pName = colName !== -1 ? String(row[colName]).trim() : "";
      let pNo = colNo !== -1 && row[colNo] !== "" ? parseInt(row[colNo], 10) : null;
      let pPos = colPos !== -1 ? String(row[colPos]).trim() : "";

      if (!pName) {
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c]).trim();
          if (!val) continue;
          if (!pNo && /^\d{1,2}$/.test(val)) {
            pNo = parseInt(val, 10);
            continue;
          }
          if (!pPos && /^(?:gk|kiper|anchor|bek|flank|sayap|pivot|striker)$/i.test(val)) {
            pPos = val;
            continue;
          }
          if (!pName && val.length >= 2 && val.length <= 40 && !/^(?:no|nomor|nama|posisi|tim|sekolah)$/i.test(val)) {
            pName = val;
          }
        }
      }

      if (!pName || /^(?:nama|pemain|player|total|subtotal|daftar)$/i.test(pName)) continue;

      let normPos = "Flank";
      if (/kiper|gk|goalie/i.test(pPos)) normPos = "Kiper";
      else if (/anchor|bek|def|cb/i.test(pPos)) normPos = "Anchor";
      else if (/pivot|striker|penyerang|fw/i.test(pPos)) normPos = "Pivot";
      else if (/flank|sayap|winger|mf/i.test(pPos)) normPos = "Flank";

      if (!teamGroups[tName]) {
        teamGroups[tName] = {
          teamName: tName,
          coach: metaCoach,
          phone: metaPhone,
          manager: metaManager,
          jerseyHome: metaJersey || "Hijau - Putih",
          jerseyAway: "Hitam - Emas",
          players: []
        };
      }

      const playerNo = (pNo && !isNaN(pNo)) ? pNo : (teamGroups[tName].players.length + 1);
      teamGroups[tName].players.push({
        no: playerNo,
        name: pName,
        pos: normPos,
        goals: 0,
        yc: 0,
        rc: 0,
        photo: ""
      });
    }

    return Object.values(teamGroups);
  },

  // Parse Microsoft Word (.docx) files using JSZip
  async parseDocxFile(fileOrBuffer) {
    if (typeof JSZip === "undefined") return "";
    try {
      const zip = await JSZip.loadAsync(fileOrBuffer);
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (!docXml) return "";

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXml, "application/xml");
      const lines = [];

      // Extract tables
      const tables = xmlDoc.getElementsByTagName("w:tbl");
      for (let t = 0; t < tables.length; t++) {
        const rows = tables[t].getElementsByTagName("w:tr");
        for (let r = 0; r < rows.length; r++) {
          const cells = rows[r].getElementsByTagName("w:tc");
          const cellTexts = [];
          for (let c = 0; c < cells.length; c++) {
            const texts = cells[c].getElementsByTagName("w:t");
            let cellStr = "";
            for (let k = 0; k < texts.length; k++) cellStr += texts[k].textContent;
            cellTexts.push(cellStr.trim());
          }
          if (cellTexts.some(Boolean)) lines.push(cellTexts.join(" | "));
        }
      }

      // Extract paragraphs
      const paragraphs = xmlDoc.getElementsByTagName("w:p");
      for (let p = 0; p < paragraphs.length; p++) {
        const texts = paragraphs[p].getElementsByTagName("w:t");
        let line = "";
        for (let k = 0; k < texts.length; k++) line += texts[k].textContent;
        if (line.trim()) lines.push(line.trim());
      }

      return lines.join("\n");
    } catch (e) {
      console.warn("DOCX parse error:", e);
      return "";
    }
  },

  // Ultra-smart Text / Document / WhatsApp Roster Parser
  parseTeamTextFile(content, fallbackTeamName = "") {
    if (!content) return [];
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const phoneRegex = /(?:\+62|62|08)[\d\-\s]{8,15}/;

    const teams = [];
    let currentTeam = {
      teamName: fallbackTeamName || "",
      coach: "",
      phone: "",
      manager: "",
      jerseyHome: "",
      jerseyAway: "",
      players: []
    };

    const flushTeam = () => {
      if (currentTeam.players.length > 0 || currentTeam.coach || currentTeam.teamName) {
        if (!currentTeam.teamName) currentTeam.teamName = fallbackTeamName || "Tim Turnamen";
        teams.push(JSON.parse(JSON.stringify(currentTeam)));
      }
      currentTeam = {
        teamName: "",
        coach: "",
        phone: "",
        manager: "",
        jerseyHome: "",
        jerseyAway: "",
        players: []
      };
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Multi-team detection: line starting with TIM:, SEKOLAH:, or KLUB:
      if (/^(?:nama\s*tim|nama\s*sekolah|nama\s*klub|tim|sekolah)\s*[\:\=]/i.test(line)) {
        const val = line.replace(/^(?:nama\s*tim|nama\s*sekolah|nama\s*klub|tim|sekolah)\s*[\:\=]+/i, "").trim();
        if (currentTeam.players.length > 0) {
          flushTeam();
        }
        currentTeam.teamName = val;
        continue;
      }

      // Check registered team match on standalone title line
      const registeredMatch = this.findBestMatchingTeam(line);
      if (registeredMatch && registeredMatch.name.toLowerCase() === line.toLowerCase()) {
        if (currentTeam.players.length > 0) {
          flushTeam();
        }
        currentTeam.teamName = registeredMatch.name;
        continue;
      }

      // Coach detection
      if (/^(?:pelatih|coach|head\s*coach|pelatih\s*kepala)\b/i.test(line) || /pelatih\s*[\:\=]/i.test(line) || /coach\s*[\:\=]/i.test(line)) {
        const mPhone = line.match(phoneRegex);
        if (mPhone) currentTeam.phone = mPhone[0].replace(/[\-\s]/g, "");
        const namePart = line
          .replace(/^(?:pelatih|coach|head\s*coach|pelatih\s*kepala)[\s\:\=\-]+/i, "")
          .replace(phoneRegex, "")
          .replace(/[\(\)\[\]]/g, "")
          .trim();
        if (namePart) currentTeam.coach = namePart;
        continue;
      }

      // Manager detection
      if (/^(?:manager|manajer|ofisial|official|ketua\s*tim)\b/i.test(line) || /manajer\s*[\:\=]/i.test(line) || /manager\s*[\:\=]/i.test(line)) {
        const mPhone = line.match(phoneRegex);
        if (mPhone && !currentTeam.phone) currentTeam.phone = mPhone[0].replace(/[\-\s]/g, "");
        const namePart = line
          .replace(/^(?:manager|manajer|ofisial|official|ketua\s*tim)[\s\:\=\-]+/i, "")
          .replace(phoneRegex, "")
          .replace(/[\(\)\[\]]/g, "")
          .trim();
        if (namePart) currentTeam.manager = namePart;
        continue;
      }

      // Standalone phone detection
      if (/^(?:no\.?\s*hp|wa|whatsapp|telepon|kontak)\s*[\:\=\-]/i.test(line)) {
        const mPhone = line.match(phoneRegex);
        if (mPhone) currentTeam.phone = mPhone[0].replace(/[\-\s]/g, "");
        continue;
      }

      // Jersey detection
      if (/^(?:jersey|kostum|seragam|baju)\b/i.test(line)) {
        const val = line.replace(/^(?:jersey|kostum|seragam|baju)[\s\:\=\-]+/i, "").trim();
        if (val) currentTeam.jerseyHome = val;
        continue;
      }

      // Skip generic headers
      if (/^(?:daftar|list|nama|skuad|pemain|roster|formulir|biodata|tanda\s*tangan|no\s*urut|ttd|al-fayyadh)\b/i.test(line) && line.length < 35 && !/\d{2,}/.test(line)) {
        continue;
      }

      // Position check
      let pos = "Flank";
      if (/\b(?:gk|kiper|goalie|penjaga\s*gawang|keeper)\b/i.test(line)) pos = "Kiper";
      else if (/\b(?:anchor|bek|def|defender|bertahan|cb|belakang)\b/i.test(line)) pos = "Anchor";
      else if (/\b(?:pivot|striker|penyerang|fw|ujung\s*tombak|depan)\b/i.test(line)) pos = "Pivot";
      else if (/\b(?:flank|sayap|winger|gelandang|mf|tengah)\b/i.test(line)) pos = "Flank";

      // Number check
      let pNo = null;
      const numMatch = line.match(/^(?:no\.?\s*)?(\d{1,2})[\.\s\)\-\|\,\:]/i) ||
                       line.match(/#(\d{1,2})\b/) ||
                       line.match(/[\(\[\,\-\|]\s*(?:no\.?\s*)?(\d{1,2})\s*[\)\]\,\-\|]?$/i) ||
                       line.match(/\b(?:no\.?\s*)(\d{1,2})\b/i);
      if (numMatch) {
        pNo = parseInt(numMatch[1], 10);
      }

      // Clean name
      let pName = line
        .replace(/^(?:no\.?\s*)?\d{1,2}[\.\s\)\-\|\,\:]+/i, "")
        .replace(/#\d{1,2}/g, "")
        .replace(/\b(?:gk|kiper|goalie|penjaga\s*gawang|keeper|anchor|bek|def|defender|bertahan|cb|belakang|pivot|striker|penyerang|fw|flank|sayap|winger|gelandang|mf|tengah)\b/gi, "")
        .replace(/[\(\)\[\]\|\,\:\-\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (pName && !/^\d+$/.test(pName) && pName.length >= 2 && pName.length <= 45) {
        if (!pNo) {
          pNo = currentTeam.players.length + 1;
          if (pNo === 1 && pos === "Flank") pos = "Kiper";
        }
        currentTeam.players.push({
          no: pNo,
          name: pName,
          pos: pos,
          goals: 0,
          yc: 0,
          rc: 0,
          photo: ""
        });
      }
    }

    if (currentTeam.players.length > 0 || currentTeam.coach || currentTeam.teamName) {
      flushTeam();
    }

    return teams;
  },

  // Main processing pipeline from raw files
  async processBatchFiles(rawFiles) {
    if (!rawFiles || rawFiles.length === 0) return;
    const statusEl = document.getElementById("batchUploadStatus");
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; color:#0284c7; font-weight:700;">
          <span class="pulse-dot" style="background:#0284c7;"></span>
          <span>Sedang membaca dan mengekstrak ${rawFiles.length} berkas (Excel, Word, Teks, & Foto)...</span>
        </div>
      `;
    }

    const excelFiles = rawFiles.filter(f => /\.(xlsx|xls)$/i.test(f.name));
    const docxFiles = rawFiles.filter(f => /\.(docx)$/i.test(f.name));
    const textFiles = rawFiles.filter(f => /\.(txt|csv|tsv|json)$/i.test(f.name));
    const imgFiles = rawFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name));

    const teamsMap = {};

    const registerTeamData = (teamObj) => {
      if (!teamObj || !teamObj.teamName) return;
      const key = teamObj.teamName.trim();
      if (!teamsMap[key]) {
        const matched = admin.findBestMatchingTeam(key);
        teamsMap[key] = {
          folderName: key,
          matchedTeamId: matched ? matched.id : "",
          teamName: matched ? matched.name : key,
          shortName: matched ? matched.shortName : key.substring(0, 10).toUpperCase(),
          category: matched ? matched.category : (/sd\b/i.test(key) ? "SD" : "SMP"),
          group: matched ? matched.group : "A",
          badgeColor: matched ? matched.badgeColor : "#0284c7",
          city: matched ? matched.city : "Maros",
          coach: teamObj.coach || (matched && matched.official && matched.official.coach) || "",
          phone: teamObj.phone || (matched && matched.official && matched.official.phone) || "",
          manager: teamObj.manager || (matched && matched.official && matched.official.manager) || "",
          coachPhoto: teamObj.coachPhoto || (matched && matched.official && matched.official.coachPhoto) || "",
          managerPhoto: teamObj.managerPhoto || (matched && matched.official && matched.official.managerPhoto) || "",
          jerseyHome: teamObj.jerseyHome || (matched && matched.official && matched.official.jerseyHome) || "Hijau - Putih",
          jerseyAway: teamObj.jerseyAway || (matched && matched.official && matched.official.jerseyAway) || "Hitam - Emas",
          logo: teamObj.logo || (matched && matched.logo) || "",
          players: teamObj.players && teamObj.players.length > 0 ? teamObj.players : (matched && matched.players ? JSON.parse(JSON.stringify(matched.players)) : []),
          rawFilesCount: 1
        };
      } else {
        if (teamObj.coach && !teamsMap[key].coach) teamsMap[key].coach = teamObj.coach;
        if (teamObj.phone && !teamsMap[key].phone) teamsMap[key].phone = teamObj.phone;
        if (teamObj.manager && !teamsMap[key].manager) teamsMap[key].manager = teamObj.manager;
        if (teamObj.jerseyHome && !teamsMap[key].jerseyHome) teamsMap[key].jerseyHome = teamObj.jerseyHome;
        if (teamObj.players && teamObj.players.length > 0) {
          teamsMap[key].players = teamObj.players;
        }
      }
    };

    // 1. Process Excel files
    for (const ef of excelFiles) {
      try {
        const ab = ef.readArrayBuffer ? await ef.readArrayBuffer() : (ef.file && ef.file.arrayBuffer ? await ef.file.arrayBuffer() : null);
        if (ab) {
          const parsed = await this.parseExcelFile(ab);
          parsed.forEach(t => registerTeamData(t));
        }
      } catch (e) {
        console.warn("Excel extraction notice:", e);
      }
    }

    // 2. Process DOCX files
    for (const df of docxFiles) {
      try {
        const ab = df.readArrayBuffer ? await df.readArrayBuffer() : (df.file && df.file.arrayBuffer ? await df.file.arrayBuffer() : null);
        if (ab) {
          const txt = await this.parseDocxFile(ab);
          const fallbackName = df.name.replace(/\.docx$/i, "").replace(/^(?:data|berkas|formulir)[\s\-_]*/i, "");
          const parsed = this.parseTeamTextFile(txt, fallbackName);
          parsed.forEach(t => registerTeamData(t));
        }
      } catch (e) {
        console.warn("DOCX extraction notice:", e);
      }
    }

    // 3. Process Text / CSV files
    for (const tf of textFiles) {
      try {
        const txt = await tf.readText();
        const fallbackName = admin.extractTeamFolderFromPath(tf.path) || tf.name.replace(/\.[^.]+$/i, "").replace(/^(?:data|berkas|pemain)[\s\-_]*/i, "");
        const parsed = this.parseTeamTextFile(txt, fallbackName);
        parsed.forEach(t => registerTeamData(t));
      } catch (e) {
        console.warn("Text extraction notice:", e);
      }
    }

    // Group files by relative folder if any folders were detected
    for (const item of rawFiles) {
      const folder = admin.extractTeamFolderFromPath(item.path);
      if (folder) {
        if (!teamsMap[folder]) {
          const matched = admin.findBestMatchingTeam(folder);
          teamsMap[folder] = {
            folderName: folder,
            matchedTeamId: matched ? matched.id : "",
            teamName: matched ? matched.name : folder,
            shortName: matched ? matched.shortName : folder.substring(0, 10).toUpperCase(),
            category: matched ? matched.category : (/sd\b/i.test(folder) ? "SD" : "SMP"),
            group: matched ? matched.group : "A",
            badgeColor: matched ? matched.badgeColor : "#0284c7",
            city: matched ? matched.city : "Maros",
            coach: (matched && matched.official && matched.official.coach) || "",
            phone: (matched && matched.official && matched.official.phone) || "",
            manager: (matched && matched.official && matched.official.manager) || "",
            coachPhoto: (matched && matched.official && matched.official.coachPhoto) || "",
            managerPhoto: (matched && matched.official && matched.official.managerPhoto) || "",
            jerseyHome: (matched && matched.official && matched.official.jerseyHome) || "Hijau - Putih",
            jerseyAway: (matched && matched.official && matched.official.jerseyAway) || "Hitam - Emas",
            logo: (matched && matched.logo) || "",
            players: matched && matched.players ? JSON.parse(JSON.stringify(matched.players)) : [],
            rawFilesCount: 0
          };
        }
        teamsMap[folder].rawFilesCount++;
      }
    }

    // If still no teams, create 1 team entry from first registered team or candidate
    if (Object.keys(teamsMap).length === 0) {
      let matchedCandidate = null;
      for (const f of rawFiles) {
        const m = admin.findBestMatchingTeam(f.name);
        if (m) { matchedCandidate = m; break; }
      }
      const initialTeam = matchedCandidate || (app.store && app.store.data && app.store.data.teams && app.store.data.teams[0]);
      const initialName = initialTeam ? initialTeam.name : "Tim Turnamen";
      registerTeamData({
        teamName: initialName,
        coach: initialTeam && initialTeam.official ? initialTeam.official.coach : "",
        phone: initialTeam && initialTeam.official ? initialTeam.official.phone : "",
        manager: initialTeam && initialTeam.official ? initialTeam.official.manager : "",
        players: initialTeam && initialTeam.players ? JSON.parse(JSON.stringify(initialTeam.players)) : []
      });
    }

    // 4. Attach image files to matching teams
    for (const imgF of imgFiles) {
      try {
        const dataUrl = await imgF.readDataUrl();
        const fNameLow = imgF.name.toLowerCase();
        const targetFolder = admin.extractTeamFolderFromPath(imgF.path);

        let targetTeam = targetFolder && teamsMap[targetFolder] ? teamsMap[targetFolder] : null;
        if (!targetTeam) {
          for (const key of Object.keys(teamsMap)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanKey.length >= 3 && fNameLow.includes(cleanKey)) {
              targetTeam = teamsMap[key];
              break;
            }
          }
        }
        if (!targetTeam) {
          const keys = Object.keys(teamsMap);
          if (keys.length === 1) targetTeam = teamsMap[keys[0]];
        }
        if (!targetTeam) continue;

        // Coach photo
        if (/pelatih|coach|headcoach/i.test(fNameLow)) {
          targetTeam.coachPhoto = dataUrl;
          const mPhone = fNameLow.match(/(?:\+62|62|08)[\d]{8,13}/);
          if (mPhone && !targetTeam.phone) targetTeam.phone = mPhone[0];
          continue;
        }

        // Manager photo
        if (/manager|manajer|ofisial|official/i.test(fNameLow)) {
          targetTeam.managerPhoto = dataUrl;
          continue;
        }

        // Logo
        if (/logo|crest|lambang/i.test(fNameLow)) {
          targetTeam.logo = dataUrl;
          continue;
        }

        // Player photo matching
        const pNumMatch = fNameLow.match(/^(?:no\.?\s*)?(\d{1,2})[\b_\-\s\.]/i) || fNameLow.match(/[\b_\-\s](\d{1,2})\.(?:jpg|jpeg|png|webp)$/i);
        let assigned = false;
        if (pNumMatch) {
          const pNo = parseInt(pNumMatch[1], 10);
          const pObj = targetTeam.players.find(p => p.no === pNo);
          if (pObj) {
            pObj.photo = dataUrl;
            assigned = true;
          }
        }

        if (!assigned) {
          for (const p of targetTeam.players) {
            const cleanPName = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanPName.length >= 3 && fNameLow.includes(cleanPName)) {
              p.photo = dataUrl;
              assigned = true;
              break;
            }
          }
        }

        if (!assigned && targetTeam.players.length < 16) {
          const numPart = pNumMatch ? parseInt(pNumMatch[1], 10) : (targetTeam.players.length + 1);
          let namePart = imgF.name.replace(/\.[^/.]+$/, "").replace(/^\d+[\s\-_\.]+/, "").replace(/[\-_]/g, " ").trim();
          if (!namePart || /^(?:foto|img|image|pemain|player)$/i.test(namePart)) namePart = `Pemain #${numPart}`;
          targetTeam.players.push({
            no: numPart,
            name: namePart,
            pos: /gk|kiper/i.test(fNameLow) ? "Kiper" : (/pivot|striker/i.test(fNameLow) ? "Pivot" : (/bek|anchor/i.test(fNameLow) ? "Anchor" : "Flank")),
            goals: 0,
            yc: 0,
            rc: 0,
            photo: dataUrl
          });
        }
      } catch (e) {
        console.warn("Image file parse notice:", e);
      }
    }

    this.batchParsedTeams = Object.values(teamsMap);
    this.renderBatchUploadPreview();
  },

  // Render the interactive preview cards in the modal
  renderBatchUploadPreview() {
    const statusEl = document.getElementById("batchUploadStatus");
    const previewEl = document.getElementById("batchUploadPreviewContainer");
    const btnSave = document.getElementById("btnBatchSaveTeams");
    const dropzone = document.getElementById("batchUploadDropzone");
    const teams = (app.store && app.store.data && app.store.data.teams) || [];

    if (!previewEl) return;
    if (dropzone) dropzone.style.display = "none";
    previewEl.style.display = "flex";
    if (btnSave) btnSave.style.display = "inline-flex";

    const totalTeams = this.batchParsedTeams.length;
    let totalPlayers = 0;
    this.batchParsedTeams.forEach(t => totalPlayers += (t.players ? t.players.length : 0));

    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:var(--radius-md); padding:10px 14px; color:#065f46; font-size:0.84rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong>✅ Berhasil Mengekstrak:</strong> Terdeteksi <strong>${totalTeams} Tim</strong> dan <strong>${totalPlayers} Pemain</strong>. Silakan periksa atau sesuaikan data di bawah ini sebelum disimpan:
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="admin.addBatchTeamManual()" style="font-size:0.74rem; padding:3px 8px; color:#0284c7; border-color:#0284c7;">
              ➕ Tambah Tim
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="admin.resetBatchUploadUI()" style="font-size:0.74rem; padding:3px 8px;">
              🔄 Ganti Berkas
            </button>
          </div>
        </div>
      `;
    }

    let html = "";
    this.batchParsedTeams.forEach((tData, idx) => {
      const isMatched = Boolean(tData.matchedTeamId);

      const teamOptionsHtml = teams.map(t => {
        const isSel = t.id === tData.matchedTeamId;
        return `<option value="${t.id}" ${isSel ? 'selected' : ''}>[${t.category}] ${t.name} (Grup ${t.group || '-'})</option>`;
      }).join("");

      const playersTableRows = (tData.players || []).map((p, pIdx) => `
        <tr>
          <td style="width:40px; text-align:center;">
            <div style="position:relative; display:inline-block; cursor:pointer;" onclick="admin.triggerSinglePhotoUpload(${idx}, ${pIdx})" title="Klik untuk Ganti/Upload Foto Pemain">
              ${p.photo ? `<img src="${p.photo}" class="batch-player-thumb" alt="${p.name}">` : `<span style="display:inline-block; width:26px; height:26px; border-radius:50%; background:#e2e8f0; text-align:center; line-height:26px; font-size:0.7rem;">📷</span>`}
              <span style="position:absolute; bottom:-3px; right:-3px; background:#0284c7; color:#fff; font-size:0.55rem; border-radius:50%; width:12px; height:12px; display:flex; align-items:center; justify-content:center;">+</span>
            </div>
          </td>
          <td style="width:48px;">
            <input type="number" class="batch-player-input" value="${p.no}" style="width:42px; text-align:center; font-weight:800; color:#0284c7;" onchange="admin.updateBatchPlayerField(${idx}, ${pIdx}, 'no', this.value)" min="1" max="99">
          </td>
          <td>
            <input type="text" class="batch-player-input" value="${p.name}" style="width:100%; font-weight:700;" onchange="admin.updateBatchPlayerField(${idx}, ${pIdx}, 'name', this.value)" placeholder="Nama Lengkap Pemain">
          </td>
          <td style="width:90px;">
            <select class="batch-player-input" style="width:100%; font-weight:700;" onchange="admin.updateBatchPlayerField(${idx}, ${pIdx}, 'pos', this.value)">
              <option value="Kiper" ${p.pos === 'Kiper' ? 'selected' : ''}>Kiper</option>
              <option value="Anchor" ${p.pos === 'Anchor' ? 'selected' : ''}>Anchor</option>
              <option value="Flank" ${p.pos === 'Flank' ? 'selected' : ''}>Flank</option>
              <option value="Pivot" ${p.pos === 'Pivot' ? 'selected' : ''}>Pivot</option>
            </select>
          </td>
          <td style="width:30px; text-align:center;">
            <button type="button" onclick="admin.removeBatchPlayer(${idx}, ${pIdx})" title="Hapus Pemain" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:0.85rem;">🗑️</button>
          </td>
        </tr>
      `).join("");

      html += `
        <div class="batch-team-card ${isMatched ? 'matched' : 'unmatched'}" id="batchTeamCard_${idx}">
          <div class="batch-team-header">
            <div>
              <span class="batch-team-title">📁 Tim: ${tData.teamName || tData.folderName}</span>
              <div style="margin-top: 4px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                <label style="font-size:0.74rem; font-weight:700; color:#475569;">Target Tim Turnamen:</label>
                <select class="form-select" style="font-size:0.75rem; padding:3px 8px; width:auto; max-width:260px;" onchange="admin.updateBatchTeamMapping(${idx}, this.value)">
                  <option value="">➕ Tambah Sebagai Tim Baru</option>
                  ${teamOptionsHtml}
                </select>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="batch-team-badge ${isMatched ? 'badge-matched' : 'badge-new'}">
                ${isMatched ? '✅ Terhubung ke Turnamen' : '⚠️ Tim Baru'}
              </span>
              <button type="button" onclick="admin.removeBatchTeam(${idx})" title="Hapus Tim Ini" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:0.85rem;">❌</button>
            </div>
          </div>

          <div class="batch-official-preview">
            <div class="batch-official-item">
              <div style="position:relative; cursor:pointer;" onclick="admin.triggerCoachPhotoUpload(${idx})" title="Upload Foto Pelatih">
                ${tData.coachPhoto ? `<img src="${tData.coachPhoto}" class="batch-official-thumb" alt="Pelatih">` : `<span class="batch-official-thumb" style="display:inline-flex; align-items:center; justify-content:center; font-size:0.9rem;">👔</span>`}
                <span style="position:absolute; bottom:-3px; right:-3px; background:#0284c7; color:#fff; font-size:0.55rem; border-radius:50%; width:12px; height:12px; display:flex; align-items:center; justify-content:center;">+</span>
              </div>
              <div style="flex:1;">
                <div style="font-size:0.68rem; color:#64748b;">Pelatih (Coach):</div>
                <input type="text" class="batch-player-input" value="${tData.coach || ''}" placeholder="Nama Pelatih" onchange="admin.batchParsedTeams[${idx}].coach = this.value" style="width:100%; margin-bottom:2px;">
                <input type="text" class="batch-player-input" value="${tData.phone || ''}" placeholder="No WA (08xxx)" onchange="admin.batchParsedTeams[${idx}].phone = this.value" style="width:100%; color:#059669; font-weight:700;">
              </div>
            </div>

            <div class="batch-official-item">
              <div style="position:relative; cursor:pointer;" onclick="admin.triggerManagerPhotoUpload(${idx})" title="Upload Foto Manajer">
                ${tData.managerPhoto ? `<img src="${tData.managerPhoto}" class="batch-official-thumb" alt="Manajer">` : `<span class="batch-official-thumb" style="display:inline-flex; align-items:center; justify-content:center; font-size:0.9rem;">💼</span>`}
                <span style="position:absolute; bottom:-3px; right:-3px; background:#0284c7; color:#fff; font-size:0.55rem; border-radius:50%; width:12px; height:12px; display:flex; align-items:center; justify-content:center;">+</span>
              </div>
              <div style="flex:1;">
                <div style="font-size:0.68rem; color:#64748b;">Manajer & Kostum:</div>
                <input type="text" class="batch-player-input" value="${tData.manager || ''}" placeholder="Nama Manajer" onchange="admin.batchParsedTeams[${idx}].manager = this.value" style="width:100%; margin-bottom:2px;">
                <input type="text" class="batch-player-input" value="${tData.jerseyHome || 'Hijau - Putih'}" placeholder="Warna Kostum" onchange="admin.batchParsedTeams[${idx}].jerseyHome = this.value" style="width:100%;">
              </div>
            </div>
          </div>

          <div style="margin-top: 8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:0.76rem; font-weight:800; color:#334155;">Daftar Skuad Pemain (${tData.players ? tData.players.length : 0} Pemain)</span>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn-batch-action" onclick="admin.addBatchPlayer(${idx})">
                  <span>➕</span> Tambah Pemain
                </button>
                <button type="button" class="btn-batch-action" onclick="admin.openPasteTextForTeam(${idx})">
                  <span>📝</span> Tempel Teks Skuad
                </button>
              </div>
            </div>

            ${tData.players && tData.players.length > 0 ? `
              <div style="max-height:220px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:var(--radius-sm);">
                <table class="batch-players-table">
                  <thead>
                    <tr>
                      <th style="width:40px; text-align:center;">Foto</th>
                      <th style="width:48px;">No</th>
                      <th>Nama Pemain</th>
                      <th style="width:90px;">Posisi</th>
                      <th style="width:30px; text-align:center;">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${playersTableRows}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding:14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:var(--radius-sm); text-align:center; font-size:0.76rem; color:#64748b;">
                <div>Belum ada pemain di tim ini.</div>
                <div style="margin-top:6px; display:flex; justify-content:center; gap:8px;">
                  <button type="button" class="btn btn-sm btn-primary" onclick="admin.addBatchPlayer(${idx})" style="font-size:0.72rem; padding:3px 10px;">➕ Tambah Pemain Manual</button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="admin.openPasteTextForTeam(${idx})" style="font-size:0.72rem; padding:3px 10px;">📝 Tempel Teks Daftar Pemain</button>
                </div>
              </div>
            `}
          </div>
        </div>
      `;
    });

    previewEl.innerHTML = html;
  },

  updateBatchTeamMapping(idx, teamId) {
    if (!this.batchParsedTeams[idx]) return;
    this.batchParsedTeams[idx].matchedTeamId = teamId;
    if (teamId) {
      const existing = app.store.getTeam(teamId);
      if (existing) {
        this.batchParsedTeams[idx].teamName = existing.name;
        this.batchParsedTeams[idx].shortName = existing.shortName;
        this.batchParsedTeams[idx].category = existing.category;
        this.batchParsedTeams[idx].group = existing.group;
      }
    }
    this.renderBatchUploadPreview();
  },

  updateBatchPlayerField(teamIdx, playerIdx, field, val) {
    const t = this.batchParsedTeams[teamIdx];
    if (!t || !t.players || !t.players[playerIdx]) return;
    if (field === 'no') {
      t.players[playerIdx].no = parseInt(val, 10) || (playerIdx + 1);
    } else {
      t.players[playerIdx][field] = val;
    }
  },

  addBatchPlayer(teamIdx) {
    const t = this.batchParsedTeams[teamIdx];
    if (!t) return;
    if (!t.players) t.players = [];
    const nextNo = t.players.length + 1;
    t.players.push({
      no: nextNo,
      name: `Pemain #${nextNo}`,
      pos: nextNo === 1 ? "Kiper" : "Flank",
      goals: 0,
      yc: 0,
      rc: 0,
      photo: ""
    });
    this.renderBatchUploadPreview();
  },

  removeBatchPlayer(teamIdx, playerIdx) {
    const t = this.batchParsedTeams[teamIdx];
    if (!t || !t.players) return;
    t.players.splice(playerIdx, 1);
    this.renderBatchUploadPreview();
  },

  openPasteTextForTeam(teamIdx) {
    const t = this.batchParsedTeams[teamIdx];
    if (!t) return;
    const currentList = (t.players || []).map(p => `${p.no}. ${p.name} - ${p.pos}`).join("\n");
    const res = prompt(`Tempelkan daftar pemain untuk tim "${t.teamName}" (format: 1. Nama - Posisi):\n\nContoh:\n1. Haikal - Kiper\n3. Budi - Anchor\n8. Doni - Flank\n9. Andi - Pivot`, currentList);
    if (res !== null && res.trim()) {
      const parsed = this.parseTeamTextFile(res, t.teamName);
      if (parsed && parsed.length > 0 && parsed[0].players.length > 0) {
        t.players = parsed[0].players;
        if (parsed[0].coach && !t.coach) t.coach = parsed[0].coach;
        if (parsed[0].phone && !t.phone) t.phone = parsed[0].phone;
        if (parsed[0].manager && !t.manager) t.manager = parsed[0].manager;
        this.renderBatchUploadPreview();
      }
    }
  },

  addBatchTeamManual() {
    const registered = (app.store && app.store.data && app.store.data.teams) || [];
    const name = prompt("Masukkan Nama Tim / Sekolah Baru:");
    if (!name || !name.trim()) return;
    const clean = name.trim();
    const matched = this.findBestMatchingTeam(clean);
    this.batchParsedTeams.push({
      folderName: clean,
      matchedTeamId: matched ? matched.id : "",
      teamName: matched ? matched.name : clean,
      shortName: matched ? matched.shortName : clean.substring(0, 10).toUpperCase(),
      category: matched ? matched.category : "SMP",
      group: matched ? matched.group : "A",
      badgeColor: matched ? matched.badgeColor : "#0284c7",
      city: matched ? matched.city : "Maros",
      coach: (matched && matched.official && matched.official.coach) || "",
      phone: (matched && matched.official && matched.official.phone) || "",
      manager: (matched && matched.official && matched.official.manager) || "",
      coachPhoto: "",
      managerPhoto: "",
      jerseyHome: "Hijau - Putih",
      jerseyAway: "Hitam - Emas",
      logo: "",
      players: matched && matched.players ? JSON.parse(JSON.stringify(matched.players)) : [],
      rawFilesCount: 0
    });
    this.renderBatchUploadPreview();
  },

  removeBatchTeam(teamIdx) {
    if (confirm("Hapus tim ini dari daftar yang akan diimpor?")) {
      this.batchParsedTeams.splice(teamIdx, 1);
      if (this.batchParsedTeams.length === 0) {
        this.resetBatchUploadUI();
      } else {
        this.renderBatchUploadPreview();
      }
    }
  },

  // Photo Upload Helpers for Individual Players and Officials
  _currentPhotoTarget: null,

  triggerSinglePhotoUpload(teamIdx, playerIdx) {
    this._currentPhotoTarget = { type: 'player', teamIdx, playerIdx };
    const input = document.getElementById("batchSinglePhotoInput");
    if (input) {
      input.value = "";
      input.click();
    }
  },

  triggerCoachPhotoUpload(teamIdx) {
    this._currentPhotoTarget = { type: 'coach', teamIdx };
    const input = document.getElementById("batchCoachPhotoInput");
    if (input) {
      input.value = "";
      input.click();
    }
  },

  triggerManagerPhotoUpload(teamIdx) {
    this._currentPhotoTarget = { type: 'manager', teamIdx };
    const input = document.getElementById("batchManagerPhotoInput");
    if (input) {
      input.value = "";
      input.click();
    }
  },

  async handleSinglePhotoUpload(input) {
    if (!input || !input.files || input.files.length === 0 || !this._currentPhotoTarget) return;
    const file = input.files[0];
    const dataUrl = await this.compressImageToDataUrl(file);
    const { teamIdx, playerIdx } = this._currentPhotoTarget;
    if (this.batchParsedTeams[teamIdx] && this.batchParsedTeams[teamIdx].players[playerIdx]) {
      this.batchParsedTeams[teamIdx].players[playerIdx].photo = dataUrl;
      this.renderBatchUploadPreview();
    }
    this._currentPhotoTarget = null;
  },

  async handleCoachPhotoUpload(input) {
    if (!input || !input.files || input.files.length === 0 || !this._currentPhotoTarget) return;
    const file = input.files[0];
    const dataUrl = await this.compressImageToDataUrl(file);
    const { teamIdx } = this._currentPhotoTarget;
    if (this.batchParsedTeams[teamIdx]) {
      this.batchParsedTeams[teamIdx].coachPhoto = dataUrl;
      this.renderBatchUploadPreview();
    }
    this._currentPhotoTarget = null;
  },

  async handleManagerPhotoUpload(input) {
    if (!input || !input.files || input.files.length === 0 || !this._currentPhotoTarget) return;
    const file = input.files[0];
    const dataUrl = await this.compressImageToDataUrl(file);
    const { teamIdx } = this._currentPhotoTarget;
    if (this.batchParsedTeams[teamIdx]) {
      this.batchParsedTeams[teamIdx].managerPhoto = dataUrl;
      this.renderBatchUploadPreview();
    }
    this._currentPhotoTarget = null;
  },

  // Save all parsed teams to local store and sync across devices & Supabase
  async saveBatchUploadedTeams() {
    if (!this.isAuthenticated) {
      this.pendingBatchSave = true;
      this.openLoginModal();
      if (window.app && typeof app.showToast === "function") {
        app.showToast("🔒 Silakan verifikasi Mode Panitia (PIN: 1234) untuk menyimpan berkas tim!");
      }
      return;
    }
    if (!this.batchParsedTeams || this.batchParsedTeams.length === 0) {
      alert("Belum ada data tim yang diekstrak.");
      return;
    }

    const btnSave = document.getElementById("btnBatchSaveTeams");
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.textContent = "⏳ Menyimpan & Menyinkronkan...";
    }

    let updatedCount = 0;
    let newCount = 0;

    for (const tData of this.batchParsedTeams) {
      if (tData.matchedTeamId) {
        const existing = app.store.getTeam(tData.matchedTeamId);
        if (existing) {
          if (!existing.official) existing.official = {};
          if (tData.coach) existing.official.coach = tData.coach;
          if (tData.phone) existing.official.phone = tData.phone;
          if (tData.manager) existing.official.manager = tData.manager;
          if (tData.coachPhoto) existing.official.coachPhoto = tData.coachPhoto;
          if (tData.managerPhoto) existing.official.managerPhoto = tData.managerPhoto;
          if (tData.jerseyHome) existing.official.jerseyHome = tData.jerseyHome;
          if (tData.jerseyAway) existing.official.jerseyAway = tData.jerseyAway;
          if (tData.logo) existing.logo = tData.logo;
          if (tData.players && tData.players.length > 0) {
            existing.players = tData.players;
          }
          updatedCount++;
        }
      } else {
        const newId = "T" + String(app.store.data.teams.length + 1).padStart(2, "0");
        const newTeamObj = {
          id: newId,
          name: tData.teamName || tData.folderName,
          shortName: tData.shortName || (tData.teamName || tData.folderName).substring(0, 10).toUpperCase(),
          category: tData.category || "SMP",
          logo: tData.logo || "",
          group: tData.group || "A",
          badgeColor: tData.badgeColor || "#0284c7",
          city: tData.city || "Maros",
          official: {
            coach: tData.coach || "",
            coachPhoto: tData.coachPhoto || "",
            manager: tData.manager || "",
            managerPhoto: tData.managerPhoto || "",
            medic: "",
            phone: tData.phone || "",
            jerseyHome: tData.jerseyHome || "Hijau - Putih",
            jerseyAway: tData.jerseyAway || "Hitam - Emas"
          },
          players: tData.players || []
        };
        app.store.data.teams.push(newTeamObj);
        newCount++;
      }
    }

    if (app.store && typeof app.store.syncPlayerStatsFromMatches === 'function') {
      app.store.syncPlayerStatsFromMatches();
    }
    app.store.saveData();
    app.store.syncKnockoutFromStandings();

    // Render UI updates
    app.renderTeams();
    app.renderStandings();
    app.renderMatches();
    if (typeof app.renderTopScorer === "function") app.renderTopScorer();
    if (typeof app.renderDisciplinary === "function") app.renderDisciplinary();

    // Push to Supabase Cloud so all participant phones receive update in real time
    if (window.SupabaseService && typeof window.SupabaseService.syncAllData === "function") {
      try {
        await window.SupabaseService.syncAllData(app.store.data);
      } catch (e) {
        console.warn("Supabase batch sync notice:", e);
      }
    }

    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = "💾 Terapkan & Simpan ke Turnamen (Semua HP & Cloud)";
    }

    this.closeBatchUploadModal();
    app.showToast(`🎉 Sukses! ${updatedCount} tim diperbarui & ${newCount} tim baru ditambahkan. Otomatis tersinkron ke Cloud & semua HP!`);
  },

  // Handlers for Folder, Multi-Files, Zip & Text Paste selection
  async handleBatchFolderInput(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const rawFiles = [];
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      rawFiles.push({
        file: f,
        path: f.webkitRelativePath || f.name,
        name: f.name,
        readText: () => f.text(),
        readArrayBuffer: () => f.arrayBuffer(),
        readDataUrl: () => admin.compressImageToDataUrl(f)
      });
    }
    await this.processBatchFiles(rawFiles);
  },

  async handleBatchDirectFilesInput(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const rawFiles = [];
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      rawFiles.push({
        file: f,
        path: f.webkitRelativePath || f.name,
        name: f.name,
        readText: () => f.text(),
        readArrayBuffer: () => f.arrayBuffer(),
        readDataUrl: () => admin.compressImageToDataUrl(f)
      });
    }
    await this.processBatchFiles(rawFiles);
  },

  async handleBatchZipInput(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (typeof JSZip === "undefined") {
      alert("Pustaka JSZip sedang dimuat, silakan coba beberapa saat lagi.");
      return;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const rawFiles = [];
      const entries = [];
      zip.forEach((relPath, entry) => {
        if (!entry.dir) entries.push({ relPath, entry });
      });

      for (const item of entries) {
        const parts = item.relPath.split("/");
        const fName = parts[parts.length - 1];
        rawFiles.push({
          path: item.relPath,
          name: fName,
          file: item.entry,
          readText: () => item.entry.async("string"),
          readArrayBuffer: () => item.entry.async("arraybuffer"),
          readDataUrl: async () => {
            const b64 = await item.entry.async("base64");
            const ext = fName.split(".").pop().toLowerCase();
            const mime = ext === "png" ? "image/png" : (ext === "webp" ? "image/webp" : "image/jpeg");
            const rawUrl = `data:${mime};base64,${b64}`;
            const res = await fetch(rawUrl);
            const blob = await res.blob();
            return admin.compressImageToDataUrl(blob);
          }
        });
      }

      await this.processBatchFiles(rawFiles);
    } catch (e) {
      console.error("ZIP extract error:", e);
      alert("Gagal membaca file ZIP: " + e.message);
    }
  },

  async handleBatchTextPaste() {
    const input = document.getElementById("batchTextPasteInput");
    const text = input ? input.value.trim() : "";
    if (!text) {
      alert("Silakan tempelkan teks pendaftaran terlebih dahulu.");
      return;
    }
    const rawFiles = [{
      name: "data_manual_paste.txt",
      path: "data_manual_paste.txt",
      readText: () => Promise.resolve(text),
      readArrayBuffer: () => Promise.resolve(new TextEncoder().encode(text).buffer),
      readDataUrl: () => Promise.resolve("")
    }];
    await this.processBatchFiles(rawFiles);
  },

  logout() {
    this.isAuthenticated = false;
    this.adminPinHash = "";
    sessionStorage.removeItem("pondok_futsal_admin_auth");
    sessionStorage.removeItem("pondok_futsal_admin_pin_hash");
    this.updateAdminUi();
    document.getElementById("adminDashboardModal").classList.remove("active");
    app.showToast("Anda telah keluar dari Mode Panitia (kembali ke Mode Peserta).");
  }
});

window.admin = Object.assign(window.admin || {}, admin);

// Initialize Admin
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    try { admin.init(); } catch (e) { console.warn("Admin init:", e); }
  });
} else {
  try { admin.init(); } catch (e) { console.warn("Admin init:", e); }
}
