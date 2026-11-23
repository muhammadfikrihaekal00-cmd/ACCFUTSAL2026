// app.js - Main Tournament Logic & UI Rendering
function _safeStorageGet(storage, key) {
  try { return storage.getItem(key); } catch (_) { return null; }
}
function _safeStorageSet(storage, key, value) {
  try { storage.setItem(key, value); } catch (_) { }
}
window.admin = window.admin || {
  isAuthenticated: (_safeStorageGet(sessionStorage, "pondok_futsal_admin_auth") === "true" || _safeStorageGet(localStorage, "pondok_futsal_admin_auth") === "true"),
  activeMatchId: null,
  activeQuickMatchId: null,
  adminPinHash: _safeStorageGet(sessionStorage, "pondok_futsal_admin_pin_hash") || _safeStorageGet(localStorage, "pondok_futsal_admin_pin_hash") || ""
};

class TournamentStore {
  constructor() {
    this.STORAGE_KEY = "acc_futsal_tournament_2026_cloud_v11";
    this.cleanObsoleteStorageKeys();
    try {
      this.data = this.loadData();
    } catch (e) {
      console.error("loadData fallback to empty schema:", e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try { this.syncPlayerStatsFromMatches(); } catch (e) { console.warn("syncPlayerStats notice:", e); }
    try { this.syncKnockoutFromStandings(); } catch (e) { console.warn("syncKnockout notice:", e); }
  }

  cleanObsoleteStorageKeys() {
    try {
      if (typeof localStorage === "undefined") return;
      const currentKey = this.STORAGE_KEY;
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;

        // 1. Bersihkan versi cache lama (v1 s.d v8, dll.)
        if (k.startsWith("acc_futsal_tournament_2026_") && k !== currentKey && k !== (currentKey + "_min")) {
          keysToRemove.push(k);
        }
        // 2. Bersihkan cache lama/legacy yang memakan kuota besar
        if (k.startsWith("pondok_futsal_tournament_data") || k.startsWith("acc_tournament_data_")) {
          keysToRemove.push(k);
        }
        // 3. Bersihkan redundansi cache ganda yang memakan MB besar di localStorage
        if (k === "acc_cached_teams_data" || k === "acc_tournament_sponsors_backup" || k === "acc_matches_cleaned_v854") {
          keysToRemove.push(k);
        }
      }

      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) { }
      });
    } catch (_) { }
  }

  createSlimStoragePayload(data) {
    if (!data || typeof data !== "object") return {};
    const stripHeavyImg = (str) => (typeof str === "string" && str.startsWith("data:image")) ? "" : (str || "");

    return {
      ...data,
      sponsors: data.sponsors ? {
        platinum: (data.sponsors.platinum || []).map(s => ({ ...s, image: stripHeavyImg(s.image) })),
        gold: (data.sponsors.gold || []).map(s => ({ ...s, image: stripHeavyImg(s.image) })),
        media: (data.sponsors.media || []).map(s => ({ ...s, image: stripHeavyImg(s.image) }))
      } : undefined,
      moments: (data.moments || []).map(m => ({ ...m, image: stripHeavyImg(m.image) })),
      homeData: data.homeData ? {
        ...data.homeData,
        moments: (data.homeData.moments || []).map(m => ({ ...m, image: stripHeavyImg(m.image) }))
      } : undefined,
      teams: (data.teams || []).map(t => ({
        ...t,
        logo: stripHeavyImg(t.logo),
        official: t.official ? {
          ...t.official,
          coachPhoto: stripHeavyImg(t.official.coachPhoto),
          managerPhoto: stripHeavyImg(t.official.managerPhoto),
          medicPhoto: stripHeavyImg(t.official.medicPhoto)
        } : {},
        players: (t.players || []).map(p => ({
          ...p,
          photo: stripHeavyImg(p.photo)
        }))
      }))
    };
  }

  normalizeTeam(t, idx = 0) {
    if (!t || typeof t !== "object") return null;
    const id = t.id || ("T" + String(idx + 1).padStart(2, "0"));
    const numId = parseInt(String(id).replace(/\D/g, ""), 10) || (idx + 1);
    const name = (typeof t.name === "string" && t.name.trim()) ? t.name : ("Tim " + id);
    const shortName = (typeof t.shortName === "string" && t.shortName.trim())
      ? t.shortName
      : ((typeof t.short_name === "string" && t.short_name.trim()) ? t.short_name : name.substring(0, 10).toUpperCase());
    const offSrc = (t.official && typeof t.official === "object") ? t.official : {};
    const official = {
      coach: offSrc.coach || t.official_coach || t.coach || "",
      manager: offSrc.manager || t.official_manager || t.manager || "",
      medic: offSrc.medic || t.official_medic || t.medic || "",
      phone: "",
      jerseyHome: offSrc.jerseyHome || t.official_jersey_home || t.jerseyHome || "",
      jerseyAway: offSrc.jerseyAway || t.official_jersey_away || t.jerseyAway || "",
      coachPhoto: offSrc.coachPhoto || t.coach_photo || t.coachPhoto || "",
      managerPhoto: offSrc.managerPhoto || t.manager_photo || t.managerPhoto || ""
    };
    const players = Array.isArray(t.players) ? t.players.filter(p => p && typeof p === "object").map((p, pIdx) => ({
      no: (p.no !== undefined && p.no !== null && p.no !== "") ? p.no : (pIdx + 1),
      name: (typeof p.name === "string") ? p.name : ("Pemain " + (pIdx + 1)),
      pos: p.pos || "Flank",
      goals: parseInt(p.goals, 10) || 0,
      yc: parseInt(p.yc, 10) || 0,
      rc: parseInt(p.rc, 10) || 0,
      photo: (typeof p.photo === "string") ? p.photo : ""
    })) : [];

    return {
      ...t,
      id,
      name,
      shortName,
      category: t.category || (numId >= 17 ? "SD" : (numId >= 9 && numId <= 16 ? "SMP" : "SMP")),
      group: t.group || t.group_letter || "A",
      badgeColor: t.badgeColor || t.badge_color || "#0284c7",
      city: (typeof t.city === "string") ? t.city : "",
      instansi: (typeof t.instansi === "string") ? t.instansi.trim() : "",
      logo: (typeof t.logo === "string") ? t.logo : "",
      official,
      players
    };
  }

  isInvalidMatchId(id) {
    if (!id) return true;
    const cleanId = String(id).trim();
    if (cleanId === 'M_SMP_23') return true; // Phantom duplicate
    if (/^T\d+$/i.test(cleanId) || /^team_/i.test(cleanId)) return true; // Team IDs (e.g. T01..T32) or team registries are never match IDs!
    if (cleanId.includes('registry') || cleanId.includes('config') || cleanId === 'team_meta_registry' || cleanId === 'team_logos_registry') return true;
    return false;
  }

  cleanDuplicateMatches(matches) {
    if (!Array.isArray(matches)) return [];
    const seenMatchups = new Map();
    const clean = [];
    for (const m of matches) {
      if (!m || !m.id || this.isInvalidMatchId(m.id)) continue;
      if (m.homeId && m.awayId) {
        const cat = (m.category || "SMP").toUpperCase();
        const isGroup = (m.stage === "group" || !m.stage);
        const pairKey = isGroup
          ? `GRP_${cat}_` + [m.homeId, m.awayId].sort().join("_")
          : [m.homeId, m.awayId].sort().join("_") + "_" + cat + "_" + (m.stage || "") + "_" + (m.date || "");
        if (seenMatchups.has(pairKey)) {
          const existing = seenMatchups.get(pairKey);
          // Prioritaskan match yang memiliki format ID standar turnamen resmi
          if (!existing.id.startsWith("M_") && m.id.startsWith("M_")) {
            const idx = clean.indexOf(existing);
            if (idx !== -1) clean[idx] = m;
            seenMatchups.set(pairKey, m);
          }
          continue; // Singkirkan duplikat palsu
        }
        seenMatchups.set(pairKey, m);
      }
      clean.push(m);
    }
    return clean;
  }

  normalizeMatch(m, teams = []) {
    if (!m || typeof m !== "object") return null;
    const id = String(m.id || "").trim();
    if (this.isInvalidMatchId(id)) {
      return null;
    }

    const homeId = m.homeId !== undefined ? m.homeId : (m.home_id !== undefined && m.home_id !== null ? m.home_id : "");
    const awayId = m.awayId !== undefined ? m.awayId : (m.away_id !== undefined && m.away_id !== null ? m.away_id : "");
    const rawStage = String(m.stage || "").toLowerCase().trim();
    const roundName = m.roundName !== undefined ? m.roundName : (m.round_name || "");
    const rawGroup = m.group !== undefined ? m.group : (m.group_letter || "");

    let knockoutKey = m.knockoutKey || null;
    const hPlace = String(m.homePlaceholder !== undefined ? m.homePlaceholder : (m.home_placeholder || "")).toLowerCase().trim();
    const aPlace = String(m.awayPlaceholder !== undefined ? m.awayPlaceholder : (m.away_placeholder || "")).toLowerCase().trim();

    const isKnockout = (
      rawStage === "knockout" ||
      /(qf|sf|3rd|final)/i.test(rawStage) ||
      Boolean(knockoutKey && knockoutKey !== "group") ||
      /(QF|SF|3RD|FINAL|BRONZE)/i.test(id) ||
      /(perempat|quarter|semi|final|juara\s*3|peringkat\s*3|8\s*besar)/i.test(String(roundName || "")) ||
      /(juara\s*grup|runner-up\s*grup|pemenang\s*qf|kalah\s*semi|pemenang\s*semi)/i.test(hPlace) ||
      /(juara\s*grup|runner-up\s*grup|pemenang\s*qf|kalah\s*semi|pemenang\s*semi)/i.test(aPlace) ||
      (rawStage !== "group" && (!rawGroup || rawGroup === "null" || rawGroup === "-"))
    );

    const stage = isKnockout ? "knockout" : "group";
    const group = isKnockout ? null : (rawGroup && rawGroup !== "null" && rawGroup !== "-" ? rawGroup : null);

    if (isKnockout && !knockoutKey) {
      if (rawStage === "3rd" || /(3rd|bronze)/i.test(id) || /juara\s*3|peringkat\s*3/i.test(roundName) || /kalah\s*semi/i.test(hPlace)) knockoutKey = "3rd";
      else if (rawStage === "final" || (/final/i.test(id) && !/qf|sf/i.test(id)) || /grand\s*final/i.test(roundName) || /pemenang\s*semi/i.test(hPlace)) knockoutKey = "final";
      else if (rawStage.startsWith("sf") || /sf/i.test(id) || /semi/i.test(roundName) || /pemenang\s*qf/i.test(hPlace)) {
        if (/sf1|\b1\b/i.test(id) || /semifinal\s*1/i.test(roundName) || /qf\s*1/i.test(hPlace)) knockoutKey = "sf1";
        else if (/sf2|\b2\b/i.test(id) || /semifinal\s*2/i.test(roundName) || /qf\s*3/i.test(hPlace)) knockoutKey = "sf2";
        else knockoutKey = "sf1";
      } else if (rawStage.startsWith("qf") || /qf/i.test(id) || /perempat|quarter|8\s*besar/i.test(roundName) || /juara\s*grup/i.test(hPlace)) {
        if (/qf1|\b1\b/i.test(id) || /perempat\s*final\s*1/i.test(roundName) || (/grup\s*a/i.test(hPlace) && /grup\s*b/i.test(aPlace))) knockoutKey = "qf1";
        else if (/qf2|\b2\b/i.test(id) || /perempat\s*final\s*2/i.test(roundName) || (/grup\s*b/i.test(hPlace) && /grup\s*a/i.test(aPlace))) knockoutKey = "qf2";
        else if (/qf3|\b3\b/i.test(id) || /perempat\s*final\s*3/i.test(roundName) || (/grup\s*c/i.test(hPlace) && /grup\s*d/i.test(aPlace))) knockoutKey = "qf3";
        else if (/qf4|\b4\b/i.test(id) || /perempat\s*final\s*4/i.test(roundName) || (/grup\s*d/i.test(hPlace) && /grup\s*c/i.test(aPlace))) knockoutKey = "qf4";
        else knockoutKey = "qf1";
      }
    }

    const status = m.status || "upcoming";

    // Infer category secara dinamis dari properti match, ID/nama babak, atau kategori tim
    let category = m.category || "";
    if (!category) {
      if (/_SD\b/i.test(id) || /_SD_/i.test(id) || /\bSD\b/i.test(roundName) || /_SD$/i.test(id)) {
        category = "SD";
      } else if (/_SMP\b/i.test(id) || /_SMP_/i.test(id) || /\bSMP\b/i.test(roundName) || /_SMP$/i.test(id)) {
        category = "SMP";
      } else {
        const hTeam = homeId ? teams.find(t => t.id === homeId) : null;
        const aTeam = awayId ? teams.find(t => t.id === awayId) : null;
        if (hTeam && hTeam.category) category = hTeam.category;
        else if (aTeam && aTeam.category) category = aTeam.category;
        else {
          category = (window.app && window.app.currentCategory && window.app.currentCategory !== "all") ? window.app.currentCategory : "SMP";
        }
      }
    }

    const rHome = m.homeScore !== undefined ? m.homeScore : (m.home_score !== undefined ? m.home_score : null);
    const rAway = m.awayScore !== undefined ? m.awayScore : (m.away_score !== undefined ? m.away_score : null);
    const isUpcoming = status === "upcoming" || status === "scheduled";
    const homeScore = isUpcoming ? null : (rHome !== null && rHome !== undefined ? parseInt(rHome, 10) : 0);
    const awayScore = isUpcoming ? null : (rAway !== null && rAway !== undefined ? parseInt(rAway, 10) : 0);

    const dateStr = m.date || "";
    let day = (m.day !== undefined && m.day !== null) ? parseInt(m.day, 10) : ((m.matchday !== undefined && m.matchday !== null) ? parseInt(m.matchday, 10) : null);
    if (!day && dateStr) {
      if (/hari\s*1|matchday\s*1|\b22\b/i.test(dateStr)) day = 1;
      else if (/hari\s*2|matchday\s*2|\b23\b/i.test(dateStr)) day = 2;
      else if (/hari\s*3|matchday\s*3|\b24\b/i.test(dateStr)) day = 3;
      else if (/hari\s*4|matchday\s*4|\b25\b/i.test(dateStr)) day = 4;
      else if (/hari\s*5|matchday\s*5|\b26\b/i.test(dateStr)) day = 5;
      else if (/hari\s*6|matchday\s*6|\b27\b/i.test(dateStr)) day = 6;
      else if (/hari\s*7|matchday\s*7|\b28\b/i.test(dateStr)) day = 7;
      else if (/hari\s*8|matchday\s*8|\b29\b/i.test(dateStr)) day = 8;
    }
    if (!day) {
      if (stage === "qf") day = 6;
      else if (stage === "sf") day = 7;
      else if (stage === "3rd" || stage === "final") day = 8;
    }

    const pitch = m.pitch || m.venue || "Lapangan Utama";
    const pitchNum = m.pitchNum || (/2/.test(pitch) ? 2 : 1);

    // Ambil dan pulihkan metadata Starting 5, pergantian pemain, dan fouls
    let cleanCards = Array.isArray(m.cards) ? [...m.cards] : [];
    let lineup = m.lineup || null;
    let substitutions = Array.isArray(m.substitutions) ? m.substitutions : [];
    let homeFouls = typeof m.homeFouls === "number" ? m.homeFouls : (m.home_fouls !== undefined ? parseInt(m.home_fouls, 10) || 0 : 0);
    let awayFouls = typeof m.awayFouls === "number" ? m.awayFouls : (m.away_fouls !== undefined ? parseInt(m.away_fouls, 10) || 0 : 0);

    let isTimerPaused = m.isTimerPaused !== undefined ? Boolean(m.isTimerPaused) : false;
    let liveElapsedSec = typeof m.liveElapsedSec === "number" ? m.liveElapsedSec : null;
    let liveClockDisplay = m.liveClockDisplay || null;

    const metaCard = cleanCards.find(c => c && c._meta);
    if (metaCard) {
      if (metaCard.knockoutKey && !knockoutKey) knockoutKey = metaCard.knockoutKey;
      if (metaCard.lineup && !lineup) lineup = metaCard.lineup;
      if (Array.isArray(metaCard.substitutions) && substitutions.length === 0) substitutions = metaCard.substitutions;
      if (typeof metaCard.homeFouls === "number") homeFouls = metaCard.homeFouls;
      if (typeof metaCard.awayFouls === "number") awayFouls = metaCard.awayFouls;
      if (metaCard.isTimerPaused !== undefined) isTimerPaused = Boolean(metaCard.isTimerPaused);
      if (typeof metaCard.liveElapsedSec === "number") liveElapsedSec = metaCard.liveElapsedSec;
      if (metaCard.liveClockDisplay) liveClockDisplay = metaCard.liveClockDisplay;
    }
    // Filter ketat agar metadata atau kartu tanpa nama pemain tidak pernah masuk ke cards
    cleanCards = cleanCards.filter(c => c && !c._meta && c.player && c.player !== 'undefined' && c.player !== 'null' && (c.type === 'yellow' || c.type === 'red'));

    // Auto-heal group & roundName jika kedua tim bertanding berasal dari grup yang sama
    let finalGroup = group || null;
    let finalRoundName = roundName;
    if (stage === "group" && homeId && awayId && Array.isArray(teams) && teams.length > 0) {
      const hTeam = teams.find(t => t.id === homeId);
      const aTeam = teams.find(t => t.id === awayId);
      if (hTeam && aTeam) {
        const hGrp = hTeam.group || hTeam.group_letter;
        const aGrp = aTeam.group || aTeam.group_letter;
        if (hGrp && aGrp && hGrp === aGrp && finalGroup !== hGrp) {
          finalGroup = hGrp;
          finalRoundName = `Grup ${hGrp} (${category || 'SMP'})`;
        }
      }
    }

    const normalized = {
      id,
      category,
      group: finalGroup,
      stage,
      knockoutKey,
      roundName: finalRoundName,
      day: day || 1,
      matchday: (m.matchday !== undefined && m.matchday !== null) ? parseInt(m.matchday, 10) : (day || 1),
      date: dateStr,
      time: m.time || "",
      pitch,
      pitchNum,
      homeId: homeId || "",
      awayId: awayId || "",
      homePlaceholder: m.homePlaceholder !== undefined ? m.homePlaceholder : (m.home_placeholder || ""),
      awayPlaceholder: m.awayPlaceholder !== undefined ? m.awayPlaceholder : (m.away_placeholder || ""),
      isManualTeam: m.isManualTeam !== undefined ? Boolean(m.isManualTeam) : Boolean(homeId || awayId),
      status,
      homeScore,
      awayScore,
      homeScoreLive: homeScore,
      awayScoreLive: awayScore,
      liveMinute: status === "live" ? (m.liveMinute || (m.minute_live ? `${parseInt(m.minute_live, 10) || 1}'` : "1'")) : "",
      isTimerPaused,
      liveElapsedSec,
      liveClockDisplay,
      scorers: Array.isArray(m.scorers) ? m.scorers : [],
      cards: cleanCards,
      lineup: lineup || null,
      substitutions: substitutions,
      homeFouls: homeFouls,
      awayFouls: awayFouls
    };

    if (m.penaltyHomeScore !== undefined || m.penalty_home_score !== undefined) {
      normalized.penaltyHomeScore = m.penaltyHomeScore !== undefined ? m.penaltyHomeScore : m.penalty_home_score;
    }
    if (m.penaltyAwayScore !== undefined || m.penalty_away_score !== undefined) {
      normalized.penaltyAwayScore = m.penaltyAwayScore !== undefined ? m.penaltyAwayScore : m.penalty_away_score;
    }
    if (m.penaltyWinner !== undefined || m.penalty_winner !== undefined) {
      normalized.penaltyWinner = m.penaltyWinner !== undefined ? m.penaltyWinner : m.penalty_winner;
    }
    if (m.liveStartedAt && !isTimerPaused) normalized.liveStartedAt = m.liveStartedAt;
    return normalized;
  }

  loadData() {
    let data = null;
    const saved = _safeStorageGet(localStorage, this.STORAGE_KEY);
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch (e) {
        console.warn("Cache lokal tidak valid, menunggu data online Supabase:", e);
      }
    }

    const base = JSON.parse(JSON.stringify(DEFAULT_DATA));
    if (!data || typeof data !== "object") {
      data = base;
    }

    // Pastikan struktur minimal selalu valid (tanpa pernah menyuntikkan data tim/laga/pemain tetap!)
    if (!data.config || typeof data.config !== "object") {
      data.config = base.config;
    } else {
      data.config = { ...base.config, ...data.config };
    }
    // Jamin regulasi petunjuk teknis 11 Bab (A s.d K) selalu memakai versi resmi mutakhir dan tidak tertimpa cache usang
    const officialRules = (base.config && base.config.rulesText) ? base.config.rulesText : "";
    if (officialRules && (!data.config.rulesText || data.config.rulesText.length < (officialRules.length - 200) || !data.config.rulesText.includes("### K. PENGHARGAAN"))) {
      data.config.rulesText = officialRules;
    }
    if (data.config && (!data.config.tournamentName || data.config.tournamentName.includes('ACC "Al-Fayyadh') || data.config.tournamentName === 'ACC 2026')) {
      data.config.tournamentName = 'Al-Fayyadh Champions Cup 2026';
    }
    if (data.config) {
      let d = String(data.config.dates || "");
      if (!d || d.includes("28") || d.includes("26") || d !== "22 - 29 November 2026") {
        data.config.dates = "22 - 29 November 2026";
      }
      if (!data.config.contactCommittee || data.config.contactCommittee.includes("Harun") || data.config.contactCommittee.includes("0812-9876-5432")) {
        data.config.contactCommittee = "0859-3322-8817 (Ust. Ahmadi)";
      }
    }
    if (!Array.isArray(data.teams)) data.teams = [];
    if (!Array.isArray(data.matches)) data.matches = [];

    // Hapus data WhatsApp official untuk seluruh tim secara permanen
    data.teams.forEach(t => {
      if (t.official) t.official.phone = "";
      t.official_phone = "";
      t.phone = "";
    });

    // Bersihkan cache jadwal dummy lama (M01, T04, dll) satu kali saja saat migrasi
    if (!_safeStorageGet(localStorage, "acc_matches_cleaned_v854")) {
      data.matches = [];
      _safeStorageSet(localStorage, "acc_matches_cleaned_v854", "true");
    }
    if (!Array.isArray(data.moments)) data.moments = [];
    if (!data.sponsors || typeof data.sponsors !== "object") {
      data.sponsors = JSON.parse(JSON.stringify(base.sponsors || { platinum: [], gold: [], media: [] }));
    }
    const hasAnySponsor = (data.sponsors.platinum?.length || 0) + (data.sponsors.gold?.length || 0) + (data.sponsors.media?.length || 0);
    const backupSponsors = _safeStorageGet(localStorage, "acc_tournament_sponsors_backup");
    if (backupSponsors) {
      try {
        const parsedBackup = JSON.parse(backupSponsors);
        const countBackup = (parsedBackup.platinum?.length || 0) + (parsedBackup.gold?.length || 0) + (parsedBackup.media?.length || 0);
        if (countBackup > hasAnySponsor) {
          data.sponsors = parsedBackup;
        }
      } catch (_) { }
    }
    const currentSponsorCount = (data.sponsors.platinum?.length || 0) + (data.sponsors.gold?.length || 0) + (data.sponsors.media?.length || 0);
    if (currentSponsorCount === 0 && base.sponsors && (base.sponsors.platinum?.length || 0) > 0) {
      data.sponsors = JSON.parse(JSON.stringify(base.sponsors));
    }
    if (!data.homeData || typeof data.homeData !== "object") {
      data.homeData = { mvp: null, mvps: [], news: [], moments: [], sponsors: { platinum: [], gold: [], media: [] } };
    }
    if (!Array.isArray(data.homeData.mvps)) {
      data.homeData.mvps = (data.homeData.mvp && data.homeData.mvp.name) ? [data.homeData.mvp] : [];
    }
    if (!Array.isArray(data.homeData.news)) data.homeData.news = [];
    if (!Array.isArray(data.homeData.moments)) data.homeData.moments = [];

    // Normalisasi struktur tim & laga dari cache agar tidak pernah crash (tanpa mengubah isi data!)
    data.teams = data.teams.map((t, idx) => this.normalizeTeam(t, idx)).filter(Boolean);
    data.matches = this.cleanDuplicateMatches(
      data.matches
        .filter(m => m && m.id && !this.isInvalidMatchId(m.id))
        .map(m => this.normalizeMatch(m, data.teams))
        .filter(Boolean)
    );

    return data;
  }

  saveData() {
    try {
      const slim = this.createSlimStoragePayload(this.data);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(slim));
    } catch (e) {
      // Tangani QuotaExceededError dengan pembersihan & pelepasan memori aman
      try {
        this.cleanObsoleteStorageKeys();
        localStorage.removeItem(this.STORAGE_KEY);
        const minimal = {
          matches: this.data.matches || [],
          settings: this.data.settings || {},
          groups: this.data.groups || {}
        };
        localStorage.setItem(this.STORAGE_KEY + "_min", JSON.stringify(minimal));
      } catch (innerErr) { }
    }
  }

  resetData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData();
    this.syncKnockoutFromStandings();
  }

  syncPlayerStatsFromMatches() {
    if (!this.data || !this.data.teams || !this.data.matches) return;

    let hasChanged = false;

    // Fast O(M * (S + C)) indexing to eliminate heavy nested loops
    const statsMap = new Map();
    this.data.matches.forEach(m => {
      const matchScorers = (Array.isArray(m.scorers) && m.scorers.length > 0) ? m.scorers : (Array.isArray(m.goals) ? m.goals : []);
      if (matchScorers.length > 0) {
        matchScorers.forEach(s => {
          const tId = s.team || "";
          const sName = (s.player || '').toLowerCase().trim();
          const isOg = Boolean(s.isOwnGoal || s.ownGoal || sName.includes('bunuh diri') || sName.includes('own goal') || sName.includes('(gbd)') || sName.includes('[og]'));
          if (sName && !isOg) {
            const key = `${tId}:${sName}`;
            let entry = statsMap.get(key);
            if (!entry) { entry = { goals: 0, assists: 0, yc: 0, rc: 0 }; statsMap.set(key, entry); }
            entry.goals += 1;
          }
          if (s.assist) {
            const aName = (s.assist || '').toLowerCase().trim();
            if (aName) {
              const key = `${tId}:${aName}`;
              let entry = statsMap.get(key);
              if (!entry) { entry = { goals: 0, assists: 0, yc: 0, rc: 0 }; statsMap.set(key, entry); }
              entry.assists += 1;
            }
          }
        });
      }

      if (m.cards && Array.isArray(m.cards)) {
        m.cards.forEach(c => {
          if (c._meta) return;
          const tId = c.team || "";
          const cName = (c.player || '').toLowerCase().trim();
          if (cName) {
            const key = `${tId}:${cName}`;
            let entry = statsMap.get(key);
            if (!entry) { entry = { goals: 0, assists: 0, yc: 0, rc: 0 }; statsMap.set(key, entry); }
            if (c.type === 'yellow') entry.yc += 1;
            if (c.type === 'red') entry.rc += 1;
          }
        });
      }
    });

    this.data.teams.forEach(t => {
      if (!t.players || !Array.isArray(t.players)) return;

      t.players.forEach(p => {
        const cleanPName = (p.name || '').toLowerCase().trim();
        let matchGoals = 0;
        let matchAssists = 0;
        let matchYc = 0;
        let matchRc = 0;

        // O(1) direct lookup first
        const directKey = `${t.id}:${cleanPName}`;
        const entry = statsMap.get(directKey);
        if (entry) {
          matchGoals = entry.goals;
          matchAssists = entry.assists;
          matchYc = entry.yc;
          matchRc = entry.rc;
        } else {
          // Fallback scan only if direct match not found
          const tPrefix = t.id + ":";
          const tNamePrefix = (t.name || "").toLowerCase() + ":";
          const tShortPrefix = (t.shortName || "").toLowerCase() + ":";
          for (const [k, v] of statsMap.entries()) {
            if (k.startsWith(tPrefix) || k.startsWith(":") || (t.name && k.startsWith(tNamePrefix)) || (t.shortName && k.startsWith(tShortPrefix))) {
              const scorerName = k.split(":")[1] || "";
              if (scorerName === cleanPName || (p.no && scorerName.includes(`#${p.no}`)) || (cleanPName && (scorerName.includes(cleanPName) || cleanPName.includes(scorerName)))) {
                matchGoals += v.goals;
                matchAssists += v.assists;
                matchYc += v.yc;
                matchRc += v.rc;
              }
            }
          }
        }

        const newGoals = Math.max(parseInt(p.goals, 10) || 0, matchGoals);
        const newAssists = Math.max(parseInt(p.assists, 10) || 0, matchAssists);
        if (p.goals !== newGoals || p.assists !== newAssists || p.yc !== matchYc || p.rc !== matchRc) {
          p.goals = newGoals;
          p.assists = newAssists;
          p.yc = matchYc;
          p.rc = matchRc;
          hasChanged = true;
        }
      });
    });

    // Auto-heal & Sinkronisasi: Pastikan skor pertandingan selalu konsisten dengan catatan gol m.scorers
    this.data.matches.forEach(m => {
      if ((m.status === 'live' || m.status === 'finished') && m.scorers && Array.isArray(m.scorers) && m.scorers.length > 0) {
        const hGoals = m.scorers.filter(s => s.team === m.homeId).length;
        const aGoals = m.scorers.filter(s => s.team === m.awayId).length;
        const newHome = Math.max(parseInt(m.homeScore, 10) || 0, hGoals);
        const newAway = Math.max(parseInt(m.awayScore, 10) || 0, aGoals);
        if (m.homeScore !== newHome || m.awayScore !== newAway) {
          m.homeScore = newHome;
          m.awayScore = newAway;
          m.homeScoreLive = newHome;
          m.awayScoreLive = newAway;
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      this.saveData();
    }
  }

  getTeam(id) {
    if (!id || !this.data || !this.data.teams) return null;
    const strId = String(id).trim().toLowerCase();
    return this.data.teams.find(t =>
      t.id === id ||
      String(t.id).trim().toLowerCase() === strId ||
      (t.name && t.name.trim().toLowerCase() === strId) ||
      (t.shortName && t.shortName.trim().toLowerCase() === strId)
    ) || null;
  }

  getMatch(id) {
    if (!this.data || !this.data.matches) return null;
    return this.data.matches.find(m => m.id === id) || null;
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
        m.status === "finished"
    );

    groupMatches.forEach(m => {
      const hScore = m.homeScore ?? 0;
      const aScore = m.awayScore ?? 0;

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

    // Sort by: Pts DESC, GD DESC, GF DESC, H2H, Fair-Play
    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      // Head-to-Head: skor di pertandingan langsung antara kedua tim
      const h2h = groupMatches.find(m =>
        (m.homeId === a.team.id && m.awayId === b.team.id) ||
        (m.homeId === b.team.id && m.awayId === a.team.id)
      );
      if (h2h && h2h.status === "finished") {
        const aGoals = h2h.homeId === a.team.id ? (h2h.homeScore || 0) : (h2h.awayScore || 0);
        const bGoals = h2h.homeId === b.team.id ? (h2h.homeScore || 0) : (h2h.awayScore || 0);
        if (bGoals !== aGoals) return bGoals - aGoals;
      }
      // Fair-play: kuning*1 + merah*3, lebih rendah = lebih baik
      const getCards = (st) => {
        let yellow = 0, red = 0;
        this.data.matches.forEach(m => {
          if (m.stage !== "group" || m.group !== groupLetter) return;
          if (m.status !== "finished") return;
          if (m.homeId !== st.team.id && m.awayId !== st.team.id) return;
          (m.cards || []).forEach(c => {
            if (c.team !== st.team.id && c.team !== st.team.name) return;
            if (c.type === "yellow") yellow++;
            else if (c.type === "red") red++;
          });
        });
        return yellow * 1 + red * 3;
      };
      const fpA = getCards(a);
      const fpB = getCards(b);
      if (fpA !== fpB) return fpA - fpB; // lebih sedikit = lebih baik
      return 0; // undian koin
    });
  }

  // Cek apakah pertandingan adalah Babak Gugur
  isKnockoutMatch(m) {
    if (!m) return false;
    const stage = String(m.stage || '').toLowerCase().trim();
    if (stage === 'knockout' || stage === 'qf' || stage === 'sf' || stage === '3rd' || stage === 'final') return true;
    if (m.knockoutKey && m.knockoutKey !== 'group') return true;
    const id = String(m.id || '').toUpperCase().trim();
    if (/(QF|SF|3RD|FINAL|BRONZE)/i.test(id)) return true;
    const round = String(m.roundName || '').toLowerCase().trim();
    if (/(perempat|quarter|semi|final|juara\s*3|peringkat\s*3|8\s*besar)/i.test(round)) return true;
    const hPlace = String(m.homePlaceholder || '').toLowerCase();
    const aPlace = String(m.awayPlaceholder || '').toLowerCase();
    if (/(juara\s*grup|runner-up\s*grup|pemenang\s*qf|kalah\s*semi|pemenang\s*semi)/i.test(hPlace) ||
      /(juara\s*grup|runner-up\s*grup|pemenang\s*qf|kalah\s*semi|pemenang\s*semi)/i.test(aPlace)) return true;
    if (m.stage !== 'group' && (!m.group || m.group === 'null' || m.group === '-')) return true;
    return false;
  }

  // Klasifikasi Jenis Laga Fase Gugur (qf, sf, 3rd, final)
  classifyKnockoutStage(m) {
    if (!m) return null;
    const stage = String(m.stage || '').toLowerCase().trim();
    const round = String(m.roundName || '').toLowerCase().trim();
    const id = String(m.id || '').toUpperCase().trim();
    const key = String(m.knockoutKey || '').toLowerCase().trim();

    // 1. Perebutan Juara 3 (Cek lebih awal karena teks round sering mengandung kata 'final')
    if (stage === '3rd' || stage === 'bronze' || stage === 'third' || key === '3rd' ||
      round.includes('juara 3') || round.includes('peringkat 3') || round.includes('3rd') ||
      id.includes('3RD') || id.includes('BRONZE')) {
      return '3rd';
    }

    // 2. Grand Final (Puncak)
    if (stage === 'final' || stage === 'grand_final' || key === 'final' ||
      round.includes('grand final') || round.includes('puncak') ||
      (round.includes('final') && !round.includes('perempat') && !round.includes('semi')) ||
      (id.includes('FINAL') && !id.includes('QF') && !id.includes('SF'))) {
      return 'final';
    }

    // 3. Semifinal (4 Besar)
    if (stage === 'sf' || stage === 'semifinal' || stage === 'semi' || key.startsWith('sf') ||
      round.includes('semifinal') || round.includes('semi-final') || round.includes('semi final') ||
      id.includes('SF')) {
      return 'sf';
    }

    // 4. Perempat Final / Quarterfinal (8 Besar)
    if (stage === 'qf' || stage === 'quarterfinal' || stage === 'quarter' || stage === '8besar' || key.startsWith('qf') ||
      round.includes('perempat') || round.includes('quarter') || round.includes('8 besar') ||
      id.includes('QF')) {
      return 'qf';
    }

    return null;
  }

  // Klasifikasi Kunci Spesifik Slot Fase Gugur (qf1, qf2, qf3, qf4, sf1, sf2, 3rd, final)
  classifyKnockoutKey(m) {
    if (!m) return null;
    const k = String(m.knockoutKey || '').toLowerCase().trim();
    if (['qf1', 'qf2', 'qf3', 'qf4', 'sf1', 'sf2', '3rd', 'final'].includes(k)) return k;

    const stage = this.classifyKnockoutStage(m);
    if (!stage) return null;
    if (stage === '3rd') return '3rd';
    if (stage === 'final') return 'final';

    const id = String(m.id || '').toUpperCase().trim();
    const round = String(m.roundName || '').toLowerCase().trim();
    const hPlace = String(m.homePlaceholder || '').toLowerCase().trim();
    const aPlace = String(m.awayPlaceholder || '').toLowerCase().trim();

    if (stage === 'sf') {
      if (id.includes('SF1') || round.includes('semifinal 1') || round.includes('sf 1') || round.includes('sf1') || hPlace.includes('qf 1') || hPlace.includes('qf1')) return 'sf1';
      if (id.includes('SF2') || round.includes('semifinal 2') || round.includes('sf 2') || round.includes('sf2') || hPlace.includes('qf 3') || hPlace.includes('qf3')) return 'sf2';
      return 'sf1';
    }

    if (stage === 'qf') {
      if (id.includes('QF1') || round.includes('perempat final 1') || round.includes('qf 1') || round.includes('qf1') || (hPlace.includes('grup a') && aPlace.includes('grup b'))) return 'qf1';
      if (id.includes('QF2') || round.includes('perempat final 2') || round.includes('qf 2') || round.includes('qf2') || (hPlace.includes('grup b') && aPlace.includes('grup a'))) return 'qf2';
      if (id.includes('QF3') || round.includes('perempat final 3') || round.includes('qf 3') || round.includes('qf3') || (hPlace.includes('grup c') && aPlace.includes('grup d'))) return 'qf3';
      if (id.includes('QF4') || round.includes('perempat final 4') || round.includes('qf 4') || round.includes('qf4') || (hPlace.includes('grup d') && aPlace.includes('grup c'))) return 'qf4';
      return null;
    }

    return null;
  }

  // Nama Resmi Babak Pertandingan (Bebas dari 'Grup null'!)
  getMatchStageName(m) {
    if (!m) return "";
    const isKnockout = this.isKnockoutMatch(m);
    if (isKnockout) {
      const key = this.classifyKnockoutKey(m);
      if (key === 'qf1') return 'Perempat Final 1';
      if (key === 'qf2') return 'Perempat Final 2';
      if (key === 'qf3') return 'Perempat Final 3';
      if (key === 'qf4') return 'Perempat Final 4';
      if (key === 'sf1') return 'Semifinal 1';
      if (key === 'sf2') return 'Semifinal 2';
      if (key === '3rd') return 'Perebutan Juara 3';
      if (key === 'final') return 'Grand Final';

      const stage = this.classifyKnockoutStage(m);
      if (stage === 'qf') return 'Perempat Final';
      if (stage === 'sf') return 'Semifinal';
      if (stage === '3rd') return 'Perebutan Juara 3';
      if (stage === 'final') return 'Grand Final';

      if (m.roundName && !m.roundName.includes('null') && !m.roundName.toLowerCase().startsWith('grup')) {
        return m.roundName.replace(/\s*\((SMP|SD)\)/i, '');
      }
      return 'Babak Gugur';
    }

    if (m.group && String(m.group).trim() !== '' && String(m.group).toLowerCase() !== 'null' && String(m.group).toLowerCase() !== 'undefined' && String(m.group).trim() !== '-') {
      return `Grup ${String(m.group).trim().toUpperCase()}`;
    }
    return (m.stage && m.stage !== 'group') ? 'Babak Gugur' : 'Fase Grup';
  }

  // Helper Pengurutan Waktu Pertandingan (Tanggal & Jam Laga)
  parseTimeToMinutes(timeStr, dateStr = "") {
    if (!timeStr) return 999999;
    let minutes = 999999;
    const m = String(timeStr).match(/(\d{1,2})[:.](\d{2})/);
    if (m) {
      minutes = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    }
    let dayOffset = 0;
    if (dateStr) {
      const dMatch = String(dateStr).match(/(\d{1,2})/);
      if (dMatch) {
        dayOffset = parseInt(dMatch[1], 10) * 24 * 60;
      }
    }
    return dayOffset + minutes;
  }

  // Automatically sync Group Winners & Runners-Up to Knockout (4 Grup SMP & 4 Grup SD)
  syncKnockoutFromStandings() {
    // Helper: hanya isi QF jika SEMUA pertandingan grup sudah "finished"
    const isGroupCompleted = (groupLetter, category) => {
      const gm = this.data.matches.filter(m =>
        m.stage === "group" && m.group === groupLetter &&
        (!category || category === "all" || (m.category || "SMP") === category)
      );
      return gm.length > 0 && gm.every(m => m.status === "finished");
    };

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

    const syncQFMatch = (m, cat, homeGroup, isHomeWinner, awayGroup, isAwayWinner, homeStandings, awayStandings, knockoutKey, roundPrefix) => {
      if (!m) return;
      m.stage = "knockout";
      m.category = cat;
      m.group = null;
      if (knockoutKey) m.knockoutKey = knockoutKey;
      m.roundName = `${roundPrefix} (${cat})`;

      const homeDone = isGroupCompleted(homeGroup, cat);
      const awayDone = isGroupCompleted(awayGroup, cat);

      const homeIdx = isHomeWinner ? 0 : 1;
      const awayIdx = isAwayWinner ? 0 : 1;

      m.homePlaceholder = `Juara Grup ${homeGroup}`;
      m.awayPlaceholder = `Runner-up Grup ${awayGroup}`;

      // Respect manual team assignment if panitia explicitly set it
      if (m.isManualTeam) {
        return;
      }

      if (homeDone && homeStandings[homeIdx] && homeStandings[homeIdx].team) {
        m.homeId = homeStandings[homeIdx].team.id;
      } else if (!m.isManualTeam) {
        m.homeId = "";
      }

      if (awayDone && awayStandings[awayIdx] && awayStandings[awayIdx].team) {
        m.awayId = awayStandings[awayIdx].team.id;
      } else if (!m.isManualTeam) {
        m.awayId = "";
      }

      // Jika salah satu atau kedua tim belum pasti lolos, kosongkan data laga
      if (!m.homeId || !m.awayId) {
        m.status = "upcoming";
        m.homeScore = null;
        m.awayScore = null;
        m.homeScoreLive = null;
        m.awayScoreLive = null;
        m.scorers = [];
        m.cards = [];
        m.penaltyHomeScore = null;
        m.penaltyAwayScore = null;
        m.penaltyWinner = null;
      }
    };

    // Helper untuk mengambil laga fase gugur berdasarkan klasifikasi stage dan urutan jamnya di Jadwal & Skor
    const getSortedKnockoutMatches = (cat, stageType) => {
      const matches = (this.data.matches || []).filter(m => {
        const mCat = m.category || (m.id && m.id.endsWith("_" + cat) ? cat : "SMP");
        return mCat === cat && this.classifyKnockoutStage(m) === stageType;
      });
      return matches.sort((a, b) => {
        const tA = this.parseTimeToMinutes(a.time, a.date);
        const tB = this.parseTimeToMinutes(b.time, b.date);
        if (tA !== tB) return tA - tB;
        return String(a.id).localeCompare(String(b.id));
      });
    };

    // Helper untuk mencari laga yang cocok untuk slot tertentu (qf1, qf2, qf3, qf4, sf1, sf2, 3rd, final)
    const findKnockoutSlotMatch = (cat, key, fallbackList, fallbackIndex, fallbackId) => {
      const allCat = (this.data.matches || []).filter(m => {
        const mCat = m.category || (m.id && m.id.endsWith("_" + cat) ? cat : "SMP");
        return mCat === cat;
      });

      // 1. Cari yang explicit knockoutKey sama persis
      let found = allCat.find(m => m.knockoutKey === key);
      if (found) return found;

      // 2. Cari yang terklasifikasi ke key ini
      found = allCat.find(m => this.classifyKnockoutKey(m) === key);
      if (found) return found;

      // 3. Fallback ke urutan jam laga (fallbackList pada index fallbackIndex)
      if (fallbackList && fallbackList[fallbackIndex]) {
        return fallbackList[fallbackIndex];
      }

      // 4. Fallback ke ID resmi default (QF1_SMP, dll)
      return allCat.find(m => m.id === fallbackId || m.id === fallbackId.replace("_" + cat, ""));
    };

    // 1. QF SMP (Berdasarkan klasifikasi & urutan spesifik turnamen ACC 2026)
    // Urutan: QF1 (1A vs 2B), QF2 (1C vs 2D), QF3 (1B vs 2A), QF4 (1D vs 2C)
    const qfMatches_SMP = getSortedKnockoutMatches("SMP", "qf");
    const qf1_smp = findKnockoutSlotMatch("SMP", "qf1", qfMatches_SMP, 0, "QF1_SMP");
    const qf2_smp = findKnockoutSlotMatch("SMP", "qf2", qfMatches_SMP, 1, "QF2_SMP");
    const qf3_smp = findKnockoutSlotMatch("SMP", "qf3", qfMatches_SMP, 2, "QF3_SMP");
    const qf4_smp = findKnockoutSlotMatch("SMP", "qf4", qfMatches_SMP, 3, "QF4_SMP");

    syncQFMatch(qf1_smp, "SMP", "A", true, "B", false, stA_SMP, stB_SMP, "qf1", "Perempat Final 1");
    syncQFMatch(qf2_smp, "SMP", "B", true, "A", false, stB_SMP, stA_SMP, "qf2", "Perempat Final 2");
    syncQFMatch(qf3_smp, "SMP", "C", true, "D", false, stC_SMP, stD_SMP, "qf3", "Perempat Final 3");
    syncQFMatch(qf4_smp, "SMP", "D", true, "C", false, stD_SMP, stC_SMP, "qf4", "Perempat Final 4");

    // 2. QF SD (Berdasarkan klasifikasi & urutan spesifik turnamen ACC 2026)
    const qfMatches_SD = getSortedKnockoutMatches("SD", "qf");
    const qf1_sd = findKnockoutSlotMatch("SD", "qf1", qfMatches_SD, 0, "QF1_SD");
    const qf2_sd = findKnockoutSlotMatch("SD", "qf2", qfMatches_SD, 1, "QF2_SD");
    const qf3_sd = findKnockoutSlotMatch("SD", "qf3", qfMatches_SD, 2, "QF3_SD");
    const qf4_sd = findKnockoutSlotMatch("SD", "qf4", qfMatches_SD, 3, "QF4_SD");

    syncQFMatch(qf1_sd, "SD", "A", true, "B", false, stA_SD, stB_SD, "qf1", "Perempat Final 1");
    syncQFMatch(qf2_sd, "SD", "B", true, "A", false, stB_SD, stA_SD, "qf2", "Perempat Final 2");
    syncQFMatch(qf3_sd, "SD", "C", true, "D", false, stC_SD, stD_SD, "qf3", "Perempat Final 3");
    syncQFMatch(qf4_sd, "SD", "D", true, "C", false, stD_SD, stC_SD, "qf4", "Perempat Final 4");

    // Helper to get winner & loser from finished match (with Penalty Shootout support)
    const getWinnerId = (m) => {
      if (!m || m.status !== "finished" || m.homeScore === null || m.awayScore === null) return null;
      if (m.homeScore > m.awayScore) return m.homeId;
      if (m.awayScore > m.homeScore) return m.awayId;
      if (m.penaltyWinner) {
        if (m.penaltyWinner === m.homeId) return m.homeId;
        if (m.penaltyWinner === m.awayId) return m.awayId;
      }
      if (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined) {
        if (m.penaltyHomeScore > m.penaltyAwayScore) return m.homeId;
        if (m.penaltyAwayScore > m.penaltyHomeScore) return m.awayId;
      }
      return null;
    };
    const getLoserId = (m) => {
      if (!m || m.status !== "finished" || m.homeScore === null || m.awayScore === null) return null;
      if (m.homeScore > m.awayScore) return m.awayId;
      if (m.awayScore > m.homeScore) return m.homeId;
      if (m.penaltyWinner) {
        if (m.penaltyWinner === m.homeId) return m.awayId;
        if (m.penaltyWinner === m.awayId) return m.homeId;
      }
      if (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined) {
        if (m.penaltyHomeScore > m.penaltyAwayScore) return m.awayId;
        if (m.penaltyAwayScore > m.penaltyHomeScore) return m.homeId;
      }
      return null;
    };

    const syncDownstream = (m, mHomeSource, isHomeWinner, mAwaySource, isAwayWinner, hPlaceholder, aPlaceholder, knockoutKey, roundPrefix, cat) => {
      if (!m) return;
      m.stage = "knockout";
      m.group = null;
      if (cat) m.category = cat;
      if (knockoutKey) m.knockoutKey = knockoutKey;
      m.roundName = `${roundPrefix} (${m.category || 'SMP'})`;
      m.homePlaceholder = hPlaceholder;
      m.awayPlaceholder = aPlaceholder;

      if (m.isManualTeam) {
        return;
      }

      const wHome = mHomeSource ? (isHomeWinner ? getWinnerId(mHomeSource) : getLoserId(mHomeSource)) : null;
      const wAway = mAwaySource ? (isAwayWinner ? getWinnerId(mAwaySource) : getLoserId(mAwaySource)) : null;

      if (!m.isManualTeam) {
        m.homeId = wHome || "";
        m.awayId = wAway || "";
      }

      if (!m.homeId || !m.awayId) {
        m.status = "upcoming";
        m.homeScore = null;
        m.awayScore = null;
        m.homeScoreLive = null;
        m.awayScoreLive = null;
        m.scorers = [];
        m.cards = [];
        m.penaltyHomeScore = null;
        m.penaltyAwayScore = null;
        m.penaltyWinner = null;
      }
    };

    // 3. SF, Final, 3RD SMP
    // SF1: W(QF1) vs W(QF2), SF2: W(QF3) vs W(QF4)
    // Final: W(SF1) vs W(SF2), 3rd: L(SF1) vs L(SF2)
    const sfMatches_SMP = getSortedKnockoutMatches("SMP", "sf");
    const sf1_smp = findKnockoutSlotMatch("SMP", "sf1", sfMatches_SMP, 0, "SF1_SMP");
    const sf2_smp = findKnockoutSlotMatch("SMP", "sf2", sfMatches_SMP, 1, "SF2_SMP");

    const finalMatches_SMP = getSortedKnockoutMatches("SMP", "final");
    const final_smp = findKnockoutSlotMatch("SMP", "final", finalMatches_SMP, 0, "FINAL_SMP");

    const thirdMatches_SMP = getSortedKnockoutMatches("SMP", "3rd");
    const third_smp = findKnockoutSlotMatch("SMP", "3rd", thirdMatches_SMP, 0, "3RD_SMP");

    syncDownstream(sf1_smp, qf1_smp, true, qf2_smp, true, "Pemenang QF 1", "Pemenang QF 2", "sf1", "Semifinal 1", "SMP");
    syncDownstream(sf2_smp, qf3_smp, true, qf4_smp, true, "Pemenang QF 3", "Pemenang QF 4", "sf2", "Semifinal 2", "SMP");
    syncDownstream(final_smp, sf1_smp, true, sf2_smp, true, "Pemenang Semifinal 1", "Pemenang Semifinal 2", "final", "Grand Final", "SMP");
    syncDownstream(third_smp, sf1_smp, false, sf2_smp, false, "Kalah Semifinal 1", "Kalah Semifinal 2", "3rd", "Perebutan Juara 3", "SMP");

    // 4. SF, Final, 3RD SD
    const sfMatches_SD = getSortedKnockoutMatches("SD", "sf");
    const sf1_sd = findKnockoutSlotMatch("SD", "sf1", sfMatches_SD, 0, "SF1_SD");
    const sf2_sd = findKnockoutSlotMatch("SD", "sf2", sfMatches_SD, 1, "SF2_SD");

    const finalMatches_SD = getSortedKnockoutMatches("SD", "final");
    const final_sd = findKnockoutSlotMatch("SD", "final", finalMatches_SD, 0, "FINAL_SD");

    const thirdMatches_SD = getSortedKnockoutMatches("SD", "3rd");
    const third_sd = findKnockoutSlotMatch("SD", "3rd", thirdMatches_SD, 0, "3RD_SD");

    syncDownstream(sf1_sd, qf1_sd, true, qf2_sd, true, "Pemenang QF 1", "Pemenang QF 2", "sf1", "Semifinal 1", "SD");
    syncDownstream(sf2_sd, qf3_sd, true, qf4_sd, true, "Pemenang QF 3", "Pemenang QF 4", "sf2", "Semifinal 2", "SD");
    syncDownstream(final_sd, sf1_sd, true, sf2_sd, true, "Pemenang Semifinal 1", "Pemenang Semifinal 2", "final", "Grand Final", "SD");
    syncDownstream(third_sd, sf1_sd, false, sf2_sd, false, "Kalah Semifinal 1", "Kalah Semifinal 2", "3rd", "Perebutan Juara 3", "SD");
  }

  // Calculate Disciplinary status (Yellow/Red Cards across all matches)
  getDisciplinaryRecords(category = null) {
    const playerStats = {};
    const targetCat = (category && category !== "all") ? category.toUpperCase() : null;
    let teams = this.data.teams || [];
    if (targetCat) {
      teams = teams.filter(t => (t.category || "SMP").toUpperCase() === targetCat);
    }

    teams.forEach(t => {
      if (!t || !Array.isArray(t.players)) return;
      const off = (t.official && typeof t.official === "object") ? t.official : {};
      t.players.forEach(p => {
        if (!p) return;
        const key = `${t.id}-${p.name}`;
        playerStats[key] = {
          teamId: t.id,
          teamName: t.name || "",
          category: t.category || "SMP",
          manager: off.manager || "",
          managerPhone: off.phone || "",
          playerNo: p.no,
          playerName: p.name || "",
          pos: p.pos || "Flank",
          photo: p.photo || "",
          badgeColor: t.badgeColor || "#0284c7",
          yellowCount: 0,
          redCount: 0,
          cardsHistory: []
        };
      });
    });

    const catMatches = (this.data.matches || []).filter(m => {
      if (!m || this.isInvalidMatchId(m.id)) return false;
      if (!targetCat) return true;
      return (m.category || "SMP").toUpperCase() === targetCat;
    });

    catMatches.forEach(m => {
      if (m.cards && m.cards.length > 0) {
        m.cards.forEach(c => {
          let target = playerStats[`${c.team}-${c.player}`];
          if (!target) {
            const cardName = (c.player || '').toLowerCase().trim();
            const foundKey = Object.keys(playerStats).find(k => {
              const stat = playerStats[k];
              const isTeam = !c.team || c.team === stat.teamId || c.team === stat.teamName;
              const pName = (stat.playerName || '').toLowerCase().trim();
              const byNo = stat.playerNo && (cardName === `#${stat.playerNo}` || cardName.endsWith(`(#${stat.playerNo})`));
              return isTeam && (cardName === pName || cardName === `${pName} (#${stat.playerNo})` || byNo);
            });
            if (foundKey) {
              target = playerStats[foundKey];
            } else if (c.player) {
              const tObj = (this.data.teams || []).find(t => t.id === c.team || t.name === c.team);
              const pCat = tObj ? (tObj.category || "SMP") : (m.category || "SMP");
              if (!targetCat || pCat.toUpperCase() === targetCat) {
                target = playerStats[`${c.team}-${c.player}`] = {
                  teamId: c.team || "",
                  teamName: tObj ? tObj.name : (c.team || ""),
                  category: pCat,
                  badgeColor: tObj ? tObj.badgeColor : "#0284c7",
                  playerNo: "",
                  playerName: c.player,
                  yellowCount: 0,
                  redCount: 0,
                  cardsHistory: []
                };
              }
            }
          }

          if (target) {
            if (c.type === "yellow") {
              target.yellowCount += 1;
            } else if (c.type === "red") {
              target.redCount += 1;
            }
            target.cardsHistory.push({
              matchId: m.id,
              type: c.type,
              minute: c.minute
            });
          }
        });
      }
    });

    return Object.values(playerStats)
      .filter(p => (p.yellowCount > 0 || p.redCount > 0) && (!targetCat || (p.category || "SMP").toUpperCase() === targetCat))
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
    const targetCat = (category && category !== "all") ? category.toUpperCase() : null;
    let teams = this.data.teams || [];
    if (targetCat) {
      teams = teams.filter(t => (t.category || "SMP").toUpperCase() === targetCat);
    }

    teams.forEach(t => {
      if (!t || !Array.isArray(t.players)) return;
      t.players.forEach(p => {
        if (!p) return;
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

    const catMatches = (this.data.matches || []).filter(m => {
      if (!m || this.isInvalidMatchId(m.id)) return false;
      if (!targetCat) return true;
      return (m.category || "SMP").toUpperCase() === targetCat;
    });

    catMatches.forEach(m => {
      const matchScorers = (Array.isArray(m.scorers) && m.scorers.length > 0) ? m.scorers : (Array.isArray(m.goals) ? m.goals : []);
      if (matchScorers.length > 0) {
        matchScorers.forEach(s => {
          if (!s) return;
          const isOg = Boolean(s.isOwnGoal || s.ownGoal || String(s.player || '').toLowerCase().includes('bunuh diri') || String(s.player || '').toLowerCase().includes('own goal') || String(s.player || '').toLowerCase().includes('(gbd)') || String(s.player || '').toLowerCase().includes('[og]'));
          if (isOg) return;
          const key = `${s.team}-${s.player}`;
          if (scorers[key]) {
            scorers[key].goals += 1;
          } else {
            const cleanP = (s.player || '').toLowerCase().trim();
            const foundKey = Object.keys(scorers).find(k => {
              const sc = scorers[k];
              const isT = !s.team || sc.teamId === s.team || sc.teamName === s.team;
              return isT && (sc.playerName.toLowerCase().trim() === cleanP || (sc.playerNo && cleanP.includes(`#${sc.playerNo}`)) || (cleanP.length > 3 && sc.playerName.toLowerCase().trim().includes(cleanP)));
            });
            if (foundKey) {
              scorers[foundKey].goals += 1;
            } else {
              const tObj = (this.data.teams || []).find(t => t.id === s.team || t.name === s.team);
              const pCat = tObj ? (tObj.category || "SMP") : (m.category || "SMP");
              if (!targetCat || pCat.toUpperCase() === targetCat) {
                scorers[key] = {
                  teamId: s.team || "",
                  teamName: tObj ? tObj.name : (s.team || ""),
                  category: pCat,
                  badgeColor: tObj ? tObj.badgeColor : "#0284c7",
                  playerNo: s.no || "",
                  playerName: s.player,
                  pos: "Pemain",
                  photo: "",
                  goals: 1
                };
              }
            }
          }
        });
      }
    });

    return Object.values(scorers)
      .filter(s => s.goals > 0 && (!targetCat || (s.category || "SMP").toUpperCase() === targetCat))
      .sort((a, b) => b.goals - a.goals);
  }

  // Calculate Top Assists
  getTopAssistsList(category = null) {
    const assisters = {};
    const targetCat = (category && category !== "all") ? category.toUpperCase() : null;
    let teams = this.data.teams || [];
    if (targetCat) {
      teams = teams.filter(t => (t.category || "SMP").toUpperCase() === targetCat);
    }

    teams.forEach(t => {
      if (!t || !Array.isArray(t.players)) return;
      t.players.forEach(p => {
        if (!p) return;
        const key = `${t.id}-${p.name}`;
        assisters[key] = {
          teamId: t.id,
          teamName: t.name,
          category: t.category || "SMP",
          badgeColor: t.badgeColor,
          playerNo: p.no,
          playerName: p.name,
          pos: p.pos,
          photo: p.photo || "",
          assists: parseInt(p.assists || p.assist, 10) || 0,
          goals: parseInt(p.goals, 10) || 0
        };
      });
    });

    const catMatches = (this.data.matches || []).filter(m => {
      if (!m || this.isInvalidMatchId(m.id)) return false;
      if (!targetCat) return true;
      return (m.category || "SMP").toUpperCase() === targetCat;
    });

    catMatches.forEach(m => {
      if (m.scorers && Array.isArray(m.scorers)) {
        m.scorers.forEach(s => {
          if (s.assist) {
            const key = `${s.team}-${s.assist}`;
            if (assisters[key]) {
              assisters[key].assists += 1;
            } else {
              const cleanA = (s.assist || '').toLowerCase().trim();
              const foundKey = Object.keys(assisters).find(k => {
                const item = assisters[k];
                const isTeam = !s.team || s.team === item.teamId || s.team === item.teamName;
                return isTeam && (item.playerName.toLowerCase().trim() === cleanA || (item.playerNo && cleanA.includes(`#${item.playerNo}`)));
              });
              if (foundKey) {
                assisters[foundKey].assists += 1;
              } else {
                const tObj = (this.data.teams || []).find(t => t.id === s.team || t.name === s.team);
                const pCat = tObj ? (tObj.category || "SMP") : (m.category || "SMP");
                if (!targetCat || pCat.toUpperCase() === targetCat) {
                  assisters[key] = {
                    teamId: s.team || "",
                    teamName: tObj ? tObj.name : (s.team || ""),
                    category: pCat,
                    badgeColor: tObj ? tObj.badgeColor : "#0284c7",
                    playerNo: "",
                    playerName: s.assist,
                    pos: "Pemain",
                    photo: "",
                    assists: 1,
                    goals: 0
                  };
                }
              }
            }
          }
        });
      }
    });

    return Object.values(assisters)
      .filter(a => a.assists > 0 && (!targetCat || (a.category || "SMP").toUpperCase() === targetCat))
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  }
}

// Global UI Manager (Unified single instance with window.app, ZERO TDZ!)
var app = window.app = Object.assign(window.app || {}, {
  store: null,
  currentTab: "home", // Default sekarang membuka tab Beranda Utama
  currentStatsTab: "scorers", // Default sub-tab di statistik: scorers | assists | yellow | red
  currentCategory: _safeStorageGet(localStorage, "acc_active_category") || "SMP",
  filterDay: "all",
  filterTeam: "all",
  filterGroup: "all",
  filterStatus: "all", // "all", "live", "upcoming", "finished"
  splashTimeout: null,
  currentTheme: "light", // Default ramah dengan white space luas
  currentViewMode: "participant", // "participant" atau "operator"
  currentDrawCat: "SMP",
  drawState: null,
  isDrawingSpinning: false,
  isAutoDrawing: false,
  _autoDrawTimer: null,
  _audioCtx: null,

  isAdmin() {
    return Boolean(window.admin && window.admin.isAuthenticated === true);
  },

  getMatchStageName(m) {
    if (this.store && typeof this.store.getMatchStageName === 'function') {
      return this.store.getMatchStageName(m);
    }
    if (!m) return "";
    if (m.roundName && !m.roundName.includes("null") && !m.roundName.toLowerCase().startsWith("grup")) {
      return m.roundName.replace(/\s*\((SMP|SD)\)/i, '');
    }
    const grp = String(m.group || '').trim();
    if (m.stage === "group" && grp && grp.toLowerCase() !== "null" && grp !== "-" && grp.toLowerCase() !== "undefined") {
      return `Grup ${grp.toUpperCase()}`;
    }
    return (m.stage && m.stage !== "group") ? "Babak Gugur" : "Fase Grup";
  },

  ensureStore() {
    if (!this.store) {
      try {
        this.store = new TournamentStore();
      } catch (e) {
        console.error("Fallback TournamentStore init:", e);
        this.store = {
          STORAGE_KEY: "acc_futsal_tournament_2026_cloud_v7",
          data: JSON.parse(JSON.stringify(DEFAULT_DATA)),
          saveData() { },
          getTeam(id) { return (this.data.teams || []).find(t => t.id === id) || null; },
          getMatch(id) { return (this.data.matches || []).find(m => m.id === id) || null; },
          syncPlayerStatsFromMatches() { },
          syncKnockoutFromStandings() { },
          normalizeTeam(t) { return t; },
          normalizeMatch(m) { return m; },
          calculateGroupStandings() { return []; },
          getDisciplinaryRecords() { return []; },
          getTopScorers() { return []; }
        };
      }
    }
    return this.store;
  },

  init() {
    try {
      const early = document.getElementById("earlyRouteStyle");
      if (early) early.remove();
      const earlyFloat = document.getElementById("earlyFloatStyle");
      if (earlyFloat) earlyFloat.remove();
    } catch (_) { }
    this.ensureStore();
    if (this.store && this.store.data && Array.isArray(this.store.data.matches)) {
      const origCount = this.store.data.matches.length;
      this.store.data.matches = this.store.data.matches.filter(m => m && m.id && !this.store.isInvalidMatchId(m.id));
      if (this.store.data.matches.length !== origCount) {
        this.store.saveData();
      }
    }
    if (this.store && this.store.data && this.store.data.config) {
      if (this.store.data.config.dates !== "22 - 29 November 2026") {
        this.store.data.config.dates = "22 - 29 November 2026";
        this.store.saveData();
      }
    }
    try { this.purgeAllTeamWhatsApp(); } catch (e) { console.warn("Purge WA init:", e); }
    try { this.initSplashScreen(); } catch (e) { console.warn("Splash init:", e); }
    try { this.initThemeAndViewMode(); } catch (e) { console.warn("Theme init:", e); }
    try { this.updateCategoryUI(); } catch (e) { console.warn("Category init:", e); }
    try { this.renderHeader(); } catch (e) { console.warn("Header init:", e); }
    try { this.renderLiveStreamHero(); } catch (e) { console.warn("LiveStream init:", e); }
    try { this.bindEvents(); } catch (e) { console.warn("Events init:", e); }
    try { this.updateAdminVisibility(); } catch (e) { }

    // Tentukan kategori dan rute tab AKTIF terlebih dahulu sebelum render view pertama kali
    // Menjamin saat reload / refresh, TIDAK AKAN PERNAH terjadi flash atau loncatan layar beranda
    if (window._pendingCat) {
      try { this.setCategory(window._pendingCat, false); } catch (e) { }
    }
    if (window._pendingTab) {
      try { this.currentTab = window._pendingTab; } catch (e) { }
    } else {
      try { this.parseCurrentRoute(false); } catch (e) { }
    }

    try { this.renderCurrentView(); } catch (e) { console.warn("View init:", e); }
    try { this.initFloatingCategorySwitcher(); } catch (e) { console.warn("FloatingCat init:", e); }

    // DOM-level guarantee (Critical)
    try {
      const tickerEl = document.getElementById("tickerText");
      if (tickerEl && tickerEl.textContent && (tickerEl.textContent.includes("ð") || tickerEl.textContent.includes("†") || !tickerEl.textContent.trim().startsWith("🏆"))) {
        tickerEl.textContent = "🏆 " + tickerEl.textContent.replace(/^.*Selamat Datang/i, "Selamat Datang").trim();
      }
    } catch (e) { }

    // Defer heavy non-critical background subsystems to idle time to maximize FCP & cut TBT to near zero
    const deferBackgroundInit = (fn) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(fn, { timeout: 2500 });
      } else {
        setTimeout(fn, 120);
      }
    };

    deferBackgroundInit(() => {
      try {
        this.connectDrawToTournament("SMP", false);
        this.connectDrawToTournament("SD", false);
      } catch (e) { }
      try { this.initPwa(); } catch (e) { console.warn("PWA init:", e); }
      try { this.initGlobalLiveMatchTimer(); } catch (e) { console.warn("LiveTimer init:", e); }
      try { this.initNetworkStatusListeners(); } catch (e) { console.warn("Network init:", e); }
      try { this.initScrollReveal(); } catch (e) { console.warn("ScrollReveal init:", e); }
      try { this.initHomeSlideNavigation(); } catch (e) { console.warn("SlideNav init:", e); }
      try { this.updateFloatingLiveNotice(); } catch (e) { console.warn("FloatingLive init:", e); }
      try { this.initSupabaseSync(); } catch (e) { console.warn("Supabase init:", e); }

      // Cek jika ada draft pengisian tim / folder yang sempat terhenti (non-blocking)
      try {
        if (window.admin && typeof window.admin.restorePendingDraftsOnBoot === 'function') {
          window.admin.restorePendingDraftsOnBoot();
        }
      } catch (_) { }
    });
  },

  purgeAllTeamWhatsApp() {
    if (!this.store || !this.store.data || !Array.isArray(this.store.data.teams)) return;
    let changed = false;
    this.store.data.teams.forEach(t => {
      if (t.official && t.official.phone) {
        t.official.phone = "";
        changed = true;
      }
      if (t.official_phone) {
        t.official_phone = "";
        changed = true;
      }
      if (t.phone) {
        t.phone = "";
        changed = true;
      }
    });
    if (changed) {
      this.store.saveData();
      if (window.SupabaseService && typeof window.SupabaseService.syncTeams === "function") {
        window.SupabaseService.syncTeams(this.store.data.teams).catch(() => { });
      }
    }
  },

  cleanWhatsAppNumber(phone) {
    if (!phone) return "";
    let clean = phone.toString().replace(/[^0-9]/g, "");
    if (clean.startsWith("62")) {
      return clean;
    }
    if (clean.startsWith("0")) {
      return "62" + clean.slice(1);
    }
    if (clean.length > 5) {
      return "62" + clean;
    }
    return clean;
  },

  getWhatsAppUrl(phone, text = "") {
    const clean = this.cleanWhatsAppNumber(phone);
    if (!clean) return "#";
    const query = text ? `?text=${encodeURIComponent(text)}` : "";
    return `https://wa.me/${clean}${query}`;
  },

  initNetworkStatusListeners() {
    const updateStatus = (isOnline, customMsg = null) => {
      const badge = document.getElementById("cloudStatusBadge");
      const dot = document.getElementById("cloudStatusDot");
      const text = document.getElementById("cloudStatusText");
      if (!badge && !dot) return;

      if (isOnline) {
        if (badge) {
          badge.classList.remove("offline");
          badge.title = "Lampu Hijau: Cloud Supabase Terhubung & Realtime Aktif (Klik untuk cek)";
        }
        if (text) text.textContent = customMsg || "Cloud Aktif";
        if (dot) {
          dot.style.background = "#10b981";
          dot.style.boxShadow = "0 0 8px #10b981, 0 0 14px rgba(16, 185, 129, 0.5)";
        }
      } else {
        if (badge) {
          badge.classList.add("offline");
          badge.title = "Lampu Kuning: Mode Offline (Data aman tersimpan di HP & otomatis disinkronkan saat online)";
        }
        if (text) text.textContent = customMsg || "Offline";
        if (dot) {
          dot.style.background = "#ca8a04";
          dot.style.boxShadow = "0 0 8px #ca8a04, 0 0 14px rgba(202, 138, 4, 0.5)";
        }
      }
    };

    window.addEventListener("online", () => {
      updateStatus(true);
      this.showToast("🟢 Koneksi internet kembali aktif! Menyinkronkan data...");
      if (window.SupabaseService && window.SupabaseService.fetchAllData) {
        window.SupabaseService.fetchAllData().then(d => {
          if (d) this.applyRemoteData(d);
        });
      }
    });

    window.addEventListener("offline", () => {
      updateStatus(false, "Offline");
      this.showToast("⚠️ Jaringan offline. Data aman di HP & otomatis disinkron saat online.");
    });

    updateStatus(navigator.onLine);
  },

  checkCloudConnection(showToast = false) {
    if (!navigator.onLine) {
      if (showToast) this.showToast("⚠️ Perangkat sedang offline. Data Anda tetap tersimpan aman di HP!");
      return;
    }
    if (!window.SupabaseService) {
      if (showToast) this.showToast("ℹ️ Layanan Cloud Supabase belum siap.");
      return;
    }
    window.SupabaseService.checkConnection().then(res => {
      const badge = document.getElementById("cloudStatusBadge");
      const dot = document.getElementById("cloudStatusDot");
      const text = document.getElementById("cloudStatusText");
      if (res && res.ok) {
        if (badge) {
          badge.classList.remove("offline");
          badge.title = "Lampu Hijau: Cloud Supabase Terhubung & Realtime Aktif";
        }
        if (dot) { dot.style.background = "#10b981"; dot.style.boxShadow = "0 0 8px #10b981, 0 0 14px rgba(16, 185, 129, 0.5)"; }
        if (text) text.textContent = "Cloud Aktif";
        if (showToast) this.showToast("🟢 Indikator Hijau: Cloud Terhubung! Sinkronisasi skor Supabase aktif sempurna.");
        if (typeof this.forceSyncFromRemote === 'function') {
          this.forceSyncFromRemote(false);
        }
      } else {
        if (badge) {
          badge.classList.add("offline");
          badge.title = "Lampu Kuning: Offline / Lokal";
        }
        if (dot) { dot.style.background = "#ca8a04"; dot.style.boxShadow = "0 0 8px #ca8a04, 0 0 14px rgba(202, 138, 4, 0.5)"; }
        if (text) text.textContent = "Offline";
        if (showToast) this.showToast(`⚠️ Indikator Kuning: ${res.message || 'Gagal tersambung'}. Data tersimpan lokal.`);
      }
    }).catch(err => {
      if (showToast) this.showToast("⚠️ Sedang menggunakan penyimpanan lokal.");
    });
  },

  copyDailyMatchRecap() {
    const config = this.store.data.config || {};
    const matches = this.store.data.matches || [];
    const cat = this.currentCategory;

    let targetMatches = matches.filter(m => {
      if (cat !== "all" && m.category && m.category !== cat) return false;
      return m.status === "finished" || m.status === "live";
    });

    if (targetMatches.length === 0) {
      targetMatches = matches.slice(0, 8);
    }

    const tName = config.tournamentName || 'ACC 2026';
    const venue = config.venue || "GOR Futsal Ma'had Al-Fayyadh Maros";

    let text = `🏆 *REKAP HASIL PERTANDINGAN RESMI*\n`;
    text += `*${tName}*\n`;
    text += `📍 ${venue}\n`;
    text += `📅 ${config.dates || "22 - 29 November 2026"}\n`;
    text += `───────────────────\n\n`;

    let currentGroupOrStage = "";
    targetMatches.forEach((m) => {
      const hTeam = this.store.getTeam(m.homeId) || { name: m.homePlaceholder || "Home", shortName: "HOME" };
      const aTeam = this.store.getTeam(m.awayId) || { name: m.awayPlaceholder || "Away", shortName: "AWAY" };
      const stageName = `${this.store.getMatchStageName(m)} (${m.category || 'SMP'})`;

      if (stageName !== currentGroupOrStage) {
        currentGroupOrStage = stageName;
        text += `⚽ *${currentGroupOrStage}*\n`;
      }

      if (m.status === "finished") {
        let scoreStr = `${hTeam.shortName || hTeam.name} ${m.homeScore} - ${m.awayScore} ${aTeam.shortName || aTeam.name}`;
        if (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined) {
          scoreStr += ` (A.P. ${m.penaltyHomeScore}-${m.penaltyAwayScore})`;
        }
        text += `• ${scoreStr} [FT]\n`;
      } else if (m.status === "live") {
        text += `• ${hTeam.shortName || hTeam.name} ${m.homeScoreLive || 0} - ${m.awayScoreLive || 0} ${aTeam.shortName || aTeam.name} 🔴 LIVE ${m.liveMinute || ''}\n`;
      } else {
        text += `• ${hTeam.shortName || hTeam.name} vs ${aTeam.shortName || aTeam.name} (Pukul ${m.time} WITA)\n`;
      }
    });

    text += `\n───────────────────\n`;
    text += `📊 *Pantau Klasemen, Top Skor & Live Streaming YouTube di Portal Resmi:*\n`;
    text += `👉 https://accfutsal2026.vercel.app\n\n`;
    text += `_#ACC2026 #AlFayyadhChampionsCup #FutsalSulsel_`;

    if (navigator.share) {
      navigator.share({
        title: tName,
        text: text
      }).then(() => {
        this.showToast("✅ Rekap berhasil dibagikan!");
      }).catch((err) => {
        if (err.name !== "AbortError") {
          this.fallbackCopyText(text);
        }
      });
      return;
    }
    this.fallbackCopyText(text);
  },

  fallbackCopyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("📋 Rekap hasil laga berhasil disalin! Siap ditempel ke WhatsApp.");
      }).catch(() => {
        this.legacyCopyText(text);
      });
    } else {
      this.legacyCopyText(text);
    }
  },

  legacyCopyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      this.showToast("📋 Rekap hasil laga berhasil disalin! Siap ditempel ke WhatsApp.");
    } catch (e) {
      prompt("Salin teks rekap pertandingan berikut:", text);
    }
    document.body.removeChild(ta);
  },

  shareToWhatsApp() {
    const config = (this.store && this.store.data && this.store.data.config) || {};
    const tName = config.tournamentName || 'ACC 2026';
    const text = encodeURIComponent(
      `🏆 *${tName}*\n` +
      `Pantau jadwal pertandingan, skor langsung (live score), klasemen grup, bagan fase gugur, dan sanksi kartu di portal resmi turnamen:\n` +
      window.location.href
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  },

  // =========================================================
  // OPENING / SPLASH SCREEN MANAGEMENT
  // =========================================================
  initSplashScreen() {
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;

    if (this.splashTimeout) {
      clearTimeout(this.splashTimeout);
      this.splashTimeout = null;
    }
    // Komitmen Pengguna: Splash screen TETAP TAMPIL dan TIDAK AKAN MASUK OTOMATIS jika tombol Log In belum diklik!
  },

  // =========================================================
  // FORMAT LIVE MINUTE & CHRONOLOGICAL MATCH ORDER HELPERS
  // =========================================================
  formatMatchLiveMinute(m) {
    if (!m) return "0:00";
    if (m.isTimerPaused) {
      if (m.liveClockDisplay) {
        const dStr = String(m.liveClockDisplay).trim();
        if (dStr.includes(":")) {
          const parts = dStr.split(":");
          const pMin = parseInt(parts[0].replace(/\D/g, ""), 10) || 0;
          const pSec = parseInt(parts[1].replace(/\D/g, ""), 10) || 0;
          return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
        }
      }
      if (typeof m.liveElapsedSec === "number") {
        const pMin = Math.min(50, Math.floor(m.liveElapsedSec / 60));
        const pSec = m.liveElapsedSec % 60;
        return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
      }
      const rawMin = parseInt(String(m.liveMinute || "1").replace(/\D/g, ""), 10) || 1;
      return `${rawMin - 1}:00`;
    }
    const rawStr = String(m.liveMinute || "").trim();
    if (rawStr.includes(":")) {
      const parts = rawStr.split(":");
      const pMin = parseInt(parts[0].replace(/\D/g, ""), 10) || 0;
      const pSec = parseInt(parts[1].replace(/\D/g, ""), 10) || 0;
      return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
    }
    let elapsedSec = 0;
    if (m.liveStartedAt) {
      elapsedSec = Math.max(0, Math.floor((Date.now() - m.liveStartedAt) / 1000));
    } else {
      const rawMin = parseInt(rawStr.replace(/\D/g, ""), 10) || 1;
      elapsedSec = (rawMin - 1) * 60;
    }
    const min = Math.min(50, Math.floor(elapsedSec / 60));
    const sec = elapsedSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  },

  getChronologicalMatchOrder(m) {
    if (!m) return 99999999;
    let dayNum = parseInt(m.matchday || m.day, 10);
    if (!dayNum || isNaN(dayNum)) {
      const dStr = String(m.date || "");
      const dMatch = dStr.match(/(\d{1,2})\s*(?:Nov|November)?/i);
      if (dMatch) {
        const val = parseInt(dMatch[1], 10);
        dayNum = (val >= 22 && val <= 30) ? (val - 21) : val;
      } else {
        dayNum = 1;
      }
    }

    const tStr = String(m.time || "").trim();
    let timeMinutes = 999;
    const tMatch = tStr.match(/(\d{1,2})[:.](\d{2})/);
    if (tMatch) {
      timeMinutes = (parseInt(tMatch[1], 10) * 60) + parseInt(tMatch[2], 10);
    } else {
      const digits = tStr.replace(/\D/g, "");
      if (digits.length >= 3) {
        const h = parseInt(digits.slice(0, -2), 10);
        const min = parseInt(digits.slice(-2), 10);
        timeMinutes = (h * 60) + min;
      }
    }

    return (dayNum * 1440) + timeMinutes;
  },

  // =========================================================
  // GLOBAL BACKGROUND TIMER UNTUK PERTANDINGAN LIVE
  // Otomatis menambah menit secara presisi & disinkronkan ke Supabase
  // =========================================================
  initGlobalLiveMatchTimer() {
    if (this._globalLiveTimerInterval) {
      clearInterval(this._globalLiveTimerInterval);
    }
    if (this._liveClockTicker) {
      clearInterval(this._liveClockTicker);
    }

    // 1-second live ticker untuk jam digital live minute pada Detail Laga & modal
    this._liveClockTicker = setInterval(() => {
      const clockEl = document.getElementById("mdLiveClockDigits");
      const wrapperEl = document.getElementById("mdLiveMinuteTop");
      if (clockEl && this.activeDetailMatchId) {
        const activeM = (this.store?.data?.matches || []).find(m => m.id === this.activeDetailMatchId && m.status === 'live');
        if (activeM) {
          clockEl.textContent = this.formatMatchLiveMinute(activeM);
          if (wrapperEl) {
            if (activeM.isTimerPaused) {
              wrapperEl.classList.add("is-paused");
              wrapperEl.setAttribute("title", "Waktu Pertandingan Dijeda (m:dd)");
            } else {
              wrapperEl.classList.remove("is-paused");
              wrapperEl.setAttribute("title", "Live Minute Pertandingan (m:dd)");
            }
          }
        }
      }
    }, 1000);

    this._globalLiveTimerInterval = setInterval(() => {
      const matches = this.store && this.store.data ? this.store.data.matches : [];
      if (!matches || matches.length === 0) return;

      const liveMatches = matches.filter(m => m.status === "live");
      if (liveMatches.length === 0) return;

      const now = Date.now();
      let hasChange = false;

      // HANYA PANITIA RESMI yang berhak memajukan timer secara otomatis dan menyinkronkannya ke Supabase
      // Penonton dan perangkat mobile hanya menerima data resmi dari Supabase agar tidak bentrok atau berkurang
      const isOfficial = this.isAdmin();

      liveMatches.forEach(m => {
        // JIKA TIMER DIJEDA OLEH PANITIA, JANGAN NAIKKAN MENIT SAMA SEKALI
        if (m.isTimerPaused) return;

        let curMin = parseInt((m.liveMinute || "1'").toString().replace(/\D/g, ""), 10) || 1;
        if (!m.liveStartedAt) {
          m.liveStartedAt = now - ((curMin - 1) * 60000);
        }

        // Hitung menit berjalan presisi di SEMUA perangkat (HP peserta & laptop panitia)
        const elapsed = Math.floor((now - m.liveStartedAt) / 60000) + 1;
        const newMin = Math.min(50, Math.max(curMin, elapsed));
        const newMinStr = `${newMin}'`;

        if (m.liveMinute !== newMinStr) {
          m.liveMinute = newMinStr;
          hasChange = true;
        }
      });

      if (hasChange) {
        // Fast targeted DOM update: perbarui teks menit live tanpa menghancurkan & me-render ulang seluruh daftar 32 kartu
        liveMatches.forEach(m => {
          const isPaused = Boolean(m.isTimerPaused);
          const minOnly = (m.liveMinute || "").toString().replace(/\D/g, "");
          const cleanMinBadge = minOnly ? `${minOnly}'` : '';
          const displayText = `${isPaused ? '⏸️ JEDA' : 'LIVE'}${cleanMinBadge ? ` • Menit ${cleanMinBadge}` : ''}`;

          const cardEl = document.getElementById(`match-card-${m.id}`) || document.querySelector(`[data-match-id="${m.id}"]`);
          if (cardEl) {
            const barStrong = cardEl.querySelector(".bar-live strong");
            if (barStrong) barStrong.textContent = displayText;
          }
        });

        // Simpan data di latar belakang secara ringan (maks 1x per 30 detik untuk menghindari lock IO pada HP)
        if (!this._lastLiveTimerSave || (now - this._lastLiveTimerSave) > 30000) {
          this._lastLiveTimerSave = now;
          this.store.saveData();
        }

        try { this.updateHeroLiveBadge(); } catch (_) { }
        try { this.updateFloatingLiveNotice(); } catch (_) { }
        if (this.currentTab === "match-detail" && this.activeDetailMatchId) {
          try { this.refreshActiveMatchDetail(); } catch (_) { }
        }

        // Jika modal admin sedang terbuka untuk pertandingan ini, update input menit
        const activeModalMatchId = window.admin && (window.admin.activeMatchId || window.admin.activeQuickMatchId);
        if (activeModalMatchId) {
          const activeM = liveMatches.find(m => m.id === activeModalMatchId);
          if (activeM) {
            const matchMinInput = document.getElementById("matchMinuteInput");
            if (matchMinInput && document.activeElement !== matchMinInput) {
              matchMinInput.value = activeM.liveMinute;
            }
          }
        }
      }
    }, 1000);
  },

  dismissSplashScreen() {
    if (this.splashTimeout) {
      clearTimeout(this.splashTimeout);
      this.splashTimeout = null;
    }
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;

    splash.style.pointerEvents = "none";
    splash.classList.add("splash-fade-out");
    setTimeout(() => {
      splash.style.display = "none";
    }, 350);
  },

  replaySplashScreen() {
    const splash = document.getElementById("appSplashScreen");
    if (!splash) return;
    splash.style.display = "flex";
    splash.style.pointerEvents = "auto";
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
  // YOUTUBE EMBED HELPER & LIVE STREAM HERO (LITE FACADE PATTERN)
  // =========================================================
  getYoutubeVideoId(url) {
    if (!url) return "5qap5aO4i9A";
    url = url.trim();
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) return embedMatch[1].split(/[?&]/)[0];
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1].split(/[?&]/)[0];
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1].split('&')[0];
    const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
    if (liveMatch && liveMatch[1]) return liveMatch[1].split(/[?&]/)[0];
    if (/^[a-zA-Z0-9_-]{10,12}$/.test(url)) return url;
    return "5qap5aO4i9A";
  },

  formatYoutubeEmbedUrl(url) {
    const videoId = this.getYoutubeVideoId(url);
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
  },

  renderLiveStreamHero() {
    this.updateHeroLiveBadge();
    const container = document.getElementById("liveStreamHero");
    if (!container) return;

    const cfg = (this.store && this.store.data && this.store.data.config) || {};
    const rawYtUrl = cfg.youtubeLiveUrl || "https://www.youtube.com/embed/5qap5aO4i9A";
    const videoId = this.getYoutubeVideoId(rawYtUrl);
    const title = (cfg.youtubeLiveTitle || "Siaran Langsung Lapangan Utama - GOR Futsal Ma'had Al-Fayyadh Maros").replace(/^[🔴\s]+/, "");

    // Cek apakah video player iframe sudah sedang aktif berputar
    const existingPlayer = document.getElementById("mainYoutubeIframe");
    const isAlreadyPlaying = Boolean(existingPlayer);

    // Jika video sedang aktif ditonton, update title tanpa me-reset iframe video yang sedang diputar
    if (isAlreadyPlaying) {
      const titleEl = container.querySelector(".live-stream-title");
      if (titleEl) titleEl.textContent = title;
      return;
    }

    // Banner Siaran Langsung YouTube Bersih (Fokus Live Stream Siaran Resmi Lapangan)
    container.innerHTML = `
      <div class="live-stream-card">
        <div class="live-stream-header">
          <div class="live-stream-header-left">
            <div class="live-on-air-pill">
              <span class="live-blink-circle"></span>
              <span>LIVE BROADCAST</span>
            </div>
            <h2 class="live-stream-title">${title}</h2>
          </div>
          <div class="live-stream-header-right">
            ${this.isAdmin() ? `
              <button class="btn btn-outline btn-sm btn-edit-stream" onclick="admin.openYoutubeLiveModal()" title="Ubah Link Siaran Langsung YouTube (Panitia)">
                Ganti Link Live
              </button>
            ` : ''}
          </div>
        </div>

        <!-- LITE YOUTUBE FACADE (On-demand video loading) -->
        <div class="live-video-player-wrapper yt-facade" id="ytVideoPlayerContainer" onclick="app.playYoutubeLiveStream('${videoId}')" title="Klik untuk memutar siaran langsung YouTube">
          <img class="yt-facade-thumb" 
               src="https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp" 
               onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'" 
               alt="${title}" 
               loading="lazy" 
               decoding="async">
          <div class="yt-facade-overlay">
            <button type="button" class="yt-facade-play-btn" aria-label="Putar Siaran Langsung YouTube">
              <svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true">
                <path class="yt-play-bg" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"></path>
                <path d="M45 24L27 14v20z" fill="#fff"></path>
              </svg>
            </button>
            <div class="yt-facade-info">
              <span class="yt-facade-badge">🔴 KLIK UNTUK NONTON LIVE STREAM</span>
              <span class="yt-facade-title">${title}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  playYoutubeLiveStream(videoId) {
    const container = document.getElementById("ytVideoPlayerContainer");
    if (!container) return;
    const vid = videoId || this.getYoutubeVideoId((this.store && this.store.data && this.store.data.config && this.store.data.config.youtubeLiveUrl));
    container.innerHTML = `
      <iframe 
        id="mainYoutubeIframe" 
        src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0" 
        title="YouTube Live Siaran ACC Ma'had Al-Fayyadh" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
      </iframe>
    `;
    container.classList.remove("yt-facade");
    container.style.cursor = "default";
    container.onclick = null;
  },

  setCategory(cat, showToastMsg = true) {
    if (this.isDrawingSpinning) return;
    if (this.isAutoDrawing && typeof this.toggleAutoDraw === "function") this.toggleAutoDraw(true);
    if (cat !== "SMP" && cat !== "SD") cat = "SMP";
    this.currentCategory = cat;
    this.currentDrawCat = cat;
    this.filterTeam = "all";
    this._lastTeamFilterKey = null;
    localStorage.setItem("acc_active_category", cat);
    this.updateCategoryUI();
    document.querySelectorAll(".btn-draw-cat").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.cat === cat);
    });
    this.renderCurrentView();
    if (showToastMsg) {
      const lbl = cat === "SMP" ? " Kelas SMP" : " Kelas SD";
      this.showToast(`Beralih ke ${lbl}`);
    }
  },

  switchCategory(cat, showToastMsg = true) {
    return this.setCategory(cat, showToastMsg);
  },

  toggleFloatingCategoryMenu(forceState = null) {
    const floatWrap = document.getElementById("floatingCategorySwitcher");
    const mainBtn = document.getElementById("floatingCatMainBtn");
    const dropdown = document.getElementById("floatingCatDropdown");
    const altBtn = document.getElementById("floatingCatAltBtn");
    if (!floatWrap) return;

    const isOpen = forceState !== null ? Boolean(forceState) : !floatWrap.classList.contains("menu-open");
    floatWrap.classList.toggle("menu-open", isOpen);
    if (mainBtn) mainBtn.setAttribute("aria-expanded", String(isOpen));
    if (dropdown) dropdown.setAttribute("aria-hidden", String(!isOpen));
    if (altBtn) altBtn.setAttribute("tabindex", isOpen ? "0" : "-1");
  },

  selectAlternateCategory() {
    const targetCat = this.currentCategory === "SMP" ? "SD" : "SMP";
    try {
      if (window.navigator && typeof window.navigator.vibrate === "function") {
        window.navigator.vibrate(20);
      }
    } catch (e) { }
    this.setCategory(targetCat, true);
    this.toggleFloatingCategoryMenu(false);
  },

  updateFloatingCategoryVisibility() {
    const floatWrap = document.getElementById("floatingCategorySwitcher");
    if (!floatWrap) return;
    const allowedTabs = ["matches", "standings", "draw", "bracket", "teams", "stats"];
    const shouldShow = allowedTabs.includes(this.currentTab);
    floatWrap.classList.toggle("is-visible", shouldShow);
    if (!shouldShow) {
      this.toggleFloatingCategoryMenu(false);
    }
  },

  initFloatingCategorySwitcher() {
    this.updateCategoryUI();
    this.updateFloatingCategoryVisibility();

    // Auto-dismiss saat klik di luar area floating switcher
    document.addEventListener("click", (e) => {
      const wrap = document.getElementById("floatingCategorySwitcher");
      if (wrap && wrap.classList.contains("menu-open")) {
        if (!wrap.contains(e.target)) {
          this.toggleFloatingCategoryMenu(false);
        }
      }
    });

    // Auto-dismiss saat pengguna melakukan scroll signifikan (throttled via rAF)
    let lastScrollPos = 0;
    let scrollTicking = false;
    window.addEventListener("scroll", () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY || window.pageYOffset || 0;
          if (Math.abs(currentScroll - lastScrollPos) > 40) {
            lastScrollPos = currentScroll;
            const wrap = document.getElementById("floatingCategorySwitcher");
            if (wrap && wrap.classList.contains("menu-open")) {
              this.toggleFloatingCategoryMenu(false);
            }
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  },

  updateCategoryUI() {
    const isSMP = this.currentCategory === "SMP";
    document.querySelectorAll(".btn-cat-smp, #btnCatSMP, #mobCatSMP").forEach(el => {
      el.classList.toggle("active", isSMP);
    });
    document.querySelectorAll(".btn-cat-sd, #btnCatSD, #mobCatSD").forEach(el => {
      el.classList.toggle("active", !isSMP);
    });

    // Update Floating Circular Category Switcher
    const floatWrap = document.getElementById("floatingCategorySwitcher");
    const mainLabel = document.getElementById("floatingCatMainText");
    const mainSub = document.getElementById("floatingCatMainSub");
    const altLabel = document.getElementById("floatingCatAltText");
    const altSub = document.getElementById("floatingCatAltSub");
    const altPillText = document.getElementById("floatingCatAltPillText");

    if (floatWrap) {
      floatWrap.classList.toggle("is-smp", isSMP);
      floatWrap.classList.toggle("is-sd", !isSMP);
    }
    if (mainLabel) mainLabel.textContent = isSMP ? "SMP" : "SD";
    if (mainSub) mainSub.textContent = isSMP ? "U-15" : "U-12";
    if (altLabel) altLabel.textContent = isSMP ? "SD" : "SMP";
    if (altSub) altSub.textContent = isSMP ? "U-12" : "U-15";

  },

  initSupabaseSync() {
    if (!window.SupabaseService) return;

    // Listen for realtime live score & match changes via WebSocket (instan ~50ms)
    window.SupabaseService.onRemoteUpdate((table, payload) => {
      this.handleRemoteSync(table, payload);
    });

    // Helper to apply full remote dataset with change detection
    let lastDataSignature = "";
    let isInitialLoad = true;
    let isSyncing = false;
    let syncWatchdogTimer = null;

    const syncFromRemote = () => {
      if (!window.SupabaseService || isSyncing) return;
      const isReady = typeof window.SupabaseService.isReady === 'function'
        ? window.SupabaseService.isReady()
        : Boolean(window.SupabaseService.isConfigured);
      if (!isReady && typeof window.SupabaseService.init === 'function') {
        window.SupabaseService.init();
      }

      isSyncing = true;
      if (syncWatchdogTimer) clearTimeout(syncWatchdogTimer);
      syncWatchdogTimer = setTimeout(() => {
        if (isSyncing) {
          isSyncing = false;
          console.warn("[Supabase] sync lock watchdog released after timeout");
        }
      }, 7000);

      window.SupabaseService.fetchAllData().then(data => {
        isSyncing = false;
        if (syncWatchdogTimer) clearTimeout(syncWatchdogTimer);
        if (data) {
          // Generate signature lengkap: pertandingan, waktu, skor, menit, kartu, config, DAN DATA TIM BESERTA SKUAD & LOGO
          const signature = (data.matches ? data.matches.map(m =>
            `${m.id}:${m.date}:${m.time}:${m.pitch}:${m.stage}:${m.group_letter}:${m.round_name}:${m.home_id}:${m.away_id}:${m.status}:${m.home_score}:${m.away_score}:${m.home_score_live}:${m.away_score_live}:${m.minute_live}:${(m.scorers || []).length}:${(m.cards || []).length}:${m.penalty_home_score}:${m.penalty_away_score}:${m.updated_at}`
          ).join("|") : "") +
            "#" + (data.config ? `${data.config.tournament_name}:${data.config.youtube_live_url}:${data.config.updated_at}` : "") +
            "#" + (data.teams ? data.teams.map(t => `${t.id}:${t.name}:${t.updated_at}:${(t.players || []).length}`).join("|") : "") +
            "#" + (data.teamMeta ? Object.keys(data.teamMeta).sort().map(k => `${k}:${data.teamMeta[k]?.category || ''}:${data.teamMeta[k]?.instansi || ''}`).join("|") : "") +
            "#" + (data.teamLogos ? Object.keys(data.teamLogos).map(k => `${k}:${(data.teamLogos[k] || '').length}`).join("|") : "") +
            "#" + (data.sponsors ? (Array.isArray(data.sponsors) ? data.sponsors.map(s => `${s.id}:${s.name}:${(s.logo_url || s.image || '').length}:${s.tier}`).join("|") : JSON.stringify(data.sponsors)) : "");

          if (isInitialLoad || signature !== lastDataSignature) {
            lastDataSignature = signature;
            if (isInitialLoad) {
              console.log("☁️ Supabase Cloud data successfully fetched & applied!");
              isInitialLoad = false;
            } else {
              console.log("☁️ Supabase Cloud data updated:", new Date().toLocaleTimeString());
            }
            this.applyRemoteData(data);
          }
        }
      }).catch(err => {
        isSyncing = false;
        if (syncWatchdogTimer) clearTimeout(syncWatchdogTimer);
        console.warn("Supabase sync notice:", err);
      });
    };

    // Public method untuk force sync instan dari tombol UI atau tap badge
    this.forceSyncFromRemote = (showToast = true) => {
      if (showToast) this.showToast("🔄 Menyinkronkan data turnamen dari Cloud...");
      isSyncing = false;
      syncFromRemote();
    };

    // Initial remote fetch non-blocking agar tidak pernah mengganggu LCP & First Contentful Paint
    const startInitialSync = () => {
      const runSync = () => {
        syncFromRemote();
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(runSync, { timeout: 3500 });
      } else {
        setTimeout(runSync, 2500);
      }
    };

    if (document.readyState === "complete") {
      startInitialSync();
    } else {
      window.addEventListener("load", startInitialSync, { once: true });
    }

    // Auto-refresh cepat saat pengguna kembali ke aplikasi / unlock HP
    // PROTEKSI: Jangan pernah sync/re-render saat pengguna sedang aktif mengisi form atau memilih file/folder!
    let lastFocusSyncTs = Date.now();
    const safeFocusSync = () => {
      if (this.isUserEditing()) return;
      const now = Date.now();
      if (now - lastFocusSyncTs < 2000) return;
      lastFocusSyncTs = now;
      syncFromRemote();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        isSyncing = false; // Reset sync lock instantly upon phone wake
        if (window.SupabaseService && typeof window.SupabaseService.setupRealtimeSubscriptions === 'function') {
          try {
            if (!window.SupabaseService.channel || window.SupabaseService.channel.state !== 'joined') {
              window.SupabaseService.setupRealtimeSubscriptions();
            }
          } catch (_) { }
        }
        safeFocusSync();
      }
    });
    window.addEventListener("online", () => {
      isSyncing = false;
      if (!this.isUserEditing()) syncFromRemote();
    });

    // Realtime Background Safety Polling (WebSocket menangani update instan ~50ms, polling hanya cadangan ringan):
    // Jika ada match LIVE: 5 detik. Normal: 12 detik. Tidak membebani CPU/jaringan!
    let lastPollTimestamp = Date.now();
    setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (this.isUserEditing()) return;

      const matches = (this.store && this.store.data && this.store.data.matches) || [];
      const hasLiveMatch = matches.some(m => m.status === "live");
      const requiredIntervalMs = hasLiveMatch ? 5000 : 12000;

      const now = Date.now();
      if ((now - lastPollTimestamp) >= requiredIntervalMs) {
        lastPollTimestamp = now;
        syncFromRemote();
      }
    }, 2500);
  },

  isUserEditing() {
    // Penonton dan perangkat non-admin TIDAK PERNAH memblokir sinkronisasi live
    if (!this.isAdmin()) return false;
    const readOnlyViewerIds = ["teamModal", "matchDetailModal", "momentModal", "newsModal", "rulesModal", "juknisModal"];
    const activeModals = document.querySelectorAll(".modal-overlay.active");
    for (const m of activeModals) {
      if (!readOnlyViewerIds.includes(m.id)) {
        return true;
      }
    }
    return false;
  },

  applyRemoteData(data) {
    if (!data) return;

    if (data.config) {
      const cfg = this.store.data.config || {};
      if (data.config.tournament_name || data.config.tournamentName) {
        let name = data.config.tournament_name || data.config.tournamentName;
        if (name && (name.includes('ACC "Al-Fayyadh') || name === 'ACC 2026')) {
          name = 'Al-Fayyadh Champions Cup 2026';
        }
        cfg.tournamentName = name;
      }
      if (data.config.sub_title !== undefined || data.config.subTitle !== undefined) {
        cfg.subTitle = data.config.sub_title !== undefined ? data.config.sub_title : data.config.subTitle;
      }
      if (data.config.venue !== undefined) cfg.venue = data.config.venue;
      if (data.config.dates !== undefined) {
        let d = String(data.config.dates || "");
        if (!d || d.includes("28") || d.includes("26")) d = "22 - 29 November 2026";
        cfg.dates = d;
      }
      if (data.config.rules_text !== undefined || data.config.rulesText !== undefined) {
        const incomingRules = (data.config.rules_text !== undefined ? data.config.rules_text : data.config.rulesText) || "";
        const officialRules = (typeof DEFAULT_DATA !== "undefined" && DEFAULT_DATA.config && DEFAULT_DATA.config.rulesText)
          ? DEFAULT_DATA.config.rulesText : "";
        if (incomingRules && incomingRules.includes("### K. PENGHARGAAN") && incomingRules.length >= (officialRules.length - 200)) {
          cfg.rulesText = incomingRules;
        } else if (officialRules) {
          cfg.rulesText = officialRules;
        }
      }
      if (data.config.running_announcement !== undefined || data.config.runningAnnouncement !== undefined) {
        cfg.runningAnnouncement = data.config.running_announcement !== undefined ? data.config.running_announcement : data.config.runningAnnouncement;
      }
      if (data.config.youtube_live_url !== undefined || data.config.youtubeLiveUrl !== undefined) {
        cfg.youtubeLiveUrl = data.config.youtube_live_url !== undefined ? data.config.youtube_live_url : data.config.youtubeLiveUrl;
      }
      if (data.config.youtube_live_title !== undefined || data.config.youtubeLiveTitle !== undefined) {
        cfg.youtubeLiveTitle = data.config.youtube_live_title !== undefined ? data.config.youtube_live_title : data.config.youtubeLiveTitle;
      }
      if (data.config.hero_banner_image || data.config.heroBannerImage) {
        cfg.heroBannerImage = data.config.hero_banner_image || data.config.heroBannerImage;
      }
      if (data.config.admin_pin_hash || data.config.adminPinHash) {
        cfg.adminPinHash = data.config.admin_pin_hash || data.config.adminPinHash;
      }
      this.store.data.config = cfg;
      this.renderHeader();
      this.renderLiveStreamHero();
    }

    // 1. Sinkronkan TIM dari Database Online Supabase (Single Source of Truth — ZERO data mutlak!)
    if (Array.isArray(data.teams)) {
      const prevTeamsMap = new Map((this.store.data.teams || []).map(t => [t.id, t]));
      const isValidPhoto = (v) => typeof v === 'string' && v.trim().length > 5;

      const syncedTeams = data.teams.map((remoteTeam, rIdx) => {
        if (!remoteTeam || !remoteTeam.id) return null;
        const localTeam = prevTeamsMap.get(remoteTeam.id);
        const norm = (this.store && typeof this.store.normalizeTeam === "function")
          ? this.store.normalizeTeam(remoteTeam, rIdx)
          : remoteTeam;
        if (!norm) return null;

        if (localTeam) {
          if (!isValidPhoto(norm.logo) && isValidPhoto(localTeam.logo)) {
            norm.logo = localTeam.logo;
          }
          if (localTeam.official) {
            if (!isValidPhoto(norm.official.coachPhoto) && isValidPhoto(localTeam.official.coachPhoto)) {
              norm.official.coachPhoto = localTeam.official.coachPhoto;
            }
            if (!isValidPhoto(norm.official.managerPhoto) && isValidPhoto(localTeam.official.managerPhoto)) {
              norm.official.managerPhoto = localTeam.official.managerPhoto;
            }
          }
          if (Array.isArray(norm.players) && norm.players.length > 0) {
            if (Array.isArray(localTeam.players) && localTeam.players.length > 0) {
              norm.players = norm.players.map((rP, pIdx) => {
                const lP = localTeam.players[pIdx] || localTeam.players.find(lp => lp.no === rP.no || (lp.name && lp.name === rP.name)) || {};
                return {
                  ...rP,
                  photo: isValidPhoto(rP.photo) ? rP.photo : (lP.photo || "")
                };
              });
            }
          } else if (localTeam && Array.isArray(localTeam.players) && localTeam.players.length > 0) {
            norm.players = localTeam.players;
          }
        }
        return norm;
      }).filter(Boolean);

      syncedTeams.sort((a, b) => {
        const na = parseInt(String(a.id).replace(/\D/g, ""), 10) || 9999;
        const nb = parseInt(String(b.id).replace(/\D/g, ""), 10) || 9999;
        return na - nb || String(a.id).localeCompare(String(b.id));
      });

      this.store.data.teams = syncedTeams;
    }

    // Terapkan metadata (category & instansi) dari registry cloud lintas-perangkat
    if (data.teamMeta && typeof data.teamMeta === 'object') {
      Object.entries(data.teamMeta).forEach(([tId, meta]) => {
        const t = this.store.data.teams.find(tm => tm.id === tId);
        if (t && meta) {
          if (meta.category) t.category = meta.category;
          if (meta.instansi !== undefined) t.instansi = String(meta.instansi || '').trim();
        }
      });
    }

    // Terapkan logo dari registry cloud lintas-perangkat
    if (data.teamLogos && typeof data.teamLogos === 'object') {
      Object.entries(data.teamLogos).forEach(([tId, lUrl]) => {
        const t = this.store.data.teams.find(tm => tm.id === tId);
        if (t && lUrl) {
          t.logo = lUrl;
        }
      });
    }

    // 2. Sinkronkan PERTANDINGAN dari Database Online Supabase (Single Source of Truth)
    if (Array.isArray(data.matches)) {
      // Bersihkan entri sampah team_meta_registry & team_logos_registry dari Supabase matches jika masih ada
      const bogusMatches = data.matches.filter(m => m && m.id && (String(m.id).includes('registry') || String(m.id).includes('config')));
      if (bogusMatches.length > 0 && window.SupabaseService && typeof window.SupabaseService.deleteMatch === 'function') {
        bogusMatches.forEach(b => {
          window.SupabaseService.deleteMatch(b.id).catch(() => { });
        });
      }

      const cleanRemote = data.matches.filter(m => m && m.id && !String(m.id).includes('registry') && !String(m.id).includes('config'));
      const prevMatchesMap = new Map((this.store.data.matches || []).filter(m => m && m.id && !String(m.id).includes('registry') && !String(m.id).includes('config')).map(m => [m.id, m]));
      const syncedMatches = cleanRemote.map(remoteMatch => {
        if (!remoteMatch || !remoteMatch.id) return null;
        const curMatch = prevMatchesMap.get(remoteMatch.id);
        const norm = (this.store && typeof this.store.normalizeMatch === "function")
          ? this.store.normalizeMatch(remoteMatch, this.store.data.teams)
          : remoteMatch;
        if (!norm) return null;
        if (curMatch && curMatch.isManualTeam) {
          norm.isManualTeam = true;
        }

        if (norm.status === "live") {
          const isActiveInAdminModal = Boolean(this.isAdmin() && window.admin && (window.admin.activeMatchId === norm.id || window.admin.activeQuickMatchId === norm.id));
          const remoteMinNum = Math.max(1, parseInt(remoteMatch.minute_live, 10) || parseInt(String(norm.liveMinute || "1").replace(/\D/g, ""), 10) || 1);

          if (norm.isTimerPaused) {
            delete norm.liveStartedAt;
            if (curMatch) delete curMatch.liveStartedAt;
            if (!norm.liveClockDisplay && typeof norm.liveElapsedSec === "number") {
              const pMin = Math.min(50, Math.floor(norm.liveElapsedSec / 60));
              const pSec = norm.liveElapsedSec % 60;
              norm.liveClockDisplay = `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
            }
          } else {
            if (curMatch && isActiveInAdminModal && !curMatch.isTimerPaused) {
              norm.liveMinute = curMatch.liveMinute || `${remoteMinNum}'`;
              if (curMatch.liveStartedAt) norm.liveStartedAt = curMatch.liveStartedAt;
            } else {
              norm.liveMinute = `${remoteMinNum}'`;
              if (curMatch && curMatch.liveStartedAt && !curMatch.isTimerPaused) {
                const curElapsed = Math.floor((Date.now() - curMatch.liveStartedAt) / 60000) + 1;
                norm.liveStartedAt = Math.abs(remoteMinNum - curElapsed) > 1
                  ? (Date.now() - ((remoteMinNum - 1) * 60000))
                  : curMatch.liveStartedAt;
              } else if (typeof norm.liveElapsedSec === "number" && norm.liveElapsedSec > 0) {
                norm.liveStartedAt = Date.now() - (norm.liveElapsedSec * 1000);
              } else {
                norm.liveStartedAt = Date.now() - ((remoteMinNum - 1) * 60000);
              }
            }
          }
        } else {
          delete norm.liveStartedAt;
        }

        if ((norm.status === "live" || norm.status === "finished") && Array.isArray(norm.scorers) && norm.scorers.length > 0) {
          const hCount = norm.scorers.filter(s => s.team === norm.homeId).length;
          const aCount = norm.scorers.filter(s => s.team === norm.awayId).length;
          norm.homeScore = Math.max(parseInt(norm.homeScore, 10) || 0, hCount);
          norm.awayScore = Math.max(parseInt(norm.awayScore, 10) || 0, aCount);
          norm.homeScoreLive = norm.homeScore;
          norm.awayScoreLive = norm.awayScore;
        }

        return norm;
      }).filter(Boolean);

      // Pertahankan pertandingan lokal HANYA jika dibuat secara manual oleh panitia terautentikasi dan ID-nya valid
      const remoteIds = new Set(cleanRemote.map(m => m && m.id).filter(Boolean));
      if (window.admin && window.admin.isAuthenticated) {
        (this.store.data.matches || []).forEach(localM => {
          if (
            localM &&
            localM.id &&
            localM.isLocallyCreated &&
            !this.store.isInvalidMatchId(localM.id) &&
            !remoteIds.has(localM.id) &&
            !localM._deleted &&
            !(this.store._deletedMatchIds && this.store._deletedMatchIds.has(localM.id))
          ) {
            syncedMatches.push(localM);
            if (window.SupabaseService && typeof window.SupabaseService.syncMatch === 'function') {
              window.SupabaseService.syncMatch(localM, window.admin.adminPinHash || "");
            }
          }
        });
      }

      const matchOrderWeight = (id) => {
        const mNum = String(id).match(/^M(?:_(?:SMP|SD)_)?(\d+)$/i);
        if (mNum) return parseInt(mNum[1], 10);
        if (/^QF/i.test(id)) return 100 + (parseInt(String(id).replace(/\D/g, ""), 10) || 0);
        if (/^SF/i.test(id)) return 200 + (parseInt(String(id).replace(/\D/g, ""), 10) || 0);
        if (/^3RD/i.test(id)) return 300;
        if (/^FINAL/i.test(id)) return 400;
        return 500;
      };
      syncedMatches.sort((a, b) => matchOrderWeight(a.id) - matchOrderWeight(b.id) || String(a.id).localeCompare(String(b.id)));
      this.store.data.matches = this.store.cleanDuplicateMatches(syncedMatches.filter(m => m && m.id && !this.store.isInvalidMatchId(m.id)));
    }

    // 3. Sinkronkan MOMENTS & SPONSORS dari Database Online Supabase
    if (Array.isArray(data.moments) && data.moments.length > 0) {
      this.store.data.moments = data.moments;
      if (this.store.data.homeData) this.store.data.homeData.moments = data.moments;
    } else if (Array.isArray(data.moments) && (!this.store.data.moments || this.store.data.moments.length === 0)) {
      this.store.data.moments = [];
      if (this.store.data.homeData) this.store.data.homeData.moments = [];
    }
    if (data.sponsors) {
      if (Array.isArray(data.sponsors) && data.sponsors.length > 0) {
        this.store.data.sponsors = this.formatSponsorsFromDb(data.sponsors);
      } else if (!Array.isArray(data.sponsors) && typeof data.sponsors === 'object') {
        const count = (data.sponsors.platinum?.length || 0) + (data.sponsors.gold?.length || 0) + (data.sponsors.media?.length || 0);
        if (count > 0) {
          this.store.data.sponsors = this.formatSponsorsFromDb(data.sponsors);
        }
      }
      try {
        localStorage.removeItem("acc_tournament_sponsors_backup");
      } catch (_) { }
    }

    // 3.1 Sinkronkan Bintang Lapangan (MVP Turnamen) dari Cloud Supabase
    if (Array.isArray(data.mvps)) {
      if (!this.store.data.homeData) this.store.data.homeData = {};
      this.store.data.homeData.mvps = data.mvps;
      this.store.data.homeData.mvp = data.mvps[0] || null;
    }

    this.store.syncPlayerStatsFromMatches();
    this.store.syncKnockoutFromStandings();
    try {
      this.syncDrawStateFromTournament("SMP", true);
      this.syncDrawStateFromTournament("SD", true);
    } catch (e) { }
    // Jika panitia sedang mengisi form/upload di modal editor, jangan re-render DOM supaya fokus ketikan tidak terganggu!
    if (this.isUserEditing()) return;

    // Render current active view immediately (< 30ms CPU time)
    this.renderCurrentView();
    if (this.currentTab === "team-detail" && this._pendingDetailTeamId) {
      this.openTeamDetailPage(this._pendingDetailTeamId, false);
    } else if (this.currentTab === "player-detail" && this._pendingDetailTeamId && this._pendingDetailPlayerId) {
      this.openPlayerDetailPage(this._pendingDetailTeamId, this._pendingDetailPlayerId, false);
    } else if (this.currentTab === "match-detail" && this.activeDetailMatchId) {
      this.renderMatchDetailPage(this.activeDetailMatchId);
    }
    this.updateHeroLiveBadge();
    this.updateFloatingLiveNotice();
    this.renderHeader();
    this.renderLiveStreamHero();
    this.renderHeroBanner();
    this.renderSponsors();
    this.refreshActiveMatchDetail();
    if (window.admin && typeof window.admin.renderSponsorsList === 'function') {
      try { window.admin.renderSponsorsList(); } catch (_) { }
    }

    // Defer non-active tab rendering to background idle slices to eliminate long tasks & reduce initial DOM size
    const deferTask = (fn) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(fn, { timeout: 3500 });
      } else {
        setTimeout(fn, 1200);
      }
    };

    deferTask(() => {
      if (this.currentTab !== "matches") try { this.renderMatches(); } catch (_) { }
    });
    deferTask(() => {
      if (this.currentTab !== "standings") try { this.renderStandings(); } catch (_) { }
    });
    deferTask(() => {
      if (this.currentTab !== "teams") try { this.renderTeams(); } catch (_) { }
    });
    deferTask(() => {
      if (this.currentTab !== "bracket") try { this.renderBracket(); } catch (_) { }
    });
    deferTask(() => {
      if (this.currentTab !== "juknis") try { this.renderJuknis(); } catch (_) { }
    });
    deferTask(() => {
      if (typeof this.renderTopScorer === "function") try { this.renderTopScorer(); } catch (_) { }
      if (typeof this.renderDisciplinary === "function") try { this.renderDisciplinary(); } catch (_) { }
    });

    // Jika modal tim sedang terbuka, perbarui tampilannya langsung dengan data terbaru
    const activeTeamModal = document.getElementById("teamModal");
    if (activeTeamModal && activeTeamModal.classList.contains("active") && this.activeTeamModalId) {
      try { this.openTeamModal(this.activeTeamModalId); } catch (_) { }
    }
  },

  handleRemoteSync(table, payload) {
    if (!payload) return;
    if (table === 'matches') {
      if (payload.id && (String(payload.id).includes('registry') || String(payload.id).includes('config'))) {
        return;
      }
      if (payload._deleted && payload.id) {
        this.store.data.matches = (this.store.data.matches || []).filter(m => m.id !== payload.id);
        this.store.syncPlayerStatsFromMatches();
        this.store.saveData();
        this.store.syncKnockoutFromStandings();
        this.renderCurrentView();
        this.renderMatches();
        this.renderStandings();
        this.renderBracket();
        return;
      }
      const idx = this.store.data.matches.findIndex(m => m.id === payload.id);
      if (idx !== -1) {
        const mapped = {};
        const curMatch = this.store.data.matches[idx];
        if (payload.status) mapped.status = payload.status;
        if (payload.home_id !== undefined) mapped.homeId = payload.home_id || "";
        if (payload.away_id !== undefined) mapped.awayId = payload.away_id || "";
        if (payload.date !== undefined) mapped.date = payload.date || "";
        if (payload.time !== undefined) mapped.time = payload.time || "";
        if (payload.pitch !== undefined) mapped.pitch = payload.pitch || "";
        if (payload.home_placeholder !== undefined) mapped.homePlaceholder = payload.home_placeholder || "";
        if (payload.away_placeholder !== undefined) mapped.awayPlaceholder = payload.away_placeholder || "";
        if (payload.stage !== undefined) mapped.stage = payload.stage;
        if (payload.group_letter !== undefined) mapped.group = payload.group_letter;
        if (payload.round_name !== undefined) mapped.roundName = payload.round_name;
        if (payload.scorers) mapped.scorers = payload.scorers;
        if (payload.cards && Array.isArray(payload.cards)) {
          const metaObj = payload.cards.find(c => c && c._meta);
          if (metaObj) {
            if (metaObj.knockoutKey && !mapped.knockoutKey) mapped.knockoutKey = metaObj.knockoutKey;
            if (metaObj.lineup && !mapped.lineup) mapped.lineup = metaObj.lineup;
            if (Array.isArray(metaObj.substitutions)) mapped.substitutions = metaObj.substitutions;
            if (typeof metaObj.homeFouls === "number") mapped.homeFouls = metaObj.homeFouls;
            if (typeof metaObj.awayFouls === "number") mapped.awayFouls = metaObj.awayFouls;
            if (metaObj.isTimerPaused !== undefined) mapped.isTimerPaused = Boolean(metaObj.isTimerPaused);
            if (typeof metaObj.liveElapsedSec === "number") mapped.liveElapsedSec = metaObj.liveElapsedSec;
            if (metaObj.liveClockDisplay) mapped.liveClockDisplay = metaObj.liveClockDisplay;
          }
          mapped.cards = payload.cards.filter(c => c && !c._meta && c.player && c.player !== 'undefined' && c.player !== 'null' && (c.type === 'yellow' || c.type === 'red'));
        }
        if (payload.minute_live !== undefined && payload.minute_live !== null) {
          const remoteMinNum = parseInt(payload.minute_live, 10) || 0;
          const finalStatus = payload.status || curMatch.status;
          const isMatchLive = finalStatus === 'live';
          const isActiveInAdminModal = Boolean(this.isAdmin() && (window.admin.activeMatchId === payload.id || window.admin.activeQuickMatchId === payload.id));
          if (isMatchLive) {
            if (!isActiveInAdminModal) {
              const validatedMin = Math.max(1, remoteMinNum);
              mapped.liveMinute = `${validatedMin}'`;
              if (!curMatch.liveStartedAt) {
                mapped.liveStartedAt = Date.now() - ((validatedMin - 1) * 60000);
              } else {
                const curLocalElapsed = Math.floor((Date.now() - curMatch.liveStartedAt) / 60000) + 1;
                if (Math.abs(validatedMin - curLocalElapsed) > 1) {
                  mapped.liveStartedAt = Date.now() - ((validatedMin - 1) * 60000);
                } else {
                  mapped.liveStartedAt = curMatch.liveStartedAt;
                }
              }
            }
          } else {
            mapped.liveMinute = "";
            delete mapped.liveStartedAt;
            delete curMatch.liveStartedAt;
          }
        }
        if (payload.penalty_home_score !== undefined) mapped.penaltyHomeScore = payload.penalty_home_score;
        if (payload.penalty_away_score !== undefined) mapped.penaltyAwayScore = payload.penalty_away_score;
        if (payload.penalty_winner !== undefined) mapped.penaltyWinner = payload.penalty_winner;

        const rHome = payload.home_score !== undefined ? payload.home_score : payload.homeScore;
        const rAway = payload.away_score !== undefined ? payload.away_score : payload.awayScore;
        const rHomeLive = payload.home_score_live !== undefined ? payload.home_score_live : payload.homeScoreLive;
        const rAwayLive = payload.away_score_live !== undefined ? payload.away_score_live : payload.awayScoreLive;

        const finalHome = (rHome !== undefined && rHome !== null) ? rHome : ((rHomeLive !== undefined && rHomeLive !== null) ? rHomeLive : curMatch.homeScore);
        const finalAway = (rAway !== undefined && rAway !== null) ? rAway : ((rAwayLive !== undefined && rAwayLive !== null) ? rAwayLive : curMatch.awayScore);

        mapped.homeScore = finalHome;
        mapped.awayScore = finalAway;
        mapped.homeScoreLive = finalHome;
        mapped.awayScoreLive = finalAway;

        // Auto-sync jika scorers ada
        const activeScorers = mapped.scorers || curMatch.scorers;
        const isLiveOrFinished = (mapped.status || curMatch.status) === 'live' || (mapped.status || curMatch.status) === 'finished';
        if (activeScorers && Array.isArray(activeScorers) && activeScorers.length > 0 && isLiveOrFinished) {
          const hCount = activeScorers.filter(s => s.team === curMatch.homeId).length;
          const aCount = activeScorers.filter(s => s.team === curMatch.awayId).length;
          mapped.homeScore = Math.max(parseInt(mapped.homeScore, 10) || 0, hCount);
          mapped.awayScore = Math.max(parseInt(mapped.awayScore, 10) || 0, aCount);
          mapped.homeScoreLive = mapped.homeScore;
          mapped.awayScoreLive = mapped.awayScore;
        }

        if ((mapped.status || curMatch.status) === 'live') {
          if (mapped.isTimerPaused) {
            delete mapped.liveStartedAt;
            delete curMatch.liveStartedAt;
            if (!mapped.liveClockDisplay && typeof mapped.liveElapsedSec === "number") {
              const pMin = Math.min(50, Math.floor(mapped.liveElapsedSec / 60));
              const pSec = mapped.liveElapsedSec % 60;
              mapped.liveClockDisplay = `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
            }
          } else {
            const minNum = parseInt((mapped.liveMinute || curMatch.liveMinute || "1").replace(/\D/g, ''), 10) || 1;
            if (!mapped.liveStartedAt) {
              if (curMatch.liveStartedAt && !curMatch.isTimerPaused) {
                const curElapsed = Math.floor((Date.now() - curMatch.liveStartedAt) / 60000) + 1;
                if (Math.abs(minNum - curElapsed) > 1) {
                  mapped.liveStartedAt = Date.now() - ((minNum - 1) * 60000);
                } else {
                  mapped.liveStartedAt = curMatch.liveStartedAt;
                }
              } else if (typeof mapped.liveElapsedSec === "number" && mapped.liveElapsedSec > 0) {
                mapped.liveStartedAt = Date.now() - (mapped.liveElapsedSec * 1000);
              } else {
                mapped.liveStartedAt = Date.now() - ((minNum - 1) * 60000);
              }
            }
          }
        } else if ((mapped.status || curMatch.status) === 'finished') {
          delete mapped.liveStartedAt;
          delete curMatch.liveStartedAt;
          mapped.liveMinute = "";
          mapped.isTimerPaused = false;
          delete mapped.liveElapsedSec;
          delete mapped.liveClockDisplay;
        } else if ((mapped.status || curMatch.status) === 'upcoming' || (mapped.status || curMatch.status) === 'scheduled') {
          delete mapped.liveStartedAt;
          delete curMatch.liveStartedAt;
          mapped.liveMinute = "";
          mapped.isTimerPaused = false;
          delete mapped.liveElapsedSec;
          delete mapped.liveClockDisplay;
          mapped.homeScore = null;
          mapped.awayScore = null;
          mapped.homeScoreLive = null;
          mapped.awayScoreLive = null;
          mapped.liveMinute = "";
        }

        Object.assign(this.store.data.matches[idx], mapped);
        this.store.syncPlayerStatsFromMatches();
        this.store.saveData();
        this.store.syncKnockoutFromStandings();
        this.renderCurrentView();
        this.renderMatches();
        this.renderStandings();
        this.renderBracket();
        if (typeof this.renderTopScorer === "function") this.renderTopScorer();
        if (typeof this.renderDisciplinary === "function") this.renderDisciplinary();
        this.updateHeroLiveBadge();
        this.updateFloatingLiveNotice();
        this.renderLiveStreamHero();
        this.refreshActiveMatchDetail();
      } else if (payload.id && !payload._deleted) {
        const rawM = {
          id: payload.id,
          category: payload.category || "",
          stage: payload.stage || "group",
          group: payload.group_letter || null,
          roundName: payload.round_name || "",
          homeId: payload.home_id || "",
          awayId: payload.away_id || "",
          homePlaceholder: payload.home_placeholder || "",
          awayPlaceholder: payload.away_placeholder || "",
          date: payload.date || "",
          time: payload.time || "",
          pitch: payload.pitch || "Lapangan 1 (Utama Vinyl)",
          status: payload.status || "upcoming",
          homeScore: payload.home_score !== undefined ? payload.home_score : null,
          awayScore: payload.away_score !== undefined ? payload.away_score : null,
          scorers: payload.scorers || [],
          cards: payload.cards || [],
          isManualTeam: Boolean(payload.is_manual_team)
        };
        const normalized = this.store.normalizeMatch(rawM);
        this.store.data.matches.push(normalized);
        this.store.saveData();
        this.renderCurrentView();
        this.renderMatches();
        this.renderStandings();
        this.renderBracket();
      }
    } else if (table === 'teams') {
      if (payload._deleted && payload.id) {
        this.store.data.teams = (this.store.data.teams || []).filter(t => t.id !== payload.id);
      } else {
        const idx = this.store.data.teams.findIndex(t => t.id === payload.id);
        const isValidPhoto = (v) => typeof v === 'string' && v.trim().length > 5;
        if (idx !== -1) {
          const localTeam = this.store.data.teams[idx];
          const curOff = localTeam.official || {};

          const mapped = {
            name: payload.name || localTeam.name,
            shortName: payload.short_name || payload.shortName || localTeam.shortName,
            badgeColor: payload.badge_color || payload.badgeColor || localTeam.badgeColor,
            city: payload.city !== undefined ? payload.city : localTeam.city,
            group: payload.group_letter || payload.group || localTeam.group,
            logo: isValidPhoto(payload.logo) ? payload.logo : (localTeam.logo || '')
          };
          if (payload.category) mapped.category = payload.category;

          if (Array.isArray(payload.players)) {
            const localPlayers = localTeam.players || [];
            mapped.players = payload.players.map((rP, pIdx) => {
              const lP = localPlayers[pIdx] || localPlayers.find(lp => lp.no === rP.no || (lp.name && lp.name === rP.name)) || {};
              return {
                ...rP,
                photo: isValidPhoto(rP.photo) ? rP.photo : (lP.photo || ""),
                goals: (rP.goals !== undefined && rP.goals !== null) ? rP.goals : (lP.goals || 0),
                yc: (rP.yc !== undefined && rP.yc !== null) ? rP.yc : (lP.yc || 0),
                rc: (rP.rc !== undefined && rP.rc !== null) ? rP.rc : (lP.rc || 0)
              };
            });
          } else if (localTeam.players) {
            mapped.players = localTeam.players;
          }

          const rCoachPhoto = payload.coach_photo || (payload.official && payload.official.coachPhoto) || "";
          const rManagerPhoto = payload.manager_photo || (payload.official && payload.official.managerPhoto) || "";

          mapped.official = {
            ...curOff,
            coach: payload.official_coach !== undefined ? payload.official_coach : ((payload.official && payload.official.coach) || curOff.coach || ''),
            manager: payload.official_manager !== undefined ? payload.official_manager : ((payload.official && payload.official.manager) || curOff.manager || ''),
            medic: payload.official_medic !== undefined ? payload.official_medic : ((payload.official && payload.official.medic) || curOff.medic || ''),
            phone: '',
            jerseyHome: payload.official_jersey_home !== undefined ? payload.official_jersey_home : ((payload.official && payload.official.jerseyHome) || curOff.jerseyHome || ''),
            jerseyAway: payload.official_jersey_away !== undefined ? payload.official_jersey_away : ((payload.official && payload.official.jerseyAway) || curOff.jerseyAway || ''),
            coachPhoto: isValidPhoto(rCoachPhoto) ? rCoachPhoto : (curOff.coachPhoto || ''),
            managerPhoto: isValidPhoto(rManagerPhoto) ? rManagerPhoto : (curOff.managerPhoto || '')
          };

          Object.assign(this.store.data.teams[idx], mapped);
        } else {
          const norm = (this.store && typeof this.store.normalizeTeam === "function")
            ? this.store.normalizeTeam(payload, this.store.data.teams.length)
            : payload;
          if (norm) this.store.data.teams.push(norm);
        }
      }
      // Debounce saveData & DOM render agar tidak freeze saat beberapa laptop mengedit bersamaan
      if (this._teamRealtimeTimer) clearTimeout(this._teamRealtimeTimer);
      const lastTeamId = payload.id;
      this._teamRealtimeTimer = setTimeout(() => {
        this.store.saveData();
        if (!this.isUserEditing()) {
          this.renderTeams();
          this.renderStandings();
          const activeTeamModal = document.getElementById("teamModal");
          if (activeTeamModal && activeTeamModal.classList.contains("active") && this.activeTeamModalId === lastTeamId) {
            try { this.openTeamModal(lastTeamId); } catch (_) { }
          }
        }
      }, 450);
    } else if (table === 'moments') {
      if (!this.store.data.moments) this.store.data.moments = [];
      if (payload._deleted && payload.id) {
        this.store.data.moments = this.store.data.moments.filter(m => m.id !== payload.id);
      } else {
        const idx = this.store.data.moments.findIndex(m => m.id === payload.id);
        if (idx !== -1) {
          Object.assign(this.store.data.moments[idx], payload);
        } else {
          this.store.data.moments.unshift(payload);
        }
      }
      this.store.saveData();
      this.renderMoments();
    } else if (table === 'tournament_config' || table === 'config') {
      if (payload.id === 'team_meta_registry' && payload.rules_text) {
        try {
          const metaReg = JSON.parse(payload.rules_text);
          if (metaReg && typeof metaReg === 'object') {
            Object.entries(metaReg).forEach(([tId, meta]) => {
              const teamObj = this.store.getTeam(tId);
              if (teamObj && meta) {
                if (meta.category) teamObj.category = meta.category;
                if (meta.instansi !== undefined) teamObj.instansi = String(meta.instansi || '').trim();
              }
            });
            this.store.saveData();
            if (!this.isUserEditing()) {
              this.renderTeams();
              if (this.currentTab === "draw" && typeof this.renderDrawView === "function") {
                this.renderDrawView();
              }
            }
          }
        } catch (_) { }
        return;
      }
      if (payload.id === 'team_logos_registry' && payload.rules_text) {
        try {
          const reg = JSON.parse(payload.rules_text);
          if (reg && typeof reg === 'object') {
            Object.entries(reg).forEach(([tId, lUrl]) => {
              const teamObj = this.store.getTeam(tId);
              if (teamObj && lUrl) teamObj.logo = lUrl;
            });
            this.store.saveData();
            this.renderTeams();
            this.renderStandings();
            const activeTeamModal = document.getElementById("teamModal");
            if (activeTeamModal && activeTeamModal.classList.contains("active") && this.activeTeamModalId) {
              try { this.openTeamModal(this.activeTeamModalId); } catch (_) { }
            }
          }
        } catch (_) { }
        return;
      }
      if (payload.id === 'mvp_spotlight_registry' && payload.rules_text) {
        try {
          const list = JSON.parse(payload.rules_text);
          if (Array.isArray(list)) {
            if (!this.store.data.homeData) this.store.data.homeData = {};
            this.store.data.homeData.mvps = list;
            this.store.data.homeData.mvp = list[0] || null;
            this.store.saveData();
            if (this.currentTab === "home") {
              this.renderMvpSection();
            }
            if (window.admin && typeof window.admin.renderManageMvpList === 'function') {
              window.admin.renderManageMvpList();
            }
          }
        } catch (_) { }
        return;
      }
      if (payload.id === 'moments_registry' && payload.rules_text) {
        try {
          const list = JSON.parse(payload.rules_text);
          if (Array.isArray(list)) {
            this.store.data.moments = list;
            if (this.store.data.homeData) this.store.data.homeData.moments = list;
            this.store.saveData();
            if (this.currentTab === "home") {
              this.renderMoments();
            }
            if (window.admin && typeof window.admin.renderMomentsList === 'function') {
              window.admin.renderMomentsList();
            }
          }
        } catch (_) { }
        return;
      }
      if (!this.store.data.config) this.store.data.config = {};
      if (payload.youtube_live_url !== undefined) {
        this.store.data.config.youtubeLiveUrl = payload.youtube_live_url;
      }
      if (payload.youtube_live_title !== undefined) {
        this.store.data.config.youtubeLiveTitle = payload.youtube_live_title;
      }
      if (payload.running_announcement && !payload.running_announcement.includes("ð")) {
        this.store.data.config.runningAnnouncement = payload.running_announcement;
      }
      if (payload.sub_title && !payload.sub_title.includes("â")) {
        this.store.data.config.subTitle = payload.sub_title;
      }
      if (payload.hero_banner_image) {
        this.store.data.config.heroBannerImage = payload.hero_banner_image;
      }
      if (payload.dates !== undefined) {
        let d = String(payload.dates || "");
        if (!d || d.includes("28") || d.includes("26")) d = "22 - 29 November 2026";
        this.store.data.config.dates = d;
      }
      this.store.saveData();
      this.renderHeader();
      this.renderLiveStreamHero();
      this.renderHeroBanner();
    } else if (table === 'sponsors') {
      const fetchFn = (window.SupabaseService && typeof window.SupabaseService.fetchAllData === 'function')
        ? window.SupabaseService.fetchAllData.bind(window.SupabaseService)
        : (window.SupabaseService && typeof window.SupabaseService.fetchTournamentData === 'function' ? window.SupabaseService.fetchTournamentData.bind(window.SupabaseService) : null);

      if (fetchFn) {
        fetchFn().then(data => {
          if (data && data.sponsors) {
            const formatted = this.formatSponsorsFromDb(data.sponsors);
            const count = (formatted.platinum?.length || 0) + (formatted.gold?.length || 0) + (formatted.media?.length || 0);
            if (count > 0) {
              this.store.data.sponsors = formatted;
              this.store.saveData();
              try {
                localStorage.setItem("acc_tournament_sponsors_backup", JSON.stringify(formatted));
              } catch (_) { }
              this.renderSponsors();
              if (window.admin && typeof window.admin.renderSponsorsList === 'function') {
                window.admin.renderSponsorsList();
              }
            }
          }
        });
      }
    }
  },

  formatSponsorsFromDb(sponsorsData) {
    if (!sponsorsData) return { platinum: [], gold: [], media: [] };
    if (!Array.isArray(sponsorsData)) return sponsorsData;
    const result = { platinum: [], gold: [], media: [] };
    const seenNames = new Set();
    sponsorsData.forEach(s => {
      const cleanName = (s.name || '').trim().toUpperCase();
      if (!cleanName || seenNames.has(cleanName)) return;
      seenNames.add(cleanName);

      const item = {
        id: s.id,
        name: s.name,
        role: s.subtitle || '',
        type: s.subtitle || '',
        image: s.logo_url || s.image || '',
        icon: s.icon || (s.tier === 'platinum' ? '🏦' : '⚽')
      };
      if (s.tier === 'platinum' || s.tier === 'primary' || s.tier === 'utama') {
        result.platinum.push(item);
      } else {
        result.gold.push(item);
      }
    });
    return result;
  },

  initThemeAndViewMode() {
    this.currentTheme = "dark";
    localStorage.setItem("pondok_futsal_theme", "dark");
    document.body.classList.remove("dark-theme");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#060a17");
  },

  toggleTheme() {
    this.currentTheme = "dark";
    document.body.classList.remove("dark-theme");
  },

  setTheme(theme, showToastMsg = false) {
    this.currentTheme = "dark";
    localStorage.setItem("pondok_futsal_theme", "dark");
    document.body.classList.remove("dark-theme");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#060a17");
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
    const isPanitia = this.isAdmin();

    // Sembunyikan SEMUA tombol khusus Panitia (termasuk Mode Panitia & Media Hub) dari pengunjung biasa!
    const btnOpenAdmin = document.getElementById("btnOpenAdmin");
    if (btnOpenAdmin) btnOpenAdmin.style.display = isPanitia ? "inline-flex" : "none";

    const adminDivider = document.getElementById("adminHeaderDivider");
    if (adminDivider) adminDivider.style.display = isPanitia ? "inline-block" : "none";

    const btnQuickMediaHub = document.getElementById("btnQuickMediaHub");
    if (btnQuickMediaHub) btnQuickMediaHub.style.display = isPanitia ? "inline-flex" : "none";

    const btnBatchUpload = document.getElementById("btnBatchUploadTeams");
    if (btnBatchUpload) btnBatchUpload.style.display = "none";

    const btnHeaderBatch = document.getElementById("btnHeaderBatchUpload");
    if (btnHeaderBatch) btnHeaderBatch.style.display = "none";

    const btnQuickBanner = document.getElementById("btnChangeBannerQuick");
    if (btnQuickBanner) btnQuickBanner.style.display = isPanitia ? "inline-flex" : "none";

    const btnAddTeam = document.getElementById("btnAddTeamBtn");
    if (btnAddTeam) btnAddTeam.style.display = isPanitia ? "inline-flex" : "none";

    const btnManageSponsors = document.getElementById("btnManageSponsors");
    if (btnManageSponsors) btnManageSponsors.style.display = isPanitia ? "inline-flex" : "none";

    const btnAddMoment = document.getElementById("btnAddMomentBtn");
    if (btnAddMoment) btnAddMoment.style.display = isPanitia ? "inline-flex" : "none";
    const btnManageMoments = document.getElementById("btnManageMomentsBtn");
    if (btnManageMoments) btnManageMoments.style.display = isPanitia ? "inline-flex" : "none";

    // Fitur Draw Grup dapat diakses oleh SEMUA USER & Panitia
    document.querySelectorAll('.tab-btn[data-tab="draw"]').forEach(btn => {
      btn.style.display = "inline-flex";
    });
    document.querySelectorAll('.mobile-nav-link[data-tab="draw"]').forEach(item => {
      item.style.display = "flex";
    });

    const btnHeaderAturLawan = document.getElementById("btnHeaderAturLawan");
    if (btnHeaderAturLawan) btnHeaderAturLawan.style.display = isPanitia ? "inline-flex" : "none";
    const btnHeaderTambahLaga = document.getElementById("btnHeaderTambahLaga");
    if (btnHeaderTambahLaga) btnHeaderTambahLaga.style.display = isPanitia ? "inline-flex" : "none";

    if (this.currentTab === "home") {
      this.renderMvpSection();
      this.renderMoments();
    }
    if (this.currentTab === "draw" && typeof this.renderDrawView === "function") {
      this.renderDrawView();
    }
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
    const config = this.store.data.config || {};
    // Navbar header: Selalu ringkas "ACC 2026"
    const headerTitleEl = document.getElementById("headerTitle");
    if (headerTitleEl) headerTitleEl.textContent = "ACC 2026";

    // Hero section di beranda: Nama lengkap turnamen
    const heroTitleEl = document.getElementById("heroTitle");
    if (heroTitleEl) {
      let tName = config.tournamentName || DEFAULT_DATA.config.tournamentName || 'Al-Fayyadh Champions Cup 2026';
      if (tName && (tName.includes('ACC "Al-Fayyadh') || tName === 'ACC 2026')) {
        tName = 'Al-Fayyadh Champions Cup 2026';
        config.tournamentName = tName;
      }
      heroTitleEl.textContent = tName;
    }
    const rawSub = config.subTitle || DEFAULT_DATA.config.subTitle;
    let cleanSub = (rawSub || "")
      .replace(/•/g, "•")
      .replace(/â\S*¢/g, "•")
      .replace(/Â/g, "")
      .replace(/â/g, "")
      .trim();
    if (!cleanSub.includes("•")) {
      cleanSub = cleanSub.replace(/\s+Ma'had/i, " • Ma'had");
    }
    document.getElementById("heroSub").textContent = cleanSub;
    document.getElementById("heroVenue").textContent = config.venue || DEFAULT_DATA.config.venue;
    const heroDatesEl = document.getElementById("heroDates");
    if (heroDatesEl) {
      let d = String(config.dates || "22 - 29 November 2026");
      if (!d || d.includes("28") || d.includes("26")) d = "22 - 29 November 2026";
      heroDatesEl.textContent = d;
    }

    let cleanTicker = config.runningAnnouncement || DEFAULT_DATA.config.runningAnnouncement || "";
    if (cleanTicker.includes("Selamat Datang")) {
      cleanTicker = "🏆 " + cleanTicker.substring(cleanTicker.indexOf("Selamat Datang")).trim();
    } else {
      cleanTicker = cleanTicker.replace(/ð[^\s]*\s*†?/g, "🏆 ").replace(/ðŸ\S*/g, "🏆 ");
    }
    const tickerEl = document.getElementById("tickerText");
    if (tickerEl) tickerEl.textContent = cleanTicker;
    this.renderHeroBanner();
    this.updateHeroLiveBadge();
    this.updateFloatingLiveNotice();
  },

  updateHeroLiveBadge() {
    const badgeEl = document.getElementById("heroLiveBadge");
    if (!badgeEl) return;

    const matches = (this.store && this.store.data && this.store.data.matches) || [];
    const liveMatches = matches.filter(m => m.status === "live");
    const hasLiveMatch = liveMatches.length > 0;

    if (hasLiveMatch) {
      const firstLive = liveMatches[0];
      const liveCat = (firstLive.category || (firstLive.id && firstLive.id.includes("_SD") ? "SD" : "SMP")).toUpperCase();
      const catLabel = liveCat === "SD" ? "Kelas SD" : "Kelas SMP";

      badgeEl.style.display = "inline-flex";
      badgeEl.style.cursor = "pointer";
      badgeEl.title = `🔴 Pertandingan ${catLabel} sedang LIVE! Klik untuk langsung menuju Jadwal & Skor (${liveCat})`;
      badgeEl.innerHTML = `
        <span class="pulse-dot"></span>
        <span>LIVE MATCHDAY • SEDANG BERLANGSUNG (${liveCat})</span>
      `;
      badgeEl.onclick = () => this.jumpToLiveMatch();
    } else {
      badgeEl.style.display = "none";
    }

    this.updateFloatingLiveNotice();
  },

  updateFloatingLiveNotice() {
    const noticeEl = document.getElementById("floatingLiveNotice");
    if (!noticeEl) return;

    if (this.currentTab === "matches" || this.floatingNoticeDismissed) {
      noticeEl.style.display = "none";
      return;
    }

    const matches = (this.store && this.store.data && this.store.data.matches) || [];
    const liveMatches = matches.filter(m => m.status === "live");

    if (liveMatches.length > 0) {
      const firstLive = liveMatches[0];
      const home = this.store.getTeam(firstLive.homeId) || { name: firstLive.homePlaceholder || "TBD", shortName: "TBD" };
      const away = this.store.getTeam(firstLive.awayId) || { name: firstLive.awayPlaceholder || "TBD", shortName: "TBD" };
      const hScore = firstLive.homeScoreLive ?? firstLive.homeScore ?? 0;
      const aScore = firstLive.awayScoreLive ?? firstLive.awayScore ?? 0;
      const cleanMin = (firstLive.liveMinute || "").toString().replace(/\D/g, "");
      const minText = cleanMin ? `(${cleanMin}')` : '';

      const textEl = document.getElementById("floatingLiveText");
      if (textEl) {
        textEl.textContent = `${home.shortName || home.name} ${hScore} - ${aScore} ${away.shortName || away.name} ${minText}`;
      }

      noticeEl.style.display = "block";
    } else {
      noticeEl.style.display = "none";
    }
  },

  dismissFloatingLiveNotice(e) {
    if (e) e.stopPropagation();
    this.floatingNoticeDismissed = true;
    const noticeEl = document.getElementById("floatingLiveNotice");
    if (noticeEl) noticeEl.style.display = "none";
  },

  jumpToLiveMatch() {
    const matches = (this.store && this.store.data && this.store.data.matches) || [];
    const liveMatches = matches.filter(m => m.status === "live");

    // Deteksi kategori laga yang sedang live (SD atau SMP)
    let targetCat = this.currentCategory || "SMP";
    if (liveMatches.length > 0) {
      const firstLive = liveMatches[0];
      targetCat = (firstLive.category || (firstLive.id && firstLive.id.includes("_SD") ? "SD" : "SMP")).toUpperCase();
      if (targetCat !== "SD" && targetCat !== "SMP") {
        targetCat = "SMP";
      }
    }

    // Set kategori secara menyeluruh (sinkronkan tab switcher, floating category menu & data)
    this.setCategory(targetCat, true);

    // Beralih ke tab Jadwal & Skor (pane-matches)
    this.switchTab("matches");

    // Atur filter status agar menonjolkan pertandingan live
    this.filterStatus = "live";
    document.querySelectorAll(".status-filter-pills .filter-pill").forEach(p => {
      p.classList.toggle("active", p.dataset.status === "live");
    });

    this.renderMatches();

    setTimeout(() => {
      const liveCard = document.querySelector(".match-card.status-live, .match-card.is-live");
      if (liveCard) {
        liveCard.scrollIntoView({ behavior: "smooth", block: "center" });
        liveCard.classList.add("highlight-pulse");
        setTimeout(() => liveCard.classList.remove("highlight-pulse"), 2500);
      } else {
        const list = document.getElementById("matchesList");
        if (list) list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);
  },

  initScrollReveal() {
    // Konten tab yang sedang aktif langsung revealed 100% instan (< 1ms) tanpa animasi delay
    const activePane = document.querySelector(".tab-pane.active");
    if (activePane) {
      activePane.querySelectorAll(".scroll-reveal, .match-card, .group-card, .team-card, .sponsor-card-primary, .sponsor-card-secondary, .moment-card").forEach(el => {
        el.classList.add("is-revealed");
      });
    }

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".scroll-reveal").forEach(el => el.classList.add("is-revealed"));
      return;
    }

    if (this._scrollObserver) {
      this._scrollObserver.disconnect();
    }

    this._scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          if (entry.target.classList.contains("home-slide-section")) {
            this.updateActiveSlideNav(entry.target.id);
          } else {
            observer.unobserve(entry.target);
          }
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: "60px 0px 60px 0px"
    });

    // Observe all scroll-reveal containers and cards for dynamic staggered entrance
    document.querySelectorAll(".home-slide-section, .scroll-reveal:not(.is-revealed), .match-card:not(.is-revealed), .sponsor-card-primary:not(.is-revealed), .sponsor-card-secondary:not(.is-revealed), .moment-card:not(.is-revealed), .group-card:not(.is-revealed), .team-card:not(.is-revealed)").forEach(el => {
      if (!el.classList.contains("scroll-reveal")) {
        el.classList.add("scroll-reveal");
      }
      this._scrollObserver.observe(el);
    });
  },

  updateActiveSlideNav(slideId) {
    if (!slideId) return;
    const dots = document.querySelectorAll(".slide-nav-dot");
    dots.forEach(dot => {
      dot.classList.toggle("active", dot.dataset.target === slideId);
    });
  },

  initHomeSlideNavigation() {
    const dots = document.querySelectorAll(".slide-nav-dot");
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        const targetId = dot.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          this.updateActiveSlideNav(targetId);
        }
      });
    });
  },

  scrollPastHero() {
    const target = document.getElementById("homeStatsShowcase") || document.getElementById("liveStreamHero");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  scrollToLiveStream() {
    const liveMatches = (this.store && this.store.data && this.store.data.matches || []).filter(m => m.status === "live");
    if (liveMatches.length > 0) {
      return this.jumpToLiveMatch();
    }
    if (this.currentTab !== "home") {
      this.switchTab("home");
    }
    setTimeout(() => {
      const liveSection = document.getElementById("liveStreamHero");
      if (liveSection) {
        liveSection.scrollIntoView({ behavior: "smooth", block: "start" });
        const card = liveSection.querySelector(".live-stream-card");
        if (card) {
          card.classList.add("highlight-pulse");
          setTimeout(() => card.classList.remove("highlight-pulse"), 2000);
        }
      }
    }, 120);
  },

  bindEvents() {
    // Dynamic Scroll-Driven Size Transition on Sticky Header (rAF Throttled)
    const headerEl = document.querySelector(".header");
    if (headerEl) {
      let isHeaderScrolled = false;
      let headerTick = false;
      const onScrollHeader = () => {
        if (!headerTick) {
          window.requestAnimationFrame(() => {
            const scrolled = (window.scrollY || window.pageYOffset || 0) > 20;
            if (scrolled !== isHeaderScrolled) {
              isHeaderScrolled = scrolled;
              headerEl.classList.toggle("scrolled", isHeaderScrolled);
            }
            headerTick = false;
          });
          headerTick = true;
        }
      };
      window.addEventListener("scroll", onScrollHeader, { passive: true });
    }

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
        const btn = e.target.closest(".mobile-nav-item") || e.currentTarget;
        const tab = btn?.dataset?.tab;
        if (tab) this.switchTab(tab);
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

    const teamFilter = document.getElementById("filterTeam");
    if (teamFilter) {
      teamFilter.addEventListener("change", (e) => {
        this.filterTeam = e.target.value;
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

    // Modal Close buttons (hanya menutup modal miliknya sendiri, TIDAK menutup semua modal!)
    const readOnlyViewerModals = ["teamModal", "matchDetailModal", "momentModal", "newsModal"];
    document.querySelectorAll(".modal-close, .btn-modal-close").forEach(btn => {
      // Jika tombol sudah punya handler onclick khusus (seperti konfirmasi keluar editor), biarkan handler tersebut bekerja
      if (btn.getAttribute("onclick")) return;
      btn.addEventListener("click", () => {
        const parentModal = btn.closest(".modal-overlay");
        if (parentModal) {
          parentModal.classList.remove("active");
          if (parentModal.id === "sponsorEditorModal") {
            try { app.renderSponsors(); } catch (_) { }
          }
        }
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("modal-open");
        }
      });
    });

    // Backdrop clicks: HANYA modal baca-saja (viewer) yang boleh ditutup lewat klik luar.
    // SEMUA modal editor, input tim, folder batch upload, jadwal, skor, sponsor, momen, media hub DIKUNCI ANTI-KELUAR!
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      let mouseDownTarget = null;
      overlay.addEventListener("mousedown", (e) => {
        mouseDownTarget = e.target;
      });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay && mouseDownTarget === overlay) {
          if (!readOnlyViewerModals.includes(overlay.id)) {
            const box = overlay.querySelector(".modal-box");
            if (box) {
              box.classList.remove("modal-shake");
              void box.offsetWidth;
              box.classList.add("modal-shake");
            }
            return;
          }
          overlay.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("modal-open");
          }
        }
        mouseDownTarget = null;
      });
    });

    // Proteksi Browser Refresh / Tab Close (F5 / Ctrl+W) saat sedang mengisi form
    window.addEventListener("beforeunload", (e) => {
      if (this.isUserEditing()) {
        if (window.admin && typeof window.admin.saveAllActiveDrafts === "function") {
          try { window.admin.saveAllActiveDrafts(); } catch (_) { }
        }
        e.preventDefault();
        e.returnValue = "Anda sedang dalam proses pengisian data. Yakin ingin keluar?";
        return e.returnValue;
      }
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

    // Mobile swipe-back gesture & modern full-page routing (Clean URL & History API)
    window.addEventListener("popstate", (e) => {
      // 1. Tutup mobile menu overlay jika sedang terbuka
      if (this._isMobileMenuOpen) {
        this.closeMobileMenu();
        return;
      }

      // 2. Jika ada popup modal aktif
      const activeModals = Array.from(document.querySelectorAll(".modal-overlay.active"));
      if (activeModals.length > 0) {
        const topModal = activeModals[activeModals.length - 1];
        if (!readOnlyViewerModals.includes(topModal.id)) {
          try { history.pushState({ tab: this.currentTab, editing: true }, ""); } catch (err) { }
          const box = topModal.querySelector(".modal-box");
          if (box) {
            box.classList.remove("modal-shake");
            void box.offsetWidth;
            box.classList.add("modal-shake");
          }
          return;
        }
        topModal.classList.remove("active");
        return;
      }

      // 3. Jika splash screen masih aktif, sembunyikan splash screen
      const splash = document.getElementById("appSplashScreen");
      if (splash && !splash.classList.contains("splash-fade-out") && splash.style.display !== "none") {
        this.dismissSplashScreen();
        return;
      }

      // 4. Jika ada state riwayat eksplisit
      if (e.state) {
        if (e.state.tab === "player-detail" && e.state.teamId && e.state.playerId) {
          this.openPlayerDetailPage(e.state.teamId, e.state.playerId, false);
          return;
        }
        if (e.state.tab === "team-detail" && e.state.teamId) {
          this.openTeamDetailPage(e.state.teamId, false);
          return;
        }
        if (e.state.tab) {
          this.switchTab(e.state.tab, false);
          return;
        }
      }

      // 5. Fallback ke pembacaan path URL browser
      this.parseCurrentRoute(false);
    });

    // Jalankan routing otomatis saat halaman pertama kali dimuat
    try {
      this.parseCurrentRoute(false);
    } catch (_) { }

    window.addEventListener("resize", () => {
      this.fitOfficialSponsorTitle();
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.fitOfficialSponsorTitle(), 150);
    });
    setTimeout(() => this.fitOfficialSponsorTitle(), 300);
  },

  // =========================================================
  // MOBILE HAMBURGER & MODERN ROUTER METHODS
  // =========================================================
  toggleMobileMenu() {
    if (this._isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    this._isMobileMenuOpen = true;
    const btn = document.getElementById("btnMobileMenu");
    const overlay = document.getElementById("mobileMenuOverlay");
    if (btn) btn.classList.add("active");
    if (overlay) overlay.classList.add("open");
    document.body.classList.add("mobile-menu-active");
    document.body.style.overflow = "hidden";

    // Sinkronkan active state link di mobile menu
    document.querySelectorAll(".mobile-nav-link").forEach(link => {
      const isAct = link.dataset.tab === this.currentTab ||
        ((this.currentTab === "team-detail" || this.currentTab === "player-detail") && link.dataset.tab === "teams");
      link.classList.toggle("active", isAct);
    });
  },

  closeMobileMenu(e) {
    if (e && e.target && e.target.classList.contains("mobile-menu-content")) return;
    this._isMobileMenuOpen = false;
    const btn = document.getElementById("btnMobileMenu");
    const overlay = document.getElementById("mobileMenuOverlay");
    if (btn) btn.classList.remove("active");
    if (overlay) {
      overlay.classList.remove("open");
      overlay.style.pointerEvents = "none";
      overlay.style.visibility = "hidden";
      overlay.style.opacity = "0";
    }
    document.body.classList.remove("mobile-menu-active");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  },

  navigateTo(path, tabId, data = null, pushHistory = true) {
    this.closeMobileMenu();

    if (tabId === "team-detail" && data && data.teamId) {
      this.openTeamDetailPage(data.teamId, pushHistory, path);
      return;
    }
    if (tabId === "player-detail" && data && data.teamId && data.playerId) {
      this.openPlayerDetailPage(data.teamId, data.playerId, pushHistory, path);
      return;
    }

    this.switchTab(tabId, pushHistory, path);
  },

  parseCurrentRoute(pushHistory = false) {
    let path = window.location.pathname || "";
    if (window.location.hash && window.location.hash.startsWith("#/")) {
      path = window.location.hash.slice(1);
    }

    // Pola 1: Detail Pemain (/daftar-tim/detail-tim/:teamId/detail-pemain/:playerId)
    const playerMatch = path.match(/\/daftar-tim\/detail-tim\/([^/]+)\/detail-pemain\/([^/]+)/i);
    if (playerMatch) {
      const teamId = decodeURIComponent(playerMatch[1]);
      const playerId = decodeURIComponent(playerMatch[2]);
      this.openPlayerDetailPage(teamId, playerId, pushHistory);
      return;
    }

    // Pola 2: Detail Tim (/daftar-tim/detail-tim/:teamId)
    const teamMatch = path.match(/\/daftar-tim\/detail-tim\/([^/]+)/i);
    if (teamMatch) {
      const teamId = decodeURIComponent(teamMatch[1]);
      this.openTeamDetailPage(teamId, pushHistory);
      return;
    }

    // Pola 2b: Detail Pertandingan (/jadwal-skor/detail-laga/:matchId)
    const matchDetailMatch = path.match(/\/jadwal-skor\/detail-laga\/([^/]+)/i);
    if (matchDetailMatch) {
      const matchId = decodeURIComponent(matchDetailMatch[1]);
      this.showMatchDetail(matchId);
      return;
    }

    // Pola 3: Rute Standar Turnamen
    const tabMap = {
      "/": "home",
      "/beranda": "home",
      "/jadwal": "matches",
      "/klasemen": "standings",
      "/draw": "draw",
      "/bagan": "bracket",
      "/tim": "teams",
      "/daftar-tim": "teams",
      "/statistik": "stats",
      "/stats": "stats",
      "/top-skor": "stats",
      "/disiplin": "stats",
      "/regulasi": "juknis"
    };

    const cleanPath = path.replace(/\/$/, "");
    if (cleanPath && tabMap[cleanPath]) {
      this.switchTab(tabMap[cleanPath], pushHistory, cleanPath);
    } else {
      this.switchTab(this.currentTab || "home", pushHistory);
    }
  },

  // =========================================================
  // FULL-PAGE INTERACTION: DETAIL TIM & DETAIL PEMAIN (100% DINAMIS)
  // =========================================================
  openTeamDetailPage(teamId, pushHistory = true, customPath = null) {
    if (this._isMobileMenuOpen) this.closeMobileMenu();

    this._pendingDetailTeamId = teamId;
    this.currentTab = "team-detail";

    // Pastikan scroll normal dan sembunyikan floating switcher saat di detail tim
    document.documentElement.classList.remove("snap-scroll-active");
    document.body.classList.remove("snap-scroll-active");
    this.updateFloatingCategoryVisibility();

    // Matikan indikator navbar aktif agar fokus ke detail page
    document.querySelectorAll(".tab-btn, .mobile-nav-item").forEach(b => b.classList.remove("active"));

    // Tampilkan pane detail tim & sembunyikan semua pane lain secara instan
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.remove("active");
      pane.style.display = "none";
    });
    const targetPane = document.getElementById("pane-team-detail");
    if (targetPane) {
      targetPane.classList.add("active");
      targetPane.style.display = "block";
    }

    if (this.store && typeof this.store.syncPlayerStatsFromMatches === "function") {
      try { this.store.syncPlayerStatsFromMatches(); } catch (_) { }
    }

    const team = this.store.getTeam(teamId);
    if (!team) {
      // Pertahankan rute detail-tim, jangan switchTab('teams') karena data sedang dimuat dari Cloud Supabase
      const container = document.getElementById("teamDetailPageContainer");
      if (container) {
        container.innerHTML = `
          <div class="fullpage-nav-bar">
            <button type="button" class="btn-fullpage-back" onclick="app.navigateTo('/tim', 'teams')">
              <span>←</span> Kembali ke Daftar Tim
            </button>
            <div style="font-size: 0.76rem; color: #94a3b8;">
              Turnamen Futsal ACC 2026 / Profil Tim
            </div>
          </div>
          <div style="text-align: center; padding: 60px 16px; color: var(--text-muted);">
            <div class="spinner-sm" style="margin: 0 auto 16px auto; width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent-gold); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #ffffff;">Memuat Profil Tim...</div>
            <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 6px;">Menghubungkan ke data online Cloud Supabase</div>
          </div>
        `;
      }
      return;
    }

    // Lazy load skuad & foto pemain hanya saat halaman profil tim dibuka
    if ((!team.players || team.players.length === 0) && window.SupabaseService && typeof window.SupabaseService.fetchTeamFull === 'function') {
      window.SupabaseService.fetchTeamFull(team.id).then(full => {
        if (full && Array.isArray(full.players) && full.players.length > 0) {
          team.players = full.players;
          if (full.coach_photo && (!team.official || !team.official.coachPhoto)) {
            if (!team.official) team.official = {};
            team.official.coachPhoto = full.coach_photo;
          }
          if (full.manager_photo && (!team.official || !team.official.managerPhoto)) {
            if (!team.official) team.official = {};
            team.official.managerPhoto = full.manager_photo;
          }
          this.store.saveData();
          if (this.currentTab === "team-detail" && this._pendingDetailTeamId === team.id) {
            this.openTeamDetailPage(team.id, false);
          }
        }
      }).catch(() => { });
    }

    const path = customPath || `/daftar-tim/detail-tim/${encodeURIComponent(team.id)}`;
    if (pushHistory) {
      try {
        history.pushState({ tab: "team-detail", teamId: team.id }, "", path);
      } catch (_) { }
    }

    // Hitung statistik turnamen tim secara aktual dari data.matches (TIDAK ADA DATA STATIS)
    let mp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
    const teamMatches = (this.store.data.matches || []).filter(m =>
      (m.homeId === team.id || m.awayId === team.id)
    );

    teamMatches.forEach(m => {
      if (m.status !== "finished") return;
      const isHome = m.homeId === team.id;
      const myScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      mp++;
      gf += myScore;
      ga += oppScore;
      if (myScore > oppScore) w++;
      else if (myScore < oppScore) l++;
      else d++;
    });

    const gd = gf - ga;
    const pts = (w * 3) + d;
    const off = team.official || {};
    const waLink = this.getWhatsAppUrl(off.phone || "", `Halo Official ${team.name}, informasi ACC 2026`);

    // Roster pemain dinamis dengan kalkulasi gol & kartu dari matches aktual
    const playersHtml = (team.players || []).map(p => {
      const pName = (p.name || "").trim();
      const pNameLower = pName.toLowerCase();
      const pNo = p.no ? String(p.no).trim() : "";
      let goalsCount = 0;
      let assistsCount = 0;
      let ycCount = 0;
      let rcCount = 0;

      (this.store.data.matches || []).forEach(m => {
        const isHome = m.homeId === team.id;
        const isAway = m.awayId === team.id;
        if (!isHome && !isAway) return;

        const matchScorers = (Array.isArray(m.scorers) && m.scorers.length > 0) ? m.scorers : (Array.isArray(m.goals) ? m.goals : []);
        matchScorers.forEach(s => {
          if (!s) return;
          const sPlayer = (s.player || "").toLowerCase().trim();
          const isMyTeam = !s.team || s.team === team.id || s.team === team.name || s.team === team.shortName;
          const isOg = Boolean(s.isOwnGoal || s.ownGoal || sPlayer.includes('bunuh diri') || sPlayer.includes('own goal') || sPlayer.includes('(gbd)') || sPlayer.includes('[og]'));
          const isPlayer = sPlayer === pNameLower ||
            sPlayer === `${pNameLower} (#${pNo})` ||
            (pNo && sPlayer.includes(`#${pNo}`)) ||
            (sPlayer.length > 3 && pNameLower.includes(sPlayer)) ||
            (pNameLower.length > 3 && sPlayer.includes(pNameLower));
          if (isMyTeam && isPlayer && !isOg) {
            goalsCount++;
          }
          if (s.assist) {
            const aPlayer = (s.assist || "").toLowerCase().trim();
            const isAssistPlayer = aPlayer === pNameLower ||
              aPlayer === `${pNameLower} (#${pNo})` ||
              (pNo && aPlayer.includes(`#${pNo}`)) ||
              (aPlayer.length > 3 && pNameLower.includes(aPlayer)) ||
              (pNameLower.length > 3 && aPlayer.includes(pNameLower));
            if (isMyTeam && isAssistPlayer) {
              assistsCount++;
            }
          }
        });

        (m.cards || []).forEach(c => {
          if (!c || c._meta || !c.player || c.player === 'undefined' || c.player === 'null') return;
          const cPlayer = (c.player || "").toLowerCase().trim();
          const isMyTeam = !c.team || c.team === team.id || c.team === team.name || c.team === team.shortName;
          const isPlayer = cPlayer === pNameLower ||
            cPlayer === `${pNameLower} (#${pNo})` ||
            (pNo && cPlayer.includes(`#${pNo}`)) ||
            (cPlayer.length > 3 && pNameLower.includes(cPlayer)) ||
            (pNameLower.length > 3 && cPlayer.includes(pNameLower));
          if (isMyTeam && isPlayer) {
            if (c.type === "yellow") ycCount++;
            else if (c.type === "red") rcCount++;
          }
        });
      });

      goalsCount = Math.max(goalsCount, parseInt(p.goals, 10) || 0);
      assistsCount = Math.max(assistsCount, parseInt(p.assists, 10) || 0);
      ycCount = Math.max(ycCount, parseInt(p.yc, 10) || 0);
      rcCount = Math.max(rcCount, parseInt(p.rc, 10) || 0);

      const playerKey = p.id || p.no || p.name;
      const detailUrl = `/daftar-tim/detail-tim/${encodeURIComponent(team.id)}/detail-pemain/${encodeURIComponent(playerKey)}`;

      return `
        <div class="player-interactive-card" onclick="app.navigateTo('${detailUrl}', 'player-detail', { teamId: '${team.id}', playerId: '${encodeURIComponent(playerKey)}' })">
          <div class="player-card-left">
            <div class="player-jersey-badge">#${p.no || '-'}</div>
            <div class="player-card-info">
              <div class="player-card-name">${typeof Security !== 'undefined' ? Security.sanitize(p.name || 'Pemain') : (p.name || 'Pemain')}</div>
              <div class="player-card-tags">
                <span class="player-tag pos">${typeof Security !== 'undefined' ? Security.sanitize(p.pos || 'Flank') : (p.pos || 'Flank')}</span>
                ${goalsCount > 0 ? `<span class="player-tag goal">⚽ ${goalsCount} Gol</span>` : ''}
                ${assistsCount > 0 ? `<span class="player-tag assist" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3);">🎯 ${assistsCount} Ast</span>` : ''}
                ${ycCount > 0 ? `<span class="player-tag yc">🟨 ${ycCount}</span>` : ''}
                ${rcCount > 0 ? `<span class="player-tag rc">🟥 ${rcCount}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="player-card-action">➔</div>
        </div>
      `;
    }).join("");

    // Riwayat laga turnamen tim
    const matchHistoryHtml = teamMatches.length > 0 ? teamMatches.map(m => {
      const isHome = m.homeId === team.id;
      const oppId = isHome ? m.awayId : m.homeId;
      const opp = this.store.getTeam(oppId);
      const oppName = opp ? opp.name : ("Tim " + oppId);
      const myScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      const isFin = m.status === "finished";
      const isLive = m.status === "live";

      let statusBadge = `<span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 99px; background: rgba(255,255,255,0.08); color: #cbd5e1;">Terjadwal</span>`;
      if (isFin) {
        const isWin = (myScore || 0) > (oppScore || 0);
        const isLoss = (myScore || 0) < (oppScore || 0);
        const winBg = isWin ? 'background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.4);' : (isLoss ? 'background: rgba(239,68,68,0.2); color: #ef4444;' : 'background: rgba(245,158,11,0.2); color: #f59e0b;');
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; ${winBg}">${isWin ? 'MENANG' : (isLoss ? 'KALAH' : 'SERI')} (${myScore} - ${oppScore})</span>`;
      } else if (isLive) {
        statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: rgba(239,68,68,0.25); color: #ef4444; border: 1px solid #ef4444;">● LIVE</span>`;
      }

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">
          <div>
            <div style="font-size: 0.84rem; font-weight: 700; color: #ffffff;">vs ${typeof Security !== 'undefined' ? Security.sanitize(oppName) : oppName}</div>
            <div style="font-size: 0.70rem; color: #94a3b8; margin-top: 2px;">${m.time || 'Waktu Pertandingan'} • Lapangan ${m.pitch || '1'}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
      `;
    }).join("") : `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 12px;">Belum ada riwayat pertandingan untuk tim ini.</p>`;

    const container = document.getElementById("teamDetailPageContainer");
    if (container) {
      container.innerHTML = `
        <div class="fullpage-nav-bar">
          <button type="button" class="btn-fullpage-back" onclick="app.navigateTo('/tim', 'teams')">
            <span>←</span> Kembali ke Daftar Tim
          </button>
          <div style="font-size: 0.76rem; color: #94a3b8;">
            Turnamen Futsal ACC 2026 / Profil Tim
          </div>
        </div>

        <div class="team-hero-card">
          <div class="team-hero-inner">
            <div class="team-hero-emblem-wrap">
              ${team.logo ? `<img src="${team.logo}" alt="${team.name}" class="team-hero-emblem">` : `<span style="font-size: 2rem;">🏆</span>`}
            </div>
            <div class="team-hero-meta" style="flex: 1;">
              <div class="team-badge-row">
                <span style="font-size: 0.72rem; font-weight: 800; padding: 3px 10px; border-radius: 99px; background: rgba(245,158,11,0.2); color: var(--accent-gold); border: 1px solid rgba(245,158,11,0.4);">
                  Grup ${team.group && team.group !== '-' ? team.group : 'Belum Diundi'} • ${team.category || 'SMP'}
                </span>
                <span style="font-size: 0.72rem; padding: 3px 10px; border-radius: 99px; background: rgba(255,255,255,0.08); color: #e2e8f0;">
                  📍 ${typeof Security !== 'undefined' ? Security.sanitize(team.city || 'Sulawesi Selatan') : (team.city || 'Sulawesi Selatan')}
                </span>
              </div>
              <h1>${typeof Security !== 'undefined' ? Security.sanitize(team.name) : team.name}</h1>
              <p>Official Pelatih: <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(off.coach || '-') : (off.coach || '-')}</strong></p>
              <p style="margin-top: 3px;">Manager: <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(off.manager || '-') : (off.manager || '-')}</strong> • Medis: <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(off.medic || '-') : (off.medic || '-')}</strong></p>
            </div>
          </div>

          <div class="fullpage-stats-grid">
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val">${mp}</div>
              <div class="fullpage-stat-lbl">Main</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val green">${w}</div>
              <div class="fullpage-stat-lbl">Menang</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val">${d}</div>
              <div class="fullpage-stat-lbl">Seri</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val red">${l}</div>
              <div class="fullpage-stat-lbl">Kalah</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val">${gf}:${ga}</div>
              <div class="fullpage-stat-lbl">Gol (+/-)</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val gold">${pts}</div>
              <div class="fullpage-stat-lbl">Poin</div>
            </div>
          </div>
        </div>

        <div class="fullpage-section-card">
          <div class="fullpage-section-title">
            <span>👕</span> Informasi Jersey Tim
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 0.82rem;">
            <div style="padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);">
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Jersey Utama (Home):</span>
              <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(off.jerseyHome || 'Kostum Utama') : (off.jerseyHome || 'Kostum Utama')}</strong>
            </div>
            <div style="padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);">
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Jersey Cadangan (Away):</span>
              <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(off.jerseyAway || 'Kostum Cadangan') : (off.jerseyAway || 'Kostum Cadangan')}</strong>
            </div>
          </div>
        </div>

        <div class="fullpage-section-card">
          <div class="fullpage-section-title" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>👥</span> Skuad Pemain Resmi (${(team.players || []).length} Pemain)
            </div>
            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 500;">Klik kartu pemain untuk detail</span>
          </div>
          <div class="roster-interactive-grid">
            ${playersHtml || `<p style="color: var(--text-muted); padding: 16px;">Belum ada pemain yang terdaftar dalam tim ini.</p>`}
          </div>
        </div>

        <div class="fullpage-section-card">
          <div class="fullpage-section-title">
            <span>🏟️</span> Jadwal & Riwayat Pertandingan Tim
          </div>
          <div>${matchHistoryHtml}</div>
        </div>
      `;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  openPlayerDetailPage(teamId, playerIdOrName, pushHistory = true, customPath = null) {
    if (this._isMobileMenuOpen) this.closeMobileMenu();

    this._pendingDetailTeamId = teamId;
    this._pendingDetailPlayerId = playerIdOrName;
    this.currentTab = "player-detail";

    // Pastikan scroll normal dan sembunyikan floating switcher saat di detail pemain
    document.documentElement.classList.remove("snap-scroll-active");
    document.body.classList.remove("snap-scroll-active");
    this.updateFloatingCategoryVisibility();

    // Matikan indikator navbar aktif agar fokus ke detail page
    document.querySelectorAll(".tab-btn, .mobile-nav-item").forEach(b => b.classList.remove("active"));

    // Tampilkan pane detail pemain & sembunyikan semua pane lain secara instan
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.remove("active");
      pane.style.display = "none";
    });
    const targetPane = document.getElementById("pane-player-detail");
    if (targetPane) {
      targetPane.classList.add("active");
      targetPane.style.display = "block";
    }

    if (this.store && typeof this.store.syncPlayerStatsFromMatches === "function") {
      try { this.store.syncPlayerStatsFromMatches(); } catch (_) { }
    }

    const team = this.store.getTeam(teamId);
    if (!team) {
      // Pertahankan rute detail-pemain, jangan switchTab('teams') karena data sedang dimuat dari Cloud Supabase
      const container = document.getElementById("playerDetailPageContainer");
      if (container) {
        container.innerHTML = `
          <div class="fullpage-nav-bar">
            <button type="button" class="btn-fullpage-back" onclick="app.navigateTo('/tim', 'teams')">
              <span>←</span> Kembali ke Daftar Tim
            </button>
            <div style="font-size: 0.76rem; color: #94a3b8;">
              Turnamen Futsal ACC 2026 / Profil Pemain
            </div>
          </div>
          <div style="text-align: center; padding: 60px 16px; color: var(--text-muted);">
            <div class="spinner-sm" style="margin: 0 auto 16px auto; width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent-gold); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #ffffff;">Memuat Profil Pemain...</div>
            <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 6px;">Menghubungkan ke data online Cloud Supabase</div>
          </div>
        `;
      }
      return;
    }

    const decodedId = decodeURIComponent(playerIdOrName);
    const player = (team.players || []).find(p =>
      String(p.id) === decodedId ||
      String(p.no) === decodedId ||
      (p.name && p.name.trim().toLowerCase() === decodedId.trim().toLowerCase())
    ) || { name: decodedId, no: '-', pos: 'Pemain' };

    this.currentTab = "player-detail";
    const path = customPath || `/daftar-tim/detail-tim/${encodeURIComponent(team.id)}/detail-pemain/${encodeURIComponent(player.name || decodedId)}`;
    if (pushHistory) {
      try {
        history.pushState({ tab: "player-detail", teamId: team.id, playerId: decodedId }, "", path);
      } catch (_) { }
    }

    const cleanPName = (player.name || "").toLowerCase().trim();
    const pNo = player.no ? String(player.no).trim() : "";

    // Hitung seluruh statistik pemain secara aktual dari data.matches
    let totalGoals = 0;
    let totalAssists = 0;
    let totalYc = 0;
    let totalRc = 0;
    let matchesCount = 0;
    const playerEventsLog = [];

    (this.store.data.matches || []).forEach(m => {
      let playerInMatch = false;
      const isHome = m.homeId === team.id;
      const isAway = m.awayId === team.id;
      if (!isHome && !isAway) return;

      const oppId = isHome ? m.awayId : m.homeId;
      const opp = this.store.getTeam(oppId);
      const oppName = opp ? (opp.shortName || opp.name) : ("Tim " + oppId);

      // Periksa gol & assist dari match.scorers (dan fallback match.goals)
      const matchScorers = (Array.isArray(m.scorers) && m.scorers.length > 0) ? m.scorers : (Array.isArray(m.goals) ? m.goals : []);
      matchScorers.forEach(s => {
        if (!s) return;
        const sPlayer = (s.player || "").toLowerCase().trim();
        const isMyTeam = !s.team || s.team === team.id || s.team === team.name || s.team === team.shortName;
        const isOg = Boolean(s.isOwnGoal || s.ownGoal || sPlayer.includes('bunuh diri') || sPlayer.includes('own goal') || sPlayer.includes('(gbd)') || sPlayer.includes('[og]'));

        const isPlayer = sPlayer === cleanPName ||
          sPlayer === `${cleanPName} (#${pNo})` ||
          (pNo && sPlayer.includes(`#${pNo}`)) ||
          (sPlayer.length > 3 && cleanPName.includes(sPlayer)) ||
          (cleanPName.length > 3 && sPlayer.includes(cleanPName));

        let minStr = s.minute ? String(s.minute).trim() : "";
        if (minStr && !minStr.endsWith("'")) minStr += "'";
        if (!minStr) minStr = "Laga";

        if (isPlayer) {
          playerInMatch = true;
          if (isOg) {
            playerEventsLog.push({
              type: "own_goal",
              matchTitle: `vs ${oppName}`,
              minute: minStr,
              note: "⚡ Gol Bunuh Diri (Own Goal)"
            });
          } else if (isMyTeam) {
            totalGoals++;
            playerEventsLog.push({
              type: "goal",
              matchTitle: `vs ${oppName}`,
              minute: minStr,
              note: s.assist ? `⚽ Mencetak Gol (Assist: ${s.assist})` : "⚽ Mencetak Gol"
            });
          }
        }

        // Periksa jika pemain memberikan assist
        if (s.assist) {
          const aPlayer = (s.assist || "").toLowerCase().trim();
          const isAssistPlayer = aPlayer === cleanPName ||
            aPlayer === `${cleanPName} (#${pNo})` ||
            (pNo && aPlayer.includes(`#${pNo}`)) ||
            (aPlayer.length > 3 && cleanPName.includes(aPlayer)) ||
            (cleanPName.length > 3 && aPlayer.includes(cleanPName));
          if (isMyTeam && isAssistPlayer) {
            totalAssists++;
            playerInMatch = true;
            playerEventsLog.push({
              type: "assist",
              matchTitle: `vs ${oppName}`,
              minute: minStr,
              note: `🎯 Memberikan Assist (Gol oleh ${s.player})`
            });
          }
        }
      });

      // Periksa kartu
      (m.cards || []).forEach(c => {
        if (!c || c._meta || !c.player || c.player === 'undefined' || c.player === 'null') return;
        const cPlayer = (c.player || "").toLowerCase().trim();
        const isMyTeam = !c.team || c.team === team.id || c.team === team.name || c.team === team.shortName;
        const isPlayer = cPlayer === cleanPName ||
          cPlayer === `${cleanPName} (#${pNo})` ||
          (pNo && cPlayer.includes(`#${pNo}`)) ||
          (cPlayer.length > 3 && cleanPName.includes(cPlayer)) ||
          (cleanPName.length > 3 && cPlayer.includes(cleanPName));

        let minStr = c.minute ? String(c.minute).trim() : "";
        if (minStr && !minStr.endsWith("'")) minStr += "'";
        if (!minStr) minStr = "Laga";

        if (isMyTeam && isPlayer) {
          playerInMatch = true;
          if (c.type === "yellow") {
            totalYc++;
            playerEventsLog.push({
              type: "yellow",
              matchTitle: `vs ${oppName}`,
              minute: minStr,
              note: "🟨 Kartu Kuning"
            });
          } else if (c.type === "red") {
            totalRc++;
            playerEventsLog.push({
              type: "red",
              matchTitle: `vs ${oppName}`,
              minute: minStr,
              note: "🟥 Kartu Merah Langsung"
            });
          }
        }
      });

      if (m.status === "finished") {
        matchesCount++;
      }
    });

    totalGoals = Math.max(totalGoals, parseInt(player.goals, 10) || 0);
    totalAssists = Math.max(totalAssists, parseInt(player.assists, 10) || 0);
    totalYc = Math.max(totalYc, parseInt(player.yc, 10) || 0);
    totalRc = Math.max(totalRc, parseInt(player.rc, 10) || 0);

    let statusLabel = "SIAP BERTANDING (AMAN)";
    let statusBg = "background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.4);";
    if (totalRc >= 1) {
      statusLabel = "SANKSI KARTU MERAH (LARANGAN BERMAIN 1 LAGA)";
      statusBg = "background: rgba(239,68,68,0.25); color: #ef4444; border: 1px solid rgba(239,68,68,0.5);";
    } else if (totalYc >= 2) {
      statusLabel = "AKUMULASI 2 KARTU KUNING (SANKSI 1 LAGA)";
      statusBg = "background: rgba(245,158,11,0.25); color: #f59e0b; border: 1px solid rgba(245,158,11,0.5);";
    } else if (totalYc === 1) {
      statusLabel = "PERINGATAN 1 KARTU KUNING";
      statusBg = "background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid rgba(59,130,246,0.4);";
    }

    const container = document.getElementById("playerDetailPageContainer");
    if (container) {
      container.innerHTML = `
        <div class="fullpage-nav-bar">
          <button type="button" class="btn-fullpage-back" onclick="app.navigateTo('/daftar-tim/detail-tim/${encodeURIComponent(team.id)}', 'team-detail', { teamId: '${team.id}' })">
            <span>←</span> Kembali ke Profil Tim ${typeof Security !== 'undefined' ? Security.sanitize(team.name) : team.name}
          </button>
          <div style="font-size: 0.76rem; color: #94a3b8;">
            Turnamen Futsal ACC 2026 / Profil Pemain
          </div>
        </div>

        <div class="player-hero-card">
          <div class="player-watermark-number">#${player.no || ''}</div>
          <div class="player-hero-inner">
            <div class="player-hero-photo-wrap">
              ${player.photo ? `<img src="${player.photo}" alt="${player.name}" class="player-hero-photo" onerror="this.onerror=null; this.src='assets/acc_logo.png';">` : `<img src="assets/acc_logo.png" alt="ACC 2026" class="player-hero-photo">`}
            </div>
            <div class="player-hero-meta" style="flex: 1;">
              <div class="team-badge-row">
                <span style="font-size: 0.74rem; font-weight: 800; padding: 4px 12px; border-radius: 99px; ${statusBg}">
                  ● ${statusLabel}
                </span>
                <span style="font-size: 0.74rem; padding: 4px 10px; border-radius: 99px; background: rgba(255,255,255,0.08); color: #ffffff;">
                  Posisi: ${typeof Security !== 'undefined' ? Security.sanitize(player.pos || 'Flank') : (player.pos || 'Flank')}
                </span>
              </div>
              <h1>${typeof Security !== 'undefined' ? Security.sanitize(player.name) : player.name} <span style="color: var(--accent-gold);">#${player.no || '-'}</span></h1>
              <p>Asal Tim: <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(team.name) : team.name}</strong> (${team.category || 'SMP'})</p>
              <p style="margin-top: 3px;">Pelatih: <strong style="color: #ffffff;">${typeof Security !== 'undefined' ? Security.sanitize(team.official?.coach || '-') : (team.official?.coach || '-')}</strong></p>
            </div>
          </div>

          <div class="fullpage-stats-grid">
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val green">${totalGoals}</div>
              <div class="fullpage-stat-lbl">Gol Dicetak</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val" style="color: #38bdf8;">${totalAssists}</div>
              <div class="fullpage-stat-lbl">Assist 🎯</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val gold">${totalYc}</div>
              <div class="fullpage-stat-lbl">Kartu Kuning 🟨</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val red">${totalRc}</div>
              <div class="fullpage-stat-lbl">Kartu Merah 🟥</div>
            </div>
            <div class="fullpage-stat-card">
              <div class="fullpage-stat-val">${matchesCount}</div>
              <div class="fullpage-stat-lbl">Laga Selesai Tim</div>
            </div>
          </div>
        </div>

        <div class="fullpage-section-card">
          <div class="fullpage-section-title">
            <span>⚽</span> Riwayat Kontribusi Gol & Pelanggaran Laga
          </div>
          <div>
            ${playerEventsLog.length > 0 ? playerEventsLog.map(ev => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.1); font-family: monospace; font-size: 0.76rem; font-weight: 700; color: #ffffff;">${ev.minute}</span>
                  <div>
                    <strong style="font-size: 0.84rem; color: #ffffff; display: block;">${ev.matchTitle}</strong>
                    <span style="font-size: 0.72rem; color: #94a3b8;">${ev.note}</span>
                  </div>
                </div>
                <div>
                  ${ev.type === 'goal' ? '<span style="font-size: 0.74rem; font-weight: 700; color: #10b981;">+1 Gol</span>' :
          (ev.type === 'assist' ? '<span style="font-size: 0.74rem; font-weight: 700; color: #38bdf8;">+1 Assist</span>' :
            (ev.type === 'yellow' ? '<span style="font-size: 0.74rem; font-weight: 700; color: #f59e0b;">Kartu Kuning</span>' :
              (ev.type === 'own_goal' ? '<span style="font-size: 0.74rem; font-weight: 700; color: #f87171;">Own Goal</span>' : '<span style="font-size: 0.74rem; font-weight: 700; color: #ef4444;">Kartu Merah</span>')))}
                </div>
              </div>
            `).join('') : `
              <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 0.82rem;">
                <span style="font-size: 2rem; display: block; margin-bottom: 8px;">✨</span>
                Pemain bermain bersih dan disiplin — belum ada catatan kartu atau gol dalam rekaman laga.
              </div>
            `}
          </div>
        </div>
      `;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  openTeamModal(teamId) {
    return this.openTeamDetailPage(teamId, true);
  },

  switchTab(tabId, pushHistory = true, customPath = null) {
    try {
      const early = document.getElementById("earlyRouteStyle");
      if (early) early.remove();
      const earlyFloat = document.getElementById("earlyFloatStyle");
      if (earlyFloat) earlyFloat.remove();

      // Force close mobile menu overlay immediately
      const overlay = document.getElementById("mobileMenuOverlay");
      if (overlay) {
        overlay.classList.remove("open");
        overlay.style.pointerEvents = "none";
        overlay.style.visibility = "hidden";
        overlay.style.opacity = "0";
      }
      const menuBtn = document.getElementById("btnMobileMenu");
      if (menuBtn) menuBtn.classList.remove("active");
      this._isMobileMenuOpen = false;
      document.body.classList.remove("mobile-menu-active");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      const tabToPath = {
        home: "/beranda",
        matches: "/jadwal",
        standings: "/klasemen",
        draw: "/draw",
        bracket: "/bagan",
        teams: "/tim",
        stats: "/statistik",
        scorers: "/statistik",
        discipline: "/statistik",
        juknis: "/regulasi"
      };

      const targetPath = customPath || tabToPath[tabId] || ("/" + tabId);

      if (pushHistory && tabId !== this.currentTab) {
        try {
          history.pushState({ tab: tabId }, "", targetPath);
        } catch (err) { }
      }
      this.currentTab = tabId;

      // Update Desktop Tabs
      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
      });

      // Update Mobile Drawer Links
      document.querySelectorAll(".mobile-nav-link").forEach(link => {
        const isAct = link.dataset.tab === tabId ||
          ((tabId === "team-detail" || tabId === "player-detail") && link.dataset.tab === "teams");
        link.classList.toggle("active", isAct);
      });

      // Update Mobile Nav (jika ada)
      document.querySelectorAll(".mobile-nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.tab === tabId);
      });

      // Update Panes with explicit display guarantee
      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
        pane.style.display = "none";
      });
      const targetPane = document.getElementById(`pane-${tabId}`);
      if (targetPane) {
        targetPane.classList.add("active");
        targetPane.style.display = "block";
      }

      const isHomeTab = tabId === "home";
      document.documentElement.classList.toggle("snap-scroll-active", isHomeTab);
      document.body.classList.toggle("snap-scroll-active", isHomeTab);

      this.renderCurrentView();
      this.updateFloatingCategoryVisibility();

      // Instant scroll to top without forcing synchronous layout reflow
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("switchTab error:", err);
    }
  },

  renderCurrentView() {
    try { this.updateHeroLiveBadge(); } catch (e) { }
    try {
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
        case "draw":
          this.renderDrawView();
          break;
        case "bracket":
          this.renderBracket();
          break;
        case "teams":
          this.renderTeams();
          break;
        case "stats":
          this.renderStats();
          break;
        case "discipline":
        case "scorers":
          this.switchTab("stats", false);
          break;
        case "juknis":
          this.renderJuknis();
          break;
        case "team-detail":
          if (this._pendingDetailTeamId) {
            this.openTeamDetailPage(this._pendingDetailTeamId, false);
          }
          break;
        case "player-detail":
          if (this._pendingDetailTeamId && this._pendingDetailPlayerId) {
            this.openPlayerDetailPage(this._pendingDetailTeamId, this._pendingDetailPlayerId, false);
          }
          break;
        case "match-detail":
          if (this.activeDetailMatchId) {
            this.renderMatchDetailPage(this.activeDetailMatchId);
          }
          break;
      }
    } catch (err) {
      console.error("renderCurrentView error for " + this.currentTab, err);
    }
  },

  // 0. RENDER HOME (BERANDA UTAMA)
  renderHome() {
    this.renderLiveStreamHero();
    const homeData = this.store.data.homeData || { mvp: null, mvps: [], news: [], moments: [] };

    // 1. Render Spotlight MVP Section (Dukungan Multi-MVP Carousel Geser)
    this.renderMvpSection();

    // 2. Render News Grid (tampilkan hanya jika ada berita dari data)
    const newsSection = document.getElementById("homeNewsSection");
    const newsContainer = document.getElementById("homeNewsContainer");
    const newsList = Array.isArray(homeData.news) ? homeData.news : [];
    if (newsSection) newsSection.style.display = newsList.length > 0 ? "" : "none";
    if (newsContainer) {
      newsContainer.innerHTML = newsList.map((n, idx) => `
        <div class="news-card scroll-reveal ${idx % 2 === 1 ? 'reveal-right' : ''}" onclick="app.openNewsModal('${n.id}')" style="cursor: pointer;" title="Klik untuk membaca selengkapnya">
          <div class="news-header-meta">
            <span class="news-tag">${n.tag}</span>
            <span class="news-date">📅 ${n.date}</span>
          </div>
          <div class="news-title">${n.title}</div>
          <div class="news-desc">${n.desc}</div>
          <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 700;">ACC Newsroom</span>
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; cursor: pointer;">Baca Selengkapnya ➔</span>
          </div>
        </div>
      `).join("");
    }

    // 3. Render Moments, Sponsors & Hero Banner
    this.renderMoments();
    this.renderHeroBanner();
    this.renderSponsors();
    this.updateAdminVisibility();
    this.initScrollReveal();
  },

  // RENDER ACC 2026 MVP SPOTLIGHT (HORIZONTAL SWIPABLE CAROUSEL)
  renderMvpSection() {
    const mvpSection = document.getElementById("mvpSpotlightSection");
    if (!mvpSection) return;

    const isAdmin = this.isAdmin();
    const adminActions = document.getElementById("mvpAdminActions");
    const emptyNotice = document.getElementById("mvpEmptyAdminNotice");
    const carouselWrapper = document.getElementById("mvpCarouselWrapper");
    const track = document.getElementById("mvpCarouselTrack");
    const dotsContainer = document.getElementById("mvpCarouselDots");

    if (adminActions) adminActions.style.display = isAdmin ? "block" : "none";

    const homeData = this.store.data.homeData || {};
    let mvps = Array.isArray(homeData.mvps) ? homeData.mvps : [];
    if (mvps.length === 0 && homeData.mvp && homeData.mvp.name) {
      mvps = [homeData.mvp];
    }

    if (mvps.length === 0) {
      if (isAdmin) {
        mvpSection.style.display = "block";
        if (emptyNotice) emptyNotice.style.display = "block";
        if (carouselWrapper) carouselWrapper.style.display = "none";
        if (dotsContainer) dotsContainer.style.display = "none";
      } else {
        mvpSection.style.display = "none";
      }
      return;
    }

    mvpSection.style.display = "block";
    if (emptyNotice) emptyNotice.style.display = "none";
    if (carouselWrapper) carouselWrapper.style.display = "block";

    const btnPrev = document.getElementById("btnPrevMvp");
    const btnNext = document.getElementById("btnNextMvp");
    if (btnPrev) btnPrev.style.display = mvps.length > 1 ? "flex" : "none";
    if (btnNext) btnNext.style.display = mvps.length > 1 ? "flex" : "none";

    if (track) {
      track.innerHTML = mvps.map((mvp, idx) => {
        const pName = mvp.name || "Bintang Lapangan";
        const pNum = mvp.number ? `(#${mvp.number})` : "";
        const pTeam = mvp.team || "-";
        const pCat = mvp.category ? `[${mvp.category}] ` : "";
        const pPos = mvp.pos || mvp.position ? `Posisi: ${mvp.pos || mvp.position}` : "";
        const pBadge = mvp.badge || "MVP MATCHDAY";
        const pTagline = mvp.tagline || "PERFORMA GEMILANG &amp; FAIR PLAY";
        const pPhoto = mvp.photo || "/assets/acc_logo.webp";
        const pGoals = parseInt(mvp.goals, 10) || 0;
        const pAssists = parseInt(mvp.assists, 10) || 0;
        const pMotm = mvp.motm || `${mvp.motmCount || 1}x`;
        const pRating = mvp.rating || this.calculatePlayerRating(mvp);
        const pQuote = mvp.quote ? `"${mvp.quote}"` : "";

        return `
          <div class="mvp-carousel-slide" data-index="${idx}">
            <div class="mvp-spotlight-card">
              <div class="mvp-photo-wrapper">
                <img src="${pPhoto}" alt="Foto ${pName}" class="mvp-photo-img" width="160" height="200" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/assets/acc_logo.webp'">
                <div class="mvp-badge-overlay">
                  <span>🏆</span> <span>${pBadge}</span>
                </div>
              </div>

              <div class="mvp-details-col">
                <div class="mvp-tagline">
                  <span>🔥</span> <span>${pTagline}</span>
                </div>
                <div class="mvp-player-name">${pName} ${pNum}</div>
                <div class="mvp-team-row">
                  <span>${pTeam}</span>
                  ${pPos ? `<span>•</span><span style="color: var(--secondary);">${pPos}</span>` : ""}
                </div>

                <div class="mvp-stats-grid">
                  <div class="mvp-stat-box">
                    <div class="mvp-stat-val">${pGoals}</div>
                    <div class="mvp-stat-lbl">GOL</div>
                  </div>
                  <div class="mvp-stat-box">
                    <div class="mvp-stat-val">${pAssists}</div>
                    <div class="mvp-stat-lbl">ASSIST</div>
                  </div>
                  <div class="mvp-stat-box">
                    <div class="mvp-stat-val">${pMotm}</div>
                    <div class="mvp-stat-lbl">Man of the Match</div>
                  </div>
                  <div class="mvp-stat-box">
                    <div class="mvp-stat-val" style="color: var(--accent-gold);">${pRating}</div>
                    <div class="mvp-stat-lbl">Rating Performa</div>
                  </div>
                </div>

                ${pQuote ? `<div class="mvp-quote-box"><p>${pQuote}</p></div>` : ""}

                <div style="display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; align-items: center;">
                  <button class="btn btn-outline btn-sm" onclick="app.switchTab('stats')">
                    ⚽ Lihat Statistik Turnamen Lengkap
                  </button>
                  ${isAdmin ? `
                    <button class="btn btn-admin btn-sm" onclick="admin.openEditMvpItemModal('${mvp.id || idx}')" style="font-size: 0.75rem; padding: 4px 10px;">
                      ✏️ Edit MVP
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="admin.deleteMvpItem('${mvp.id || idx}')" style="font-size: 0.75rem; padding: 4px 10px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
                      🗑️ Hapus
                    </button>
                  ` : ""}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");

      if (!track._scrollBound) {
        track._scrollBound = true;
        track.addEventListener("scroll", () => {
          this.updateMvpCarouselDots();
        }, { passive: true });
      }
    }

    if (dotsContainer) {
      if (mvps.length > 1) {
        dotsContainer.style.display = "flex";
        dotsContainer.innerHTML = mvps.map((_, i) => `
          <div class="mvp-dot ${i === 0 ? 'active' : ''}" onclick="app.goToMvpSlide(${i})" title="Pemain ${i + 1}"></div>
        `).join("");
      } else {
        dotsContainer.style.display = "none";
      }
    }
  },

  updateMvpCarouselDots() {
    const track = document.getElementById("mvpCarouselTrack");
    const dotsContainer = document.getElementById("mvpCarouselDots");
    if (!track || !dotsContainer) return;
    const dots = dotsContainer.querySelectorAll(".mvp-dot");
    if (!dots || dots.length <= 1) return;
    const slideWidth = track.clientWidth || 1;
    const activeIdx = Math.min(dots.length - 1, Math.max(0, Math.round(track.scrollLeft / slideWidth)));
    dots.forEach((d, idx) => {
      d.classList.toggle("active", idx === activeIdx);
    });
  },

  scrollMvpCarousel(dir) {
    const track = document.getElementById("mvpCarouselTrack");
    if (!track) return;
    const slideWidth = track.clientWidth || 300;
    track.scrollBy({ left: dir * slideWidth, behavior: "smooth" });
  },

  goToMvpSlide(index) {
    const track = document.getElementById("mvpCarouselTrack");
    if (!track) return;
    const slideWidth = track.clientWidth || 300;
    track.scrollTo({ left: index * slideWidth, behavior: "smooth" });
  },

  // RENDER ACC 2026 MOMENTS™ (FIFA WORLD CUP STYLE CAROUSEL)
  renderMoments() {
    const container = document.getElementById("momentsCarousel");
    if (!container) return;

    const moments = Array.isArray(this.store.data.moments) ? this.store.data.moments : [];

    if (moments.length === 0) {
      container.classList.remove("is-centered");
      container.innerHTML = `
        <div style="color: #94a3b8; font-size: 0.88rem; padding: 36px 20px; text-align: center; width: 100%; background: rgba(15, 23, 42, 0.4); border-radius: 18px; border: 1px dashed rgba(255, 255, 255, 0.15);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📸</div>
          <div style="font-weight: 800; color: #f8fafc; font-size: 1rem; margin-bottom: 6px;">Belum Ada Sorotan Momen</div>
          <p style="margin: 0; font-size: 0.8rem; color: #94a3b8; max-width: 440px; margin: 0 auto;">
            Momen spektakuler pertandingan akan ditampilkan di sini setelah diunggah oleh panitia.
          </p>
        </div>
      `;
      return;
    }

    if (moments.length <= 3) {
      container.classList.add("is-centered");
    } else {
      container.classList.remove("is-centered");
    }

    const isAdmin = this.isAdmin();
    container.innerHTML = moments.map(m => {
      const photoUrl = m.image || m.media_url || m.mediaUrl || 'assets/hero_banner.jpg';
      const badgeText = m.badge || '🔥 HIGHLIGHT';
      const tagText = m.tag || 'NEW';
      const playerText = m.player ? `<span>⚽</span> <span>${m.player}</span>` : '';
      const teamText = m.team ? `<span>📍</span> <span>${m.team}</span>` : '';
      const titleText = m.title || 'Momen ACC 2026';

      return `
        <div class="moment-card" style="background-image: url('${photoUrl}');" onclick="app.openMomentModal('${m.id}')" title="Klik untuk lihat sorotan momen">
          <!-- Top Bar: Non-colliding Flex Layout -->
          <div class="moment-card-topbar">
            <div class="moment-badges-wrap">
              <span class="moment-badge-tag">${badgeText}</span>
              ${tagText ? `<span class="moment-badge-new">${tagText}</span>` : ''}
            </div>
            ${isAdmin ? `
              <div class="moment-admin-quick-actions" onclick="event.stopPropagation()">
                <button type="button" class="moment-quick-btn edit" onclick="event.stopPropagation(); admin.editMoment('${m.id}')" title="Edit Momen">
                  ✏️ Edit
                </button>
                <button type="button" class="moment-quick-btn delete" onclick="event.stopPropagation(); admin.deleteMoment('${m.id}')" title="Hapus Momen">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Bottom Gradient Overlay -->
          <div class="moment-gradient-overlay">
            ${playerText ? `<div class="moment-player-row">${playerText}</div>` : ''}
            <div class="moment-title-text">${titleText}</div>
            ${teamText ? `<div class="moment-team-text">${teamText}</div>` : ''}
            <div class="moment-card-hint">
              <span>Buka Momen</span>
              <span class="hint-arrow">↗</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  scrollMoments(direction) {
    const carousel = document.getElementById("momentsCarousel");
    if (carousel) {
      carousel.scrollBy({ left: direction * 300, behavior: "smooth" });
    }
  },

  openMomentModal(id) {
    const moments = Array.isArray(this.store.data.moments) ? this.store.data.moments : [];
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

    if (imgEl) imgEl.src = moment.image || moment.media_url || moment.mediaUrl || 'assets/moment_celebration.jpg';
    if (badgeNew) badgeNew.textContent = moment.tag || 'NEW';
    if (badgeTag) badgeTag.textContent = moment.badge || '🔥 HIGHLIGHT';
    if (headline) headline.textContent = moment.title;
    if (player) player.textContent = moment.player;
    if (team) team.textContent = moment.team;
    if (caption) caption.textContent = moment.caption || "Sorotan aksi spektakuler turnamen futsal ACC 2026.";

    const adminActions = document.getElementById("momentModalAdminActions");
    if (adminActions) adminActions.style.display = this.isAdmin() ? "inline-flex" : "none";

    if (modal) modal.classList.add("active");
  },

  shareMoment() {
    if (!this.activeMoment) return;
    const m = this.activeMoment;
    const shareText = `*ACC 2026 MOMENTS™: ${m.title}*\n👤 ${m.player} (${m.team})\n✨ ${m.caption}\n\n🏆 Pantau aksi seru lainnya di ACC 2026 Portal!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  },

  // MODAL BACA INFORMASI & KILAS TURNAMEN
  openNewsModal(id) {
    const homeData = this.store.data.homeData || {};
    const newsList = Array.isArray(homeData.news) ? homeData.news : [];
    const newsItem = newsList.find(n => n.id === id);
    if (!newsItem) {
      this.showToast("Rincian informasi tidak ditemukan.");
      return;
    }

    this.activeNews = newsItem;

    const modal = document.getElementById("newsModal");
    const tagEl = document.getElementById("newsModalTag");
    const dateEl = document.getElementById("newsModalDate");
    const titleEl = document.getElementById("newsModalTitle");
    const contentEl = document.getElementById("newsModalContent");
    const badgeEl = document.getElementById("newsModalBadge");
    const imgContainer = document.getElementById("newsModalImgContainer");
    const imgEl = document.getElementById("newsModalImg");

    if (tagEl) tagEl.textContent = newsItem.tag || "INFORMASI RESMI";
    if (dateEl) dateEl.textContent = newsItem.date ? `📅 ${newsItem.date}` : "";
    if (titleEl) titleEl.textContent = newsItem.title || "";
    if (badgeEl) badgeEl.textContent = newsItem.badge || "Resmi";

    if (contentEl) {
      contentEl.textContent = newsItem.content || newsItem.desc || "Informasi resmi terkait jalannya turnamen futsal ACC 2026.";
    }

    if (imgContainer && imgEl) {
      if (newsItem.image) {
        imgEl.src = newsItem.image;
        imgContainer.style.display = "block";
      } else {
        imgContainer.style.display = "none";
      }
    }

    if (modal) {
      modal.classList.add("active");
      document.body.classList.add("modal-open");
    }
  },

  shareActiveNews() {
    if (!this.activeNews) return;
    const n = this.activeNews;
    const shareText = `*${n.title}*\n📅 ${n.date || 'ACC 2026'}\n\n${n.desc || ''}\n\n🏆 Selengkapnya di Website Resmi ACC 2026: ${window.location.href}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  },

  // RENDER SPONSORSHIP (DUAL-TIER: SPONSOR UTAMA BESAR KE KIRI & SPONSOR KEDUA 2 BARIS KE KANAN)
  renderSponsors() {
    let sponsors = this.store.data.sponsors;
    if (!sponsors) {
      const backup = _safeStorageGet(localStorage, "acc_tournament_sponsors_backup");
      if (backup) {
        try { sponsors = JSON.parse(backup); this.store.data.sponsors = sponsors; } catch (_) { }
      }
    }
    if (!sponsors) sponsors = { platinum: [], gold: [], media: [] };

    if (Array.isArray(sponsors)) {
      sponsors = this.formatSponsorsFromDb(sponsors);
      this.store.data.sponsors = sponsors;
    }

    const isPanitia = this.isAdmin();
    const btnManage = document.getElementById("btnManageSponsors");
    if (btnManage) {
      btnManage.style.display = isPanitia ? "inline-flex" : "none";
    }

    const dualContainer = document.getElementById("sponsorsDualTierContainer");
    const legacyTrack = document.getElementById("sponsorsMarqueeTrack");
    if (!dualContainer) return;

    let platinumList = (sponsors.platinum || []).map(s => ({ ...s, tierKey: 'platinum' }));
    let goldList = (sponsors.gold || []).map(s => ({ ...s, tierKey: 'gold' }));
    let mediaList = (sponsors.media || []).map(s => ({ ...s, tierKey: 'media' }));
    let allSecondary = [...goldList, ...mediaList];
    let allSponsors = [...platinumList, ...allSecondary];

    if (allSponsors.length === 0 && window.DEFAULT_DATA && window.DEFAULT_DATA.sponsors) {
      const defSponsors = JSON.parse(JSON.stringify(window.DEFAULT_DATA.sponsors));
      const defPlat = (defSponsors.platinum || []);
      const defGold = (defSponsors.gold || []);
      if (defPlat.length > 0 || defGold.length > 0) {
        sponsors = defSponsors;
        this.store.data.sponsors = sponsors;
        platinumList = (sponsors.platinum || []).map(s => ({ ...s, tierKey: 'platinum' }));
        goldList = (sponsors.gold || []).map(s => ({ ...s, tierKey: 'gold' }));
        mediaList = (sponsors.media || []).map(s => ({ ...s, tierKey: 'media' }));
        allSecondary = [...goldList, ...mediaList];
        allSponsors = [...platinumList, ...allSecondary];
      }
    }

    if (allSponsors.length === 0) {
      const emptyHtml = isPanitia ? `
        <div class="sponsors-empty-box">
          <p>Belum ada logo sponsor yang ditambahkan.</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="admin.openSponsorEditorModal()" style="margin-top: 8px;">➕ Tambah Logo Sponsor Sekarang</button>
        </div>
      ` : `
        <div class="sponsors-empty-box muted">
          <p>Mitra dan sponsor resmi turnamen akan segera diperbarui.</p>
        </div>
      `;
      dualContainer.innerHTML = emptyHtml;
      if (legacyTrack) legacyTrack.innerHTML = emptyHtml;
      return;
    }

    // Pastikan struktur track dual-tier selalu ada dan utuh di dalam dualContainer
    let trackPrimary = document.getElementById("sponsorsMarqueeTrackPrimary");
    let trackSec1 = document.getElementById("sponsorsMarqueeTrackSec1");
    let trackSec2 = document.getElementById("sponsorsMarqueeTrackSec2");

    if (!trackPrimary || !trackSec1 || !trackSec2) {
      dualContainer.innerHTML = `
        <!-- TIER 1: SPONSOR UTAMA (UKURAN BESAR - BERJALAN KE KIRI) -->
        <div class="sponsors-tier-section sponsors-tier-primary" id="sponsorsTierPrimary">
          <div class="sponsors-tier-tag">
            <span class="tier-tag-dot gold"></span>
            <span>SPONSOR UTAMA</span>
          </div>
          <div class="sponsors-marquee-wrapper sponsors-marquee-primary" id="sponsorsMarqueePrimaryWrapper">
            <div class="sponsors-marquee-track track-scroll-left" id="sponsorsMarqueeTrackPrimary"></div>
          </div>
        </div>

        <!-- TIER 2: SPONSOR KEDUA (UKURAN LEBIH KECIL - 2 BARIS BERJALAN DARI ARAH SEBALIKNYA / KE KANAN) -->
        <div class="sponsors-tier-section sponsors-tier-secondary" id="sponsorsTierSecondary">
          <div class="sponsors-tier-tag">
            <span class="tier-tag-dot blue"></span>
            <span>MITRA &amp; SPONSOR PENDUKUNG</span>
          </div>
          <!-- Baris 1 Sponsor Kedua (Arah Sebaliknya / Ke Kanan) -->
          <div class="sponsors-marquee-wrapper sponsors-marquee-secondary" id="sponsorsMarqueeSec1Wrapper">
            <div class="sponsors-marquee-track track-scroll-right track-sec-1" id="sponsorsMarqueeTrackSec1"></div>
          </div>
          <!-- Baris 2 Sponsor Kedua (Arah Sebaliknya / Ke Kanan) -->
          <div class="sponsors-marquee-wrapper sponsors-marquee-secondary" id="sponsorsMarqueeSec2Wrapper" style="margin-top: 10px;">
            <div class="sponsors-marquee-track track-scroll-right track-sec-2" id="sponsorsMarqueeTrackSec2"></div>
          </div>
        </div>
      `;
      trackPrimary = document.getElementById("sponsorsMarqueeTrackPrimary");
      trackSec1 = document.getElementById("sponsorsMarqueeTrackSec1");
      trackSec2 = document.getElementById("sponsorsMarqueeTrackSec2");
    }

    // 1. Sponsor Utama (Tier 1 - Ukuran Besar, bergerak ke Kiri)
    let primaryList = [...platinumList];
    // 2. Sponsor Kedua (Tier 2 - Ukuran Lebih Kecil, bergerak dari Arah Sebaliknya / ke Kanan)
    let secondaryList = [...allSecondary];

    // Distribusi cerdas jika salah satu tingkat belum memiliki data
    if (primaryList.length === 0 && secondaryList.length > 0) {
      primaryList = [...secondaryList];
    }
    if (secondaryList.length === 0 && primaryList.length > 0) {
      secondaryList = [...primaryList];
    }

    // Penataan baris Sponsor Kedua:
    const sec1Wrapper = document.getElementById("sponsorsMarqueeSec1Wrapper");
    const sec2Wrapper = document.getElementById("sponsorsMarqueeSec2Wrapper");

    let secRow1 = [];
    let secRow2 = [];

    if (secondaryList.length <= 4) {
      // 1-4 sponsor: Tampilkan 1 baris bersih dan lapang yang bergerak ke Kanan
      secRow1 = [...secondaryList];
      secRow2 = [];
      if (sec2Wrapper) sec2Wrapper.style.display = "none";
    } else {
      // > 4 sponsor: Bagi menjadi 2 baris terpisah
      secondaryList.forEach((s, idx) => {
        if (idx % 2 === 0) secRow1.push(s);
        else secRow2.push(s);
      });
      if (sec2Wrapper) sec2Wrapper.style.display = "block";
    }

    const buildTrackHtml = (items, tierClass = 'tier-primary') => {
      if (!items || items.length === 0) return '';
      let baseList = [...items];
      while (baseList.length < 6) {
        baseList = baseList.concat(items);
      }

      const generateGroup = (isCloned = false) => {
        return baseList.map(s => {
          const logoHtml = s.image ?
            `<img src="${s.image}" alt="${s.name}" class="sponsor-marquee-logo ${tierClass}" loading="lazy">` :
            `<div class="sponsor-marquee-fallback ${tierClass}">
              <span class="sponsor-fallback-icon">${s.icon || '🤝'}</span>
              <span class="sponsor-fallback-name">${s.name}</span>
            </div>`;

          return `
            <div class="sponsor-marquee-item ${tierClass}" title="${s.name}${s.role ? ' - ' + s.role : ''}">
              ${(isPanitia && !isCloned) ? `
                <div class="sponsor-marquee-admin-actions">
                  <button type="button" class="btn-sponsor-act edit" onclick="admin.editSponsor('${s.tierKey}', '${s.id || s.name}')" title="Edit Sponsor">✏️</button>
                  <button type="button" class="btn-sponsor-act del" onclick="admin.deleteSponsor('${s.tierKey}', '${s.id || s.name}')" title="Hapus Sponsor">🗑️</button>
                </div>
              ` : ''}
              ${logoHtml}
            </div>
          `;
        }).join("");
      };

      const groupHtml = generateGroup(false);
      const groupHtmlCloned = generateGroup(true);
      return `
        <div class="sponsors-marquee-group">${groupHtml}</div>
        <div class="sponsors-marquee-group" aria-hidden="true" inert>${groupHtmlCloned}</div>
      `;
    };

    if (trackPrimary) {
      trackPrimary.className = "sponsors-marquee-track track-scroll-left";
      trackPrimary.innerHTML = buildTrackHtml(primaryList, 'tier-primary');
    }
    if (trackSec1) {
      trackSec1.className = "sponsors-marquee-track track-scroll-right track-sec-1";
      trackSec1.innerHTML = buildTrackHtml(secRow1, 'tier-secondary');
    }
    if (trackSec2) {
      if (secRow2.length > 0) {
        trackSec2.className = "sponsors-marquee-track track-scroll-right track-sec-2";
        trackSec2.innerHTML = buildTrackHtml(secRow2, 'tier-secondary');
      } else {
        trackSec2.innerHTML = "";
      }
    }
    if (legacyTrack && !trackPrimary) {
      legacyTrack.innerHTML = buildTrackHtml(allSponsors, 'tier-primary');
    }
    this.fitOfficialSponsorTitle();
  },

  // Otomatis sesuaikan ukuran teks "Official Sponsor" agar 100% pas dengan layar tanpa terpotong
  fitOfficialSponsorTitle() {
    // Sizing ditangani secara native melalui CSS clamp() fluid typography tanpa forced reflow
  },

  getTeam(id) {
    if (!id) return null;
    if (this.store && typeof this.store.getTeam === "function") {
      return this.store.getTeam(id);
    }
    const teams = (this.store && this.store.data && this.store.data.teams) || [];
    const strId = String(id).trim().toLowerCase();
    return teams.find(t => t.id === id || String(t.id).trim().toLowerCase() === strId || String(t.name || '').trim().toLowerCase() === strId) || null;
  },

  populateTeamFilter() {
    const teamSelect = document.getElementById("filterTeam");
    if (!teamSelect) return;

    const cat = this.currentCategory;
    let teams = (this.store && this.store.data && this.store.data.teams) || [];
    if (cat && cat !== "all") {
      teams = teams.filter(t => (t.category || "SMP") === cat);
    }

    // Gabungkan tim dari master tim & tim yang telah terdaftar di jadwal laga
    const matchTeamsMap = new Map();
    teams.forEach(t => {
      if (t && t.id) matchTeamsMap.set(t.id, t);
    });

    const matches = (this.store && this.store.data && this.store.data.matches) || [];
    matches.forEach(m => {
      if (cat && cat !== "all" && (m.category || "SMP") !== cat) return;
      const isKnockout = this.store && typeof this.store.isKnockoutMatch === "function" ? this.store.isKnockoutMatch(m) : false;
      if (m.homeId && !matchTeamsMap.has(m.homeId) && m.homeName && !isKnockout) {
        matchTeamsMap.set(m.homeId, { id: m.homeId, name: m.homeName, category: m.category || cat, group: m.group });
      }
      if (m.awayId && !matchTeamsMap.has(m.awayId) && m.awayName && !isKnockout) {
        matchTeamsMap.set(m.awayId, { id: m.awayId, name: m.awayName, category: m.category || cat, group: m.group });
      }
    });

    const combinedTeams = Array.from(matchTeamsMap.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const prevVal = this.filterTeam || "all";
    const cacheKey = `${cat}_${combinedTeams.map(t => t.id).join(",")}`;
    if (this._lastTeamFilterKey === cacheKey && teamSelect.options.length > 1) {
      teamSelect.value = prevVal;
      return;
    }
    this._lastTeamFilterKey = cacheKey;

    let html = `<option value="all">⚽ Semua Klub / Tim (${combinedTeams.length})</option>`;
    combinedTeams.forEach(t => {
      const gBadge = t.group && t.group !== 'null' && t.group !== '-' ? ` [Grup ${t.group}]` : "";
      html += `<option value="${t.id}">${t.name}${gBadge}</option>`;
    });

    teamSelect.innerHTML = html;
    if (combinedTeams.some(t => t.id === prevVal)) {
      teamSelect.value = prevVal;
    } else {
      teamSelect.value = "all";
      this.filterTeam = "all";
    }
  },

  resetMatchFilters() {
    this.filterDay = "all";
    this.filterTeam = "all";
    this.filterGroup = "all";
    this.filterStatus = "all";
    const dSelect = document.getElementById("filterDay");
    if (dSelect) dSelect.value = "all";
    const tSelect = document.getElementById("filterTeam");
    if (tSelect) tSelect.value = "all";
    const gSelect = document.getElementById("filterGroup");
    if (gSelect) gSelect.value = "all";
    document.querySelectorAll(".match-status-filter-pills .status-pill").forEach(p => {
      p.classList.toggle("active", p.dataset.status === "all");
    });
    this.renderMatches();
  },

  filterMatchesByTeam(teamId) {
    if (!teamId) return;
    this.filterTeam = teamId;
    this.switchTab("matches");
    const tSelect = document.getElementById("filterTeam");
    if (tSelect) tSelect.value = teamId;
    this.renderMatches();
  },

  // 1. RENDER MATCHES (UEFA & WORLD CUP STYLE - DUAL TEAM EVENTS SPLIT)
  renderMatches() {
    const container = document.getElementById("matchesList");
    if (!container) return;

    // Pastikan daftar filter klub selalu sinkron dengan kategori aktif
    this.populateTeamFilter();

    let matches = this.store.data.matches;

    // Filter by Active Category (SMP / SD / all)
    if (this.currentCategory !== "all") {
      matches = matches.filter(m => (m.category || "SMP") === this.currentCategory);
    }

    // Filter by Matchday (Matchday 1 - 8)
    if (this.filterDay !== "all") {
      const selectedMd = String(this.filterDay);
      matches = matches.filter(m => {
        const mDay = String(m.matchday || m.day || "");
        if (mDay === selectedMd) return true;

        const dStr = (m.date || "").toLowerCase();
        if (dStr.includes(`matchday ${selectedMd}`) || dStr.includes(`hari ${selectedMd}`) || dStr.includes(`hari ke-${selectedMd}`) || dStr.includes(`md ${selectedMd}`) || dStr.includes(`md${selectedMd}`)) return true;

        const dayDateMap = { "1": "22", "2": "23", "3": "24", "4": "25", "5": "26", "6": "27", "7": "28", "8": "29" };
        if (dayDateMap[selectedMd] && dStr.includes(dayDateMap[selectedMd])) return true;

        if (selectedMd === "6" && m.stage === "qf") return true;
        if (selectedMd === "7" && m.stage === "sf") return true;
        if (selectedMd === "8" && (m.stage === "final" || m.stage === "3rd")) return true;

        return false;
      });
    }

    // Filter by Club / Tim (Klub A, Klub B, dst)
    if (this.filterTeam && this.filterTeam !== "all") {
      const selectedTeamId = this.filterTeam;
      const teamObj = this.getTeam(selectedTeamId);
      const teamName = teamObj ? (teamObj.name || "").toLowerCase().trim() : "";
      const teamShort = teamObj && teamObj.shortName ? teamObj.shortName.toLowerCase().trim() : "";
      const selLower = String(selectedTeamId).toLowerCase().trim();

      matches = matches.filter(m => {
        if (m.homeId === selectedTeamId || m.awayId === selectedTeamId) return true;
        if (teamName) {
          const hName = (m.homeName || m.homePlaceholder || "").toLowerCase().trim();
          const aName = (m.awayName || m.awayPlaceholder || "").toLowerCase().trim();
          if (hName === teamName || aName === teamName) return true;
          if (teamShort && (hName === teamShort || aName === teamShort)) return true;
        }
        const hDirect = (m.homeName || m.homePlaceholder || "").toLowerCase().trim();
        const aDirect = (m.awayName || m.awayPlaceholder || "").toLowerCase().trim();
        if (hDirect && hDirect === selLower) return true;
        if (aDirect && aDirect === selLower) return true;
        return false;
      });
    }

    // Filter by Group / Stage
    if (this.filterGroup === "group_stage") {
      matches = matches.filter(m => !this.store.isKnockoutMatch(m));
    } else if (this.filterGroup === "knockout") {
      matches = matches.filter(m => this.store.isKnockoutMatch(m));
    } else if (this.filterGroup !== "all") {
      matches = matches.filter(m => !this.store.isKnockoutMatch(m) && m.group === this.filterGroup);
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

    // Urutkan pertandingan secara logis:
    // 1. Live match di posisi teratas
    // 2. Berdasarkan kronologi (Hari & Jam Kick-off)
    // 3. ID Pertandingan
    matches.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;

      const orderA = this.getChronologicalMatchOrder(a);
      const orderB = this.getChronologicalMatchOrder(b);
      if (orderA !== orderB) return orderA - orderB;

      return (a.id || "").localeCompare(b.id || "");
    });

    if (matches.length === 0) {
      const hasActiveFilters = this.filterDay !== "all" || (this.filterTeam && this.filterTeam !== "all") || this.filterGroup !== "all" || this.filterStatus !== "all";
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed rgba(255,255,255,0.12);">
          <div style="font-size: 2.4rem; margin-bottom: 12px;">${hasActiveFilters ? "🔍" : "📅"}</div>
          <h3 style="color: #fff; margin-bottom: 6px; font-size: 1.15rem; font-weight: 800;">
            ${hasActiveFilters ? "Tidak Ada Pertandingan yang Cocok" : "Belum Ada Jadwal Pertandingan"}
          </h3>
          <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 16px auto; line-height: 1.5; color: #94a3b8;">
            ${hasActiveFilters
          ? "Tidak ditemukan pertandingan yang sesuai dengan filter Matchday, Klub, atau Babak yang dipilih."
          : `Jadwal pertandingan turnamen kategori ${this.currentCategory === 'all' ? 'semua' : this.currentCategory} belum ditambahkan oleh panitia pelaksana.`}
          </p>
          ${hasActiveFilters ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="app.resetMatchFilters()" style="font-weight: 700; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4); padding: 8px 18px; margin-top: 6px;">
              🔄 Reset Semua Filter
            </button>
          ` : (this.isAdmin() ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="admin.openAddNewMatchModal()" style="font-weight: 700; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #000; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
              ➕ Tambah Pertandingan Pertama
            </button>
          ` : '')}
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map((m, idx) => {
      const isKnockout = m.stage === "knockout" || /(QF|SF|3RD|FINAL)/i.test(m.id || "");
      const realHomeTeam = m.homeId ? this.store.getTeam(m.homeId) : null;
      const realAwayTeam = m.awayId ? this.store.getTeam(m.awayId) : null;

      const hasDeterminedTeams = Boolean(realHomeTeam && realAwayTeam);

      const home = realHomeTeam || {
        id: "",
        name: m.homePlaceholder || "Menunggu Tim Lolos",
        shortName: m.homePlaceholder ? m.homePlaceholder.substring(0, 5) : "TBD",
        badgeColor: "#334155",
        city: isKnockout ? "Menunggu Laga Grup" : "-",
        isPlaceholder: true
      };
      const away = realAwayTeam || {
        id: "",
        name: m.awayPlaceholder || "Menunggu Tim Lolos",
        shortName: m.awayPlaceholder ? m.awayPlaceholder.substring(0, 5) : "TBD",
        badgeColor: "#334155",
        city: isKnockout ? "Menunggu Laga Grup" : "-",
        isPlaceholder: true
      };

      const isLive = m.status === "live" && (!isKnockout || hasDeterminedTeams);
      const isFinished = m.status === "finished" && (!isKnockout || hasDeterminedTeams);
      const isUpcoming = !isLive && !isFinished;
      const statusClass = isLive ? "status-live" : (isFinished ? "status-finished" : "status-upcoming");
      const swipeClass = idx % 2 === 1 ? 'scroll-reveal reveal-right' : 'scroll-reveal';
      const minOnly = (m.liveMinute || "").toString().replace(/\D/g, "");
      const cleanMinBadge = minOnly ? `${minOnly}'` : '';

      let statusBarHtml = "";
      if (isKnockout && !hasDeterminedTeams) {
        statusBarHtml = `
          <div class="match-status-bar bar-upcoming">
            <div class="bar-left">
              <strong>AKAN DATANG • MENUNGGU TIM LOLOS</strong>
            </div>
            <div class="bar-right">
              <span>${m.time || ''}</span>
            </div>
          </div>
        `;
      } else if (isLive) {
        const isPaused = Boolean(m.isTimerPaused);
        statusBarHtml = `
          <div class="match-status-bar ${isPaused ? 'bar-live is-paused' : 'bar-live'}">
            <div class="bar-left">
              <span class="pulse-dot"></span>
              <strong>${isPaused ? '⏸️ JEDA' : 'LIVE'}${cleanMinBadge ? ` • Menit ${cleanMinBadge}` : ''}</strong>
            </div>
            <div class="bar-right">
              <span>${m.pitch || 'Lapangan Utama'}</span>
            </div>
          </div>
        `;
      } else if (isFinished) {
        statusBarHtml = `
          <div class="match-status-bar bar-finished">
            <div class="bar-left">
              <strong>SELESAI (FT)</strong>
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
              <strong>AKAN DATANG</strong>
            </div>
            <div class="bar-right">
              <span>${m.time}</span>
            </div>
          </div>
        `;
      }

      // Split scorers & cards per team
      const homeScorers = (m.scorers || []).filter(s => s.team === m.homeId);
      const awayScorers = (m.scorers || []).filter(s => s.team === m.awayId);
      const homeCards = (m.cards || []).filter(c => c.team === m.homeId);
      const awayCards = (m.cards || []).filter(c => c.team === m.awayId);

      let homeScore = (isLive || isFinished) ? (m.homeScore ?? m.homeScoreLive ?? 0) : "-";
      let awayScore = (isLive || isFinished) ? (m.awayScore ?? m.awayScoreLive ?? 0) : "-";

      if (isKnockout && !hasDeterminedTeams) {
        homeScore = "-";
        awayScore = "-";
      } else if (isLive || isFinished) {
        if (homeScorers.length > 0) {
          homeScore = Math.max(parseInt(homeScore, 10) || 0, homeScorers.length);
        }
        if (awayScorers.length > 0) {
          awayScore = Math.max(parseInt(awayScore, 10) || 0, awayScorers.length);
        }
      }

      const hasPenalties = isFinished && (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined);
      const penWinnerTeam = m.penaltyWinner ? this.store.getTeam(m.penaltyWinner) : null;

      const catBadge = (m.category || "SMP") === "SD" ?
        `<span class="match-category-tag cat-sd">SD</span>` :
        `<span class="match-category-tag cat-smp">SMP</span>`;

      return `
        <div id="match-card-${m.id}" data-match-id="${m.id}" class="match-card uefa-fixture-card ${statusClass} ${isLive ? 'is-live' : ''} ${swipeClass}">
          ${statusBarHtml}
          <!-- HEADER META -->
          <div class="fixture-header-meta">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${catBadge}
              <span class="fixture-pitch-pill">${m.pitch || 'Lapangan Utama'}</span>
              <span class="fixture-group-pill">${this.getMatchStageName(m)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="fixture-time-hint">${m.date}</span>
              <span class="match-status-tag ${m.status}">
                ${isLive ? `<span class="pulse-dot"></span> LIVE ${cleanMinBadge}` : (isFinished ? (hasPenalties ? `FT (P: ${m.penaltyHomeScore}-${m.penaltyAwayScore})` : 'Selesai') : (m.time || 'Waktu Belum Diatur'))}
              </span>
            </div>
          </div>

          <!-- FIXTURE ROWS BODY (2 BARIS TIM LEGA, TANPA TERPOTONG) -->
          <div class="match-fixture-content">
            
            <!-- BARIS 1: TIM HOME -->
            <div class="fixture-team-row" onclick="${home.id ? `app.openTeamModal('${home.id}')` : `app.showToast('Tim yang lolos belum ditentukan (menunggu hasil fase grup)')`}" title="${home.id ? 'Klik untuk lihat profil tim' : 'Menunggu tim lolos'}">
              <div class="fixture-team-left">
                <div class="team-avatar-mini" style="background: ${home.badgeColor || '#10b981'};">
                  ${home.logo ? `<img src="${home.logo}" class="team-logo-img" alt="${home.name}">` : `<span style="font-size:0.72rem;font-weight:800;color:#cbd5e1;">${(home.shortName || 'TBD').substring(0, 3)}</span>`}
                </div>
                <div class="fixture-team-name-wrap">
                  <div class="fixture-team-fullname ${home.isPlaceholder ? 'text-placeholder' : ''}">${home.name}</div>
                  <div class="fixture-team-subcity">📍 ${home.city || '-'}</div>
                </div>
              </div>
              <div class="fixture-score-number ${isLive ? 'live' : ''}">
                ${homeScore} ${hasPenalties ? `<small style="font-size:0.75rem; color:#ca8a04; font-weight:700;">(${m.penaltyHomeScore})</small>` : ''}
              </div>
            </div>

            <!-- GOL & KARTU TIM HOME (BERADA PERSIS DI BAWAH NAMA TIM HOME) -->
            ${(homeScorers.length > 0 || homeCards.length > 0) ? `
              <div class="fixture-team-events">
                ${homeScorers.map(s => {
        const isOg = Boolean(s.isOwnGoal || s.ownGoal || String(s.player || '').toLowerCase().includes('bunuh diri') || String(s.player || '').toLowerCase().includes('(gbd)'));
        return `
                  <span class="fixture-event-chip scorer ${isOg ? 'own-goal-chip' : ''}">
                    <span>${isOg ? '⚡' : '⚽'}</span>
                    <span>${s.player}</span>
                    <span class="chip-min">${s.minute}</span>
                  </span>
                  `;
      }).join("")}
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
            <div class="fixture-team-row" onclick="${away.id ? `app.openTeamModal('${away.id}')` : `app.showToast('Tim yang lolos belum ditentukan (menunggu hasil fase grup)')`}" title="${away.id ? 'Klik untuk lihat profil tim' : 'Menunggu tim lolos'}">
              <div class="fixture-team-left">
                <div class="team-avatar-mini" style="background: ${away.badgeColor || '#3b82f6'};">
                  ${away.logo ? `<img src="${away.logo}" class="team-logo-img" alt="${away.name}">` : `<span style="font-size:0.72rem;font-weight:800;color:#cbd5e1;">${(away.shortName || 'TBD').substring(0, 3)}</span>`}
                </div>
                <div class="fixture-team-name-wrap">
                  <div class="fixture-team-fullname ${away.isPlaceholder ? 'text-placeholder' : ''}">${away.name}</div>
                  <div class="fixture-team-subcity">📍 ${away.city || '-'}</div>
                </div>
              </div>
              <div class="fixture-score-number ${isLive ? 'live' : ''}">
                ${awayScore} ${hasPenalties ? `<small style="font-size:0.75rem; color:#ca8a04; font-weight:700;">(${m.penaltyAwayScore})</small>` : ''}
              </div>
            </div>

            <!-- GOL & KARTU TIM AWAY (BERADA PERSIS DI BAWAH NAMA TIM AWAY) -->
            ${(awayScorers.length > 0 || awayCards.length > 0) ? `
              <div class="fixture-team-events">
                ${awayScorers.map(s => {
        const isOg = Boolean(s.isOwnGoal || s.ownGoal || String(s.player || '').toLowerCase().includes('bunuh diri') || String(s.player || '').toLowerCase().includes('(gbd)'));
        return `
                  <span class="fixture-event-chip scorer ${isOg ? 'own-goal-chip' : ''}">
                    <span>${isOg ? '⚡' : '⚽'}</span>
                    <span>${s.player}</span>
                    <span class="chip-min">${s.minute}</span>
                  </span>
                  `;
      }).join("")}
                ${awayCards.map(c => `
                  <span class="fixture-event-chip">
                    <span class="${c.type === 'yellow' ? 'card-icon-y' : 'card-icon-r'}"></span>
                    <span>${c.player}</span>
                    <span class="chip-min">${c.minute}</span>
                  </span>
                `).join("")}
              </div>
            ` : ''}

            ${hasPenalties ? `
              <div class="fixture-penalty-badge">
                <span>🎯</span>
                <span>Adu Penalti: <strong>${m.penaltyHomeScore} - ${m.penaltyAwayScore}</strong></span>
                ${penWinnerTeam ? `<span>• Lolos: <strong>${penWinnerTeam.shortName || penWinnerTeam.name}</strong></span>` : ''}
              </div>
            ` : ''}

          </div>

          <!-- FOOTER AKSI -->
          <div class="fixture-footer-bar">
            <span class="fixture-field-note" style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
              ${this.getMatchStageName(m)}
            </span>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="app.showMatchDetail('${m.id}')" style="font-size: 0.72rem; padding: 4px 10px;">
                Detail
              </button>
              ${this.isAdmin() ? `
                <button class="btn btn-admin btn-sm" onclick="admin.openMatchEditor('${m.id}')" title="Atur Pertandingan & Jadwal" style="font-size: 0.72rem; padding: 4px 10px;">
                  ⚙️ Atur Laga
                </button>
                <button class="btn btn-primary btn-sm" onclick="admin.openQuickScore('${m.id}')" title="Input Skor & Kartu Pertandingan" style="font-size: 0.72rem; padding: 4px 10px;">
                  Skor
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
    this.updateFloatingLiveNotice();
    this.initScrollReveal();
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

    container.innerHTML = groupsToShow.map((g, idx) => {
      const standings = this.store.calculateGroupStandings(g.letter, g.category);
      const swipeClass = idx % 2 === 1 ? 'scroll-reveal reveal-right' : 'scroll-reveal';

      return `
        <div class="group-card ${swipeClass}">
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
    this.updateFloatingLiveNotice();
    this.initScrollReveal();
  },

  // 3. RENDER BRACKET (Bagan 8 Besar Lengkap per Kategori - FIFA / UEFA Tournament Tree)
  renderBracket() {
    const container = document.getElementById("bracketTree");
    if (!container) return;

    this.store.syncKnockoutFromStandings();

    const activeCat = this.currentCategory;
    const isSMP = activeCat === "SMP";

    // Ambil semua pertandingan fase gugur resmi yang telah diatur panitia di Jadwal & Skor
    const getKnockoutMatchesForCat = (stageType) => {
      const matches = (this.store.data.matches || []).filter(m => {
        const mCat = m.category || (m.id && m.id.endsWith("_" + activeCat) ? activeCat : "SMP");
        return mCat === activeCat && this.store.classifyKnockoutStage(m) === stageType;
      });
      return matches.sort((a, b) => {
        const tA = this.store.parseTimeToMinutes(a.time, a.date);
        const tB = this.store.parseTimeToMinutes(b.time, b.date);
        if (tA !== tB) return tA - tB;
        return String(a.id).localeCompare(String(b.id));
      });
    };

    const actualQFs = getKnockoutMatchesForCat("qf");
    const actualSFs = getKnockoutMatchesForCat("sf");
    const actual3RDs = getKnockoutMatchesForCat("3rd");
    const actualFinals = getKnockoutMatchesForCat("final");

    const findSlotMatch = (key, fallbackList, fallbackIdx, fallbackId) => {
      const allCat = (this.store.data.matches || []).filter(m => {
        const mCat = m.category || (m.id && m.id.endsWith("_" + activeCat) ? activeCat : "SMP");
        return mCat === activeCat;
      });
      let match = allCat.find(m => m.knockoutKey === key);
      if (match) return match;
      match = allCat.find(m => this.store.classifyKnockoutKey(m) === key);
      if (match) return match;
      if (fallbackList && fallbackList[fallbackIdx]) return fallbackList[fallbackIdx];
      return allCat.find(m => m.id === fallbackId || m.id === fallbackId.replace("_" + activeCat, ""));
    };

    const getOrBuildKnockoutMatch = (actualMatch, fallbackId, roundName, hPlaceholder, aPlaceholder, defaultTime) => {
      if (actualMatch) {
        if (!actualMatch.homePlaceholder) actualMatch.homePlaceholder = hPlaceholder;
        if (!actualMatch.awayPlaceholder) actualMatch.awayPlaceholder = aPlaceholder;
        if (!actualMatch.roundName || actualMatch.roundName.includes("null") || actualMatch.roundName.toLowerCase().startsWith("grup") || actualMatch.roundName === "Babak Gugur") {
          actualMatch.roundName = `${roundName} (${activeCat})`;
        }
        actualMatch.stage = "knockout";
        actualMatch.group = null;
        return actualMatch;
      }

      let m = (this.store.data.matches || []).find(match =>
        (match.category === activeCat || match.id.endsWith("_" + activeCat)) &&
        (match.id === fallbackId || match.id === fallbackId.replace("_" + activeCat, ""))
      );
      if (!m) {
        m = {
          id: fallbackId,
          category: activeCat,
          stage: "knockout",
          group: null,
          roundName: `${roundName} (${activeCat})`,
          homeId: "",
          awayId: "",
          homePlaceholder: hPlaceholder,
          awayPlaceholder: aPlaceholder,
          date: isSMP ? "25 Nov 2026" : "25 Nov 2026",
          time: defaultTime || (activeCat === "SD" ? "08:00 - 08:35 WITA" : "08:00 - 08:45 WITA"),
          pitch: "Lapangan 1 (Utama Vinyl)",
          status: "upcoming",
          homeScore: null,
          awayScore: null,
          isManualTeam: false,
          isPlaceholderShell: true
        };
      }
      return m;
    };

    // Struktur bagan 8 besar resmi per kategori (UEFA / FIFA Tournament Tree)
    // Otomatis sinkron 100% dengan urutan jadwal & dropdown resmi panitia ACC 2026
    const qfMatches = [
      getOrBuildKnockoutMatch(findSlotMatch("qf1", actualQFs, 0, `QF1_${activeCat}`), `QF1_${activeCat}`, `Perempat Final 1`, `Juara Grup A`, `Runner-up Grup B`, isSMP ? "08:00 - 08:45 WITA" : "08:00 - 08:35 WITA"),
      getOrBuildKnockoutMatch(findSlotMatch("qf2", actualQFs, 1, `QF2_${activeCat}`), `QF2_${activeCat}`, `Perempat Final 2`, `Juara Grup B`, `Runner-up Grup A`, isSMP ? "09:00 - 09:45 WITA" : "08:50 - 09:25 WITA"),
      getOrBuildKnockoutMatch(findSlotMatch("qf3", actualQFs, 2, `QF3_${activeCat}`), `QF3_${activeCat}`, `Perempat Final 3`, `Juara Grup C`, `Runner-up Grup D`, isSMP ? "10:00 - 10:45 WITA" : "09:40 - 10:15 WITA"),
      getOrBuildKnockoutMatch(findSlotMatch("qf4", actualQFs, 3, `QF4_${activeCat}`), `QF4_${activeCat}`, `Perempat Final 4`, `Juara Grup D`, `Runner-up Grup C`, isSMP ? "11:00 - 11:45 WITA" : "10:30 - 11:05 WITA"),
    ];

    const sfMatches = [
      getOrBuildKnockoutMatch(findSlotMatch("sf1", actualSFs, 0, `SF1_${activeCat}`), `SF1_${activeCat}`, `Semifinal 1`, `Pemenang QF 1`, `Pemenang QF 2`, isSMP ? "14:00 - 14:50 WITA" : "13:30 - 14:10 WITA"),
      getOrBuildKnockoutMatch(findSlotMatch("sf2", actualSFs, 1, `SF2_${activeCat}`), `SF2_${activeCat}`, `Semifinal 2`, `Pemenang QF 3`, `Pemenang QF 4`, isSMP ? "15:00 - 15:50 WITA" : "14:20 - 15:00 WITA"),
    ];

    const thirdMatch = getOrBuildKnockoutMatch(findSlotMatch("3rd", actual3RDs, 0, `3RD_${activeCat}`), `3RD_${activeCat}`, `Perebutan Juara 3`, `Kalah Semifinal 1`, `Kalah Semifinal 2`, isSMP ? "16:00 - 16:50 WITA" : "15:15 - 15:55 WITA");
    const finalMatch = getOrBuildKnockoutMatch(findSlotMatch("final", actualFinals, 0, `FINAL_${activeCat}`), `FINAL_${activeCat}`, `Grand Final`, `Pemenang Semifinal 1`, `Pemenang Semifinal 2`, isSMP ? "17:00 - 18:00 WITA" : "16:15 - 17:15 WITA");

    let champTeam = null;
    let runnerUpTeam = null;
    let thirdTeam = null;

    const getMatchWinnerId = (m) => {
      if (!m || m.status !== "finished") return null;
      const h = Number(m.homeScore ?? m.homeScoreLive ?? 0);
      const a = Number(m.awayScore ?? m.awayScoreLive ?? 0);
      if (h > a) return m.homeId;
      if (a > h) return m.awayId;
      if (m.penaltyWinner) return m.penaltyWinner;
      if (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined) {
        if (m.penaltyHomeScore > m.penaltyAwayScore) return m.homeId;
        if (m.penaltyAwayScore > m.penaltyHomeScore) return m.awayId;
      }
      return null;
    };

    if (finalMatch && finalMatch.status === "finished") {
      const winnerId = getMatchWinnerId(finalMatch);
      if (winnerId === finalMatch.homeId) {
        champTeam = this.store.getTeam(finalMatch.homeId);
        runnerUpTeam = this.store.getTeam(finalMatch.awayId);
      } else if (winnerId === finalMatch.awayId) {
        champTeam = this.store.getTeam(finalMatch.awayId);
        runnerUpTeam = this.store.getTeam(finalMatch.homeId);
      }
    }

    if (thirdMatch && thirdMatch.status === "finished") {
      const winnerId = getMatchWinnerId(thirdMatch);
      if (winnerId === thirdMatch.homeId) {
        thirdTeam = this.store.getTeam(thirdMatch.homeId);
      } else if (winnerId === thirdMatch.awayId) {
        thirdTeam = this.store.getTeam(thirdMatch.awayId);
      }
    }

    const renderBracketCard = (m, cardType = "qf") => {
      if (!m) return "";
      const home = m.homeId ? this.store.getTeam(m.homeId) : null;
      const away = m.awayId ? this.store.getTeam(m.awayId) : null;

      const hasDeterminedHome = Boolean(home);
      const hasDeterminedAway = Boolean(away);

      const homeName = hasDeterminedHome ? home.name : (m.homePlaceholder || "Menunggu Tim Lolos");
      const awayName = hasDeterminedAway ? away.name : (m.awayPlaceholder || "Menunggu Tim Lolos");

      const isLive = m.status === "live" && hasDeterminedHome && hasDeterminedAway;
      const isFinished = m.status === "finished" && hasDeterminedHome && hasDeterminedAway;

      const hasPenalties = isFinished && (m.penaltyHomeScore !== null && m.penaltyAwayScore !== null && m.penaltyHomeScore !== undefined && m.penaltyAwayScore !== undefined);
      const winnerId = (hasDeterminedHome && hasDeterminedAway) ? getMatchWinnerId(m) : null;
      const isHomeWinner = isFinished && winnerId === m.homeId;
      const isAwayWinner = isFinished && winnerId === m.awayId;

      const homeScore = (hasDeterminedHome && hasDeterminedAway) ? (isLive ? (m.homeScoreLive ?? 0) : (isFinished ? (hasPenalties ? `${m.homeScore} <small style="color:#ca8a04; font-size:0.72rem; font-weight:800;">(${m.penaltyHomeScore})</small>` : m.homeScore) : "-")) : "-";
      const awayScore = (hasDeterminedHome && hasDeterminedAway) ? (isLive ? (m.awayScoreLive ?? 0) : (isFinished ? (hasPenalties ? `${m.awayScore} <small style="color:#ca8a04; font-size:0.72rem; font-weight:800;">(${m.penaltyAwayScore})</small>` : m.awayScore) : "-")) : "-";

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
        statusBadge = hasPenalties
          ? `<span class="bracket-status-chip ft" style="background:rgba(234,179,8,0.15); color:#ca8a04; border-color:rgba(234,179,8,0.4);">FT (Pen. ${m.penaltyHomeScore}-${m.penaltyAwayScore})</span>`
          : `<span class="bracket-status-chip ft">FT • Selesai</span>`;
      } else {
        const timeDisplay = m.time ? m.time.replace(' WIB', '') : 'Waktu TBD';
        statusBadge = `<span class="bracket-status-chip upcoming">📅 ${m.date ? m.date.replace(' Nov 2026', '') : ''} • ${timeDisplay}</span>`;
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
        <div class="${cardClasses}" onclick="app.showMatchDetail('${m.id}')" title="Klik untuk lihat detail pertandingan ini">
          <div class="bracket-card-header">
            <span class="bracket-round-label">${this.getMatchStageName(m)} (${activeCat})</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${this.isAdmin() ? `
                <button class="btn btn-admin btn-sm" onclick="event.stopPropagation(); admin.openMatchEditor('${m.id}')" title="Atur Jadwal Babak Ini" style="font-size: 0.68rem; padding: 2px 7px; background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.4); color: #fbbf24; border-radius: 4px;">
                  📅 Atur Jadwal
                </button>
              ` : ''}
              ${statusBadge}
            </div>
          </div>

          <div class="bracket-teams-container">
            <!-- HOME -->
            <div class="bracket-team-line ${isHomeWinner ? 'winner' : ''}">
              <div class="bracket-team-left">
                <div class="bracket-team-avatar" style="background: ${hasDeterminedHome ? (home.badgeColor || '#0284c7') : '#1e293b'};">
                  ${hasDeterminedHome && home.logo ? `<img src="${home.logo}" alt="${homeName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : `<span style="font-size:0.75rem;font-weight:800;color:#94a3b8;">${homeSeed || (home ? (home.shortName || 'TBD').substring(0, 3) : '⏳')}</span>`}
                </div>
                <div class="bracket-team-name ${!hasDeterminedHome ? 'text-placeholder' : ''}" title="${homeName}">${homeName}</div>
                ${homeSeed ? `<span class="bracket-team-seed">${homeSeed}</span>` : ''}
              </div>
              <div class="bracket-score-val">${homeScore}</div>
            </div>

            <!-- AWAY -->
            <div class="bracket-team-line ${isAwayWinner ? 'winner' : ''}">
              <div class="bracket-team-left">
                <div class="bracket-team-avatar" style="background: ${hasDeterminedAway ? (away.badgeColor || '#0284c7') : '#1e293b'};">
                  ${hasDeterminedAway && away.logo ? `<img src="${away.logo}" alt="${awayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : `<span style="font-size:0.75rem;font-weight:800;color:#94a3b8;">${awaySeed || (away ? (away.shortName || 'TBD').substring(0, 3) : '⏳')}</span>`}
                </div>
                <div class="bracket-team-name ${!hasDeterminedAway ? 'text-placeholder' : ''}" title="${awayName}">${awayName}</div>
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
            ${isSMP ? '🏆 KATEGORI SMP • BABAK 8 BESAR S/D GRAND FINAL' : '🎒 KATEGORI SD • BABAK 8 BESAR S/D GRAND FINAL'}
          </span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            *Juara & Runner-up Grup otomatis masuk ke bagan sistem gugur
          </span>
        </div>

        
      </div>

      <div class="bracket-mobile-hint">
        <div style="margin-bottom: 6px;">👉 Geser layar ke samping atau pilih babak untuk melihat bagan lengkap:</div>
        <div class="bracket-quick-nav">
          <button type="button" class="bracket-quick-nav-btn" onclick="app.scrollBracket('qf')">Babak 8 Besar</button>
          <button type="button" class="bracket-quick-nav-btn" onclick="app.scrollBracket('sf')">Semifinal</button>
          <button type="button" class="bracket-quick-nav-btn" onclick="app.scrollBracket('final')">🏆 Grand Final & Juara 3</button>
        </div>
      </div>

      <!-- MAIN TREE CONTAINER -->
      <div class="bracket-tree-container">
        <!-- HEADER ROW -->
        <div class="bracket-tree-headers">
          <div class="bracket-header-cell col-qf">
            <div class="bracket-header-pill">BABAK 8 BESAR</div>
            <div class="bracket-header-title">PEREMPAT FINAL</div>
            <div class="bracket-header-sub">📅 27 Nov 2026 • 4 Pertandingan</div>
          </div>

          <div class="bracket-header-spacer"></div>

          <div class="bracket-header-cell col-sf">
            <div class="bracket-header-pill">BABAK 4 BESAR</div>
            <div class="bracket-header-title">SEMIFINAL</div>
            <div class="bracket-header-sub">📅 28 Nov 2026 • 3 Pertandingan</div>
          </div>

          <div class="bracket-header-spacer"></div>

          <div class="bracket-header-cell col-final">
            <div class="bracket-header-pill" style="color: var(--accent-gold);">BABAK PUNCAK & JUARA 3</div>
            <div class="bracket-header-title">🏆 GRAND FINAL 🏆</div>
            <div class="bracket-header-sub">📅 29 Nov 2026 • Penentuan Juara</div>
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
            <!-- Dedicated Champion 1 Podium Showcase / Trophy Box -->
            ${champTeam ? `
              <div class="bracket-champion-podium-card">
                <div class="champ-banner-tag">
                  <span>🏆</span>
                  <span>BAGAN KHUSUS JUARA 1</span>
                  <span>🏆</span>
                </div>
                <div class="champ-content-row">
                  <div class="champ-logo-wrap" style="border-color: ${champTeam.badgeColor || '#f59e0b'};">
                    ${champTeam.logo ? `<img src="${champTeam.logo}" alt="${champTeam.name}">` : `<span class="champ-logo-fallback" style="background:${champTeam.badgeColor || '#059669'};">${(champTeam.shortName || 'ACC').substring(0, 3)}</span>`}
                    <div class="champ-crown-badge">👑</div>
                  </div>
                  <div class="champ-info-text">
                    <div class="champ-podium-label">JUARA 1 (CHAMPION) • ${isSMP ? 'SMP' : 'SD'}</div>
                    <div class="champ-school-title" title="${champTeam.name}">${champTeam.name}</div>
                    <div class="champ-school-sub">📍 ${champTeam.city || 'Maros'} • Kampiun & Pemegang Trofi ACC 2026</div>
                  </div>
                </div>
                ${runnerUpTeam || thirdTeam ? `
                  <div class="champ-podium-pills">
                    ${runnerUpTeam ? `<div class="champ-pill champ-pill-silver">🥈 Juara 2: <strong>${runnerUpTeam.name}</strong></div>` : ''}
                    ${thirdTeam ? `<div class="champ-pill champ-pill-bronze">🥉 Juara 3: <strong>${thirdTeam.name}</strong></div>` : ''}
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="bracket-trophy-top">
                <div style="font-size: 1.8rem; line-height: 1; margin-bottom: 4px;">🏆</div>
                <div style="color: var(--accent-gold); font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px;">
                  BAGAN JUARA 1 • TROFI BERGILIR ACC 2026
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                  🥇 Juara 1 • 🥈 Juara 2 • 🥉 Juara 3
                </div>
              </div>
            `}

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

  scrollBracket(target) {
    const wrapper = document.querySelector(".bracket-wrapper");
    if (!wrapper) return;
    if (target === "qf") {
      wrapper.scrollTo({ left: 0, behavior: "smooth" });
    } else if (target === "sf") {
      wrapper.scrollTo({ left: 340, behavior: "smooth" });
    } else if (target === "final") {
      wrapper.scrollTo({ left: wrapper.scrollWidth, behavior: "smooth" });
    }
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

    const isPanitia = this.isAdmin();

    container.innerHTML = teams.map((t, idx) => {
      const off = (t && t.official && typeof t.official === "object") ? t.official : {};
      const tName = (t && t.name) ? String(t.name) : ("Tim " + (t && t.id ? t.id : ""));
      const tShort = (t && (t.shortName || t.short_name)) ? String(t.shortName || t.short_name) : tName;
      const tPlayers = (t && Array.isArray(t.players)) ? t.players : [];
      const waLink = this.getWhatsAppUrl(off.phone || "", `Halo Official ${tName}, informasi ACC 2026`);
      const swipeClass = idx % 2 === 1 ? 'scroll-reveal reveal-right' : 'scroll-reveal';

      return `
        <div class="school-card ${swipeClass}" onclick="app.navigateTo('/daftar-tim/detail-tim/${t.id}', 'team-detail', { teamId: '${t.id}' })" style="cursor: pointer;">
          ${t.logo ? `<div class="school-card-watermark" style="background-image: url('${t.logo}');"></div>` : ''}
          <div class="school-card-banner" style="background: linear-gradient(135deg, ${t.badgeColor || '#0284c7'}, #0f172a);">
            <span class="group-tag-corner">
              ${(t.category || 'SMP') === 'SD' ? '🎒 SD' : '🏆 SMP'} • ${t.group && t.group !== '-' ? 'GRUP ' + t.group : 'Belum Diundi'}
            </span>
          </div>

          <div class="school-card-body">
            <div class="school-avatar" style="background: ${t.badgeColor || '#0284c7'};">
              ${t.logo ? `<img src="${t.logo}" class="team-logo-img" alt="${tName}">` : tShort.substring(0, 3)}
            </div>

            <div class="school-card-name">${tName}</div>
            <div class="school-card-city">📍 ${t.city || '-'}</div>

            <div class="official-info-box">
              <div class="official-row" style="align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
                  ${off.coachPhoto ? `<img src="${off.coachPhoto}" alt="Foto Pelatih" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-gold); flex-shrink: 0;">` : '<span>👔</span>'}
                  <span style="font-size: 0.72rem; color: #94a3b8; white-space: nowrap;">Pelatih / Asisten:</span>
                </div>
                <strong style="color: #f8fafc; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 58%; text-align: right;" title="${off.coach || off.manager || ''}">${off.coach && off.manager && off.coach !== off.manager ? `${off.coach} / ${off.manager}` : (off.coach || off.manager || '-')}</strong>
              </div>
              <div class="official-row">
                <span style="color: #94a3b8;">🎽 Jersey:</span>
                <strong style="font-size: 0.72rem; color: #f8fafc;">${off.jerseyHome || '-'}</strong>
              </div>
            </div>

            <div class="school-card-footer" onclick="event.stopPropagation();">
              <span class="roster-count">👥 ${tPlayers.length} Pemain</span>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); app.navigateTo('/daftar-tim/detail-tim/${t.id}', 'team-detail', { teamId: '${t.id}' })" style="font-size: 0.72rem; padding: 4px 10px; font-weight: 700; border-radius: 99px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #ffffff;">
                  🔍 Profil & Skuad
                </button>
                ${isPanitia ? `<button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); admin.openTeamEditorModal('${t.id}')" title="Edit Data Tim & Pemain" style="font-size: 0.72rem; padding: 3px 8px; border-color: var(--primary); color: var(--primary); font-weight: 600;">✏️ Edit</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
    this.updateFloatingLiveNotice();
    this.initScrollReveal();
  },

  // 5. STATISTIK TURNAMEN (TOP SKOR, TOP ASSIST, KARTU KUNING, KARTU MERAH)
  setStatsTab(tab) {
    const validTabs = ["scorers", "assists", "yellow", "red"];
    this.currentStatsTab = validTabs.includes(tab) ? tab : "scorers";
    document.querySelectorAll(".stats-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.stat === this.currentStatsTab);
    });
    this.renderStatsTable();
  },

  renderStats() {
    if (this.store && typeof this.store.syncPlayerStatsFromMatches === "function") {
      try { this.store.syncPlayerStatsFromMatches(); } catch (_) { }
    }
    this.renderStatsSummary();
    this.renderStatsTable();
    this.initScrollReveal();
  },

  renderStatsSummary() {
    const container = document.getElementById("statsSummaryRibbon");
    if (!container) return;

    const cat = this.currentCategory;
    const scorers = this.store.getTopScorersList(cat);
    const topScorer = scorers.length > 0 ? scorers[0] : null;

    const assisters = typeof this.store.getTopAssistsList === "function" ? this.store.getTopAssistsList(cat) : [];
    const topAssister = assisters.length > 0 ? assisters[0] : null;

    const discRecords = this.store.getDisciplinaryRecords(cat);
    const totalYellow = discRecords.reduce((sum, r) => sum + (r.yellowCount || 0), 0);
    const totalRed = discRecords.reduce((sum, r) => sum + (r.redCount || 0), 0);

    const safeImg = (src) => src || "assets/acc_logo.png";

    const card1 = topScorer ? `
      <div class="stats-summary-card ${this.currentStatsTab === 'scorers' ? 'active' : ''}" onclick="app.setStatsTab('scorers')">
        <img src="${safeImg(topScorer.photo)}" alt="${topScorer.playerName}" class="stats-summary-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">👑 TOP SKOR</div>
          <div class="stats-summary-name" title="${topScorer.playerName}">${topScorer.playerName}</div>
          <div class="stats-summary-sub">${topScorer.teamName}</div>
        </div>
        <div class="stats-summary-value text-gold">${topScorer.goals}<span class="stats-summary-unit">Gol</span></div>
      </div>
    ` : `
      <div class="stats-summary-card ${this.currentStatsTab === 'scorers' ? 'active' : ''}" onclick="app.setStatsTab('scorers')">
        <div class="stats-summary-icon-fallback">⚽</div>
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">👑 TOP SKOR</div>
          <div class="stats-summary-name">Belum Ada Gol</div>
          <div class="stats-summary-sub">Kandidat Golden Boot</div>
        </div>
        <div class="stats-summary-value text-gold">0<span class="stats-summary-unit">Gol</span></div>
      </div>
    `;

    const card2 = topAssister ? `
      <div class="stats-summary-card ${this.currentStatsTab === 'assists' ? 'active' : ''}" onclick="app.setStatsTab('assists')">
        <img src="${safeImg(topAssister.photo)}" alt="${topAssister.playerName}" class="stats-summary-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">👟 TOP ASSIST</div>
          <div class="stats-summary-name" title="${topAssister.playerName}">${topAssister.playerName}</div>
          <div class="stats-summary-sub">${topAssister.teamName}</div>
        </div>
        <div class="stats-summary-value text-cyan">${topAssister.assists}<span class="stats-summary-unit">Ast</span></div>
      </div>
    ` : `
      <div class="stats-summary-card ${this.currentStatsTab === 'assists' ? 'active' : ''}" onclick="app.setStatsTab('assists')">
        <div class="stats-summary-icon-fallback">👟</div>
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">👟 TOP ASSIST</div>
          <div class="stats-summary-name">Belum Ada Assist</div>
          <div class="stats-summary-sub">Kandidat Playmaker</div>
        </div>
        <div class="stats-summary-value text-cyan">0<span class="stats-summary-unit">Ast</span></div>
      </div>
    `;

    const card3 = `
      <div class="stats-summary-card ${this.currentStatsTab === 'yellow' ? 'active' : ''}" onclick="app.setStatsTab('yellow')">
        <div class="stats-summary-icon-fallback">🟨</div>
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">🟨 KARTU KUNING</div>
          <div class="stats-summary-name">${totalYellow} Kartu</div>
          <div class="stats-summary-sub">Akumulasi Disiplin</div>
        </div>
        <div class="stats-summary-value text-yellow">${totalYellow}</div>
      </div>
    `;

    const card4 = `
      <div class="stats-summary-card ${this.currentStatsTab === 'red' ? 'active' : ''}" onclick="app.setStatsTab('red')">
        <div class="stats-summary-icon-fallback">🟥</div>
        <div class="stats-summary-info">
          <div class="stats-summary-kicker">🟥 KARTU MERAH</div>
          <div class="stats-summary-name">${totalRed} Kartu</div>
          <div class="stats-summary-sub">Sanksi & Larangan</div>
        </div>
        <div class="stats-summary-value text-red">${totalRed}</div>
      </div>
    `;

    container.innerHTML = card1 + card2 + card3 + card4;
  },

  renderStatsTable() {
    const tableHead = document.getElementById("statsTableHead");
    const tableBody = document.getElementById("statsTableBody");
    const badgeEl = document.getElementById("statsHeaderBadge");
    if (!tableBody) return;

    const cat = this.currentCategory;
    const tab = this.currentStatsTab || "scorers";

    // Update active tab buttons & summary active cards
    document.querySelectorAll(".stats-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.stat === tab);
    });
    document.querySelectorAll(".stats-summary-card").forEach(c => {
      c.classList.remove("active");
    });

    const safeImg = (src) => src || "assets/acc_logo.png";

    if (tab === "scorers") {
      if (badgeEl) {
        badgeEl.innerHTML = `<span>⚽</span> Peringkat Pencetak Gol Terbanyak &amp; Kandidat Golden Boot`;
      }
      if (tableHead) {
        tableHead.innerHTML = `
          <tr>
            <th style="width: 50px; text-align: center;">#</th>
            <th style="text-align: left;">Pemain</th>
            <th class="col-secondary" style="text-align: left; width: 190px;">Sekolah / Tim</th>
            <th class="col-secondary" style="text-align: center; width: 85px;">Posisi</th>
            <th style="text-align: center; width: 85px;">GOL</th>
          </tr>
        `;
      }

      const scorers = this.store.getTopScorersList(cat);
      if (scorers.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: #94a3b8;">
              <div style="font-size: 2rem; margin-bottom: 8px;">⚽</div>
              <strong>Belum ada catatan gol pada kelas ${cat}.</strong>
              <div style="font-size: 0.8rem; margin-top: 4px; color: #64748b;">Data akan otomatis bertambah seiring berlangsungnya laga.</div>
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = scorers.map((s, idx) => {
        let rankHtml = `<span class="stats-pos-num">${idx + 1}</span>`;
        if (idx === 0) rankHtml = `<span class="stats-medal-badge gold" title="Peringkat 1">🥇 1</span>`;
        else if (idx === 1) rankHtml = `<span class="stats-medal-badge silver" title="Peringkat 2">🥈 2</span>`;
        else if (idx === 2) rankHtml = `<span class="stats-medal-badge bronze" title="Peringkat 3">🥉 3</span>`;

        const pRating = this.calculatePlayerRating(s);
        const pTarget = s.playerNo || s.playerName;

        return `
          <tr class="stats-clickable-row" onclick="app.openPlayerDetailPage('${s.teamId}', '${encodeURIComponent(pTarget)}')">
            <td style="text-align: center; vertical-align: middle;">${rankHtml}</td>
            <td style="text-align: left; vertical-align: middle;">
              <div class="stats-player-cell">
                <img src="${safeImg(s.photo)}" alt="${s.playerName}" class="stats-player-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
                <div class="stats-player-meta">
                  <div class="stats-player-name-row">
                    <strong class="stats-player-name">${s.playerName}</strong>
                    <span class="stats-jersey-no">(#${s.playerNo})</span>
                  </div>
                  <div class="stats-player-sub-row">
                    <span class="stats-mobile-team">${s.teamName}</span>
                    <span class="stats-dot-sep">•</span>
                    <span class="stats-pos-pill">${s.pos || 'Flank'}</span>
                    <span class="stats-rating-pill">⭐ ${pRating}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: left; vertical-align: middle; color: #e2e8f0; font-weight: 600;">
              ${s.teamName}
            </td>
            <td class="col-secondary" style="text-align: center; vertical-align: middle;">
              <span class="stats-pos-pill">${s.pos || 'Pemain'}</span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-metric-pill metric-gold">${s.goals}</span>
            </td>
          </tr>
        `;
      }).join("");

    } else if (tab === "assists") {
      if (badgeEl) {
        badgeEl.innerHTML = `<span>👟</span> Peringkat Assist Terbanyak &amp; Playmaker Turnamen`;
      }
      if (tableHead) {
        tableHead.innerHTML = `
          <tr>
            <th style="width: 50px; text-align: center;">#</th>
            <th style="text-align: left;">Pemain</th>
            <th class="col-secondary" style="text-align: left; width: 190px;">Sekolah / Tim</th>
            <th class="col-secondary" style="text-align: center; width: 85px;">Posisi</th>
            <th style="text-align: center; width: 85px;">ASSIST</th>
          </tr>
        `;
      }

      const assisters = typeof this.store.getTopAssistsList === "function" ? this.store.getTopAssistsList(cat) : [];
      if (assisters.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: #94a3b8;">
              <div style="font-size: 2rem; margin-bottom: 8px;">👟</div>
              <strong>Belum ada catatan assist pada kelas ${cat}.</strong>
              <div style="font-size: 0.8rem; margin-top: 4px; color: #64748b;">Data akan otomatis bertambah seiring berlangsungnya laga.</div>
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = assisters.map((s, idx) => {
        let rankHtml = `<span class="stats-pos-num">${idx + 1}</span>`;
        if (idx === 0) rankHtml = `<span class="stats-medal-badge gold" title="Peringkat 1">🥇 1</span>`;
        else if (idx === 1) rankHtml = `<span class="stats-medal-badge silver" title="Peringkat 2">🥈 2</span>`;
        else if (idx === 2) rankHtml = `<span class="stats-medal-badge bronze" title="Peringkat 3">🥉 3</span>`;

        const pRating = this.calculatePlayerRating(s);
        const pTarget = s.playerNo || s.playerName;

        return `
          <tr class="stats-clickable-row" onclick="app.openPlayerDetailPage('${s.teamId}', '${encodeURIComponent(pTarget)}')">
            <td style="text-align: center; vertical-align: middle;">${rankHtml}</td>
            <td style="text-align: left; vertical-align: middle;">
              <div class="stats-player-cell">
                <img src="${safeImg(s.photo)}" alt="${s.playerName}" class="stats-player-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
                <div class="stats-player-meta">
                  <div class="stats-player-name-row">
                    <strong class="stats-player-name">${s.playerName}</strong>
                    <span class="stats-jersey-no">(#${s.playerNo})</span>
                  </div>
                  <div class="stats-player-sub-row">
                    <span class="stats-mobile-team">${s.teamName}</span>
                    <span class="stats-dot-sep">•</span>
                    <span class="stats-pos-pill">${s.pos || 'Flank'}</span>
                    <span class="stats-rating-pill">⭐ ${pRating}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: left; vertical-align: middle; color: #e2e8f0; font-weight: 600;">
              ${s.teamName}
            </td>
            <td class="col-secondary" style="text-align: center; vertical-align: middle;">
              <span class="stats-pos-pill">${s.pos || 'Pemain'}</span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-metric-pill metric-cyan">${s.assists}</span>
            </td>
          </tr>
        `;
      }).join("");

    } else if (tab === "yellow") {
      if (badgeEl) {
        badgeEl.innerHTML = `<span>🟨</span> Rekapitulasi Kartu Kuning &amp; Akumulasi Pemain`;
      }
      if (tableHead) {
        tableHead.innerHTML = `
          <tr>
            <th style="width: 50px; text-align: center;">#</th>
            <th style="text-align: left;">Pemain</th>
            <th class="col-secondary" style="text-align: left; width: 190px;">Sekolah / Tim</th>
            <th style="text-align: center; width: 85px;">KUNING</th>
            <th style="text-align: center; width: 140px;">Status</th>
            <th style="text-align: center; width: 90px;">Aksi</th>
          </tr>
        `;
      }

      const records = this.store.getDisciplinaryRecords(cat).filter(r => r.yellowCount > 0);
      if (records.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 36px 16px; color: #10b981;">
              <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
              <strong>Belum ada kartu kuning yang tercatat di kelas ${cat}.</strong>
              <div style="font-size: 0.8rem; margin-top: 4px; color: #94a3b8;">Prinsip Fair Play &amp; sportivitas terjaga dengan baik!</div>
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = records.map((r, idx) => {
        const pTarget = r.playerNo || r.playerName;
        const waMsgText = `⚠️ PEMBERITAHUAN DISIPLIN PANITIA ACC 2026:\nPemain an. ${r.playerName} (#${r.playerNo}) dari tim *${r.teamName}* telah menerima ${r.yellowCount} Kartu Kuning.\nStatus: *${r.status}*${r.actionNote ? ` (${r.actionNote})` : ''}.\nHarap official memperhatikan demi kelancaran turnamen.`;
        const waUrl = this.getWhatsAppUrl(r.managerPhone, waMsgText);
        const badgeClass = r.statusType === 'danger' || r.statusType === 'warning' ? 'suspension-badge' : 'safe-badge';

        return `
          <tr class="stats-clickable-row" onclick="app.openPlayerDetailPage('${r.teamId}', '${encodeURIComponent(pTarget)}')">
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-pos-num">${idx + 1}</span>
            </td>
            <td style="text-align: left; vertical-align: middle;">
              <div class="stats-player-cell">
                <img src="${safeImg(r.photo)}" alt="${r.playerName}" class="stats-player-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
                <div class="stats-player-meta">
                  <div class="stats-player-name-row">
                    <strong class="stats-player-name">${r.playerName}</strong>
                    <span class="stats-jersey-no">(#${r.playerNo})</span>
                  </div>
                  <div class="stats-player-sub-row">
                    <span class="stats-mobile-team">${r.teamName}</span>
                    <span class="stats-dot-sep">•</span>
                    <span class="stats-pos-pill">${r.pos || 'Pemain'}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: left; vertical-align: middle; color: #e2e8f0; font-weight: 600;">
              ${r.teamName}
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-metric-pill metric-yellow">🟨 ${r.yellowCount}</span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="${badgeClass}">${r.status}</span>
              ${r.actionNote ? `<div style="font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">${r.actionNote}</div>` : ''}
            </td>
            <td style="text-align: center; vertical-align: middle;">
              ${r.managerPhone ? `
                <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" class="stats-row-action" title="Kirim Pesan Resmi ke Official Tim">
                  📲 WA
                </a>
              ` : `<span style="color: #64748b; font-size: 0.75rem;">-</span>`}
            </td>
          </tr>
        `;
      }).join("");

    } else if (tab === "red") {
      if (badgeEl) {
        badgeEl.innerHTML = `<span>🟥</span> Rekapitulasi Kartu Merah &amp; Sanksi Pertandingan`;
      }
      if (tableHead) {
        tableHead.innerHTML = `
          <tr>
            <th style="width: 50px; text-align: center;">#</th>
            <th style="text-align: left;">Pemain</th>
            <th class="col-secondary" style="text-align: left; width: 190px;">Sekolah / Tim</th>
            <th style="text-align: center; width: 85px;">MERAH</th>
            <th style="text-align: center; width: 140px;">Sanksi</th>
            <th style="text-align: center; width: 90px;">Aksi</th>
          </tr>
        `;
      }

      const records = this.store.getDisciplinaryRecords(cat).filter(r => r.redCount > 0);
      if (records.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 36px 16px; color: #10b981;">
              <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
              <strong>Nir-kartu merah! Tidak ada kartu merah pada kelas ${cat}.</strong>
              <div style="font-size: 0.8rem; margin-top: 4px; color: #94a3b8;">Seluruh peserta menjunjung tinggi sportivitas dan rasa hormat.</div>
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = records.map((r, idx) => {
        const pTarget = r.playerNo || r.playerName;
        const waMsgText = `⚠️ PEMBERITAHUAN SANKSI DISIPLIN RESMI ACC 2026:\nPemain an. ${r.playerName} (#${r.playerNo}) dari tim *${r.teamName}* telah menerima Kartu Merah Langsung / 2 Kartu Kuning.\nStatus: *${r.status}*${r.actionNote ? ` (${r.actionNote})` : ''}.\nHarap official tim memastikan pemain yang bersangkutan mematuhi sanksi larangan bertanding.`;
        const waUrl = this.getWhatsAppUrl(r.managerPhone, waMsgText);

        return `
          <tr class="stats-clickable-row" onclick="app.openPlayerDetailPage('${r.teamId}', '${encodeURIComponent(pTarget)}')">
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-pos-num">${idx + 1}</span>
            </td>
            <td style="text-align: left; vertical-align: middle;">
              <div class="stats-player-cell">
                <img src="${safeImg(r.photo)}" alt="${r.playerName}" class="stats-player-avatar" onerror="this.onerror=null; this.src='assets/acc_logo.png'">
                <div class="stats-player-meta">
                  <div class="stats-player-name-row">
                    <strong class="stats-player-name">${r.playerName}</strong>
                    <span class="stats-jersey-no">(#${r.playerNo})</span>
                  </div>
                  <div class="stats-player-sub-row">
                    <span class="stats-mobile-team">${r.teamName}</span>
                    <span class="stats-dot-sep">•</span>
                    <span class="stats-pos-pill">${r.pos || 'Pemain'}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="col-secondary" style="text-align: left; vertical-align: middle; color: #e2e8f0; font-weight: 600;">
              ${r.teamName}
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="stats-metric-pill metric-red">🟥 ${r.redCount}</span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="suspension-badge">${r.status}</span>
              ${r.actionNote ? `<div style="font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">${r.actionNote}</div>` : ''}
            </td>
            <td style="text-align: center; vertical-align: middle;">
              ${r.managerPhone ? `
                <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" class="stats-row-action" title="Kirim Pesan Resmi ke Official Tim">
                  📲 WA
                </a>
              ` : `<span style="color: #64748b; font-size: 0.75rem;">-</span>`}
            </td>
          </tr>
        `;
      }).join("");
    }
  },

  // Fallbacks for legacy calls
  renderDiscipline() {
    this.currentStatsTab = "yellow";
    this.switchTab("stats", false);
  },

  renderTopScorers() {
    this.currentStatsTab = "scorers";
    this.switchTab("stats", false);
  },

  // 7. RENDER JUKNIS (Buku Panduan & Regulasi ACC 2026)
  renderJuknis() {
    const container = document.getElementById("juknisContent");
    const contactEl = document.getElementById("juknisContact");
    if (!container) return;

    let rawText = (this.store && this.store.data && this.store.data.config && this.store.data.config.rulesText)
      ? this.store.data.config.rulesText
      : (typeof DEFAULT_DATA !== 'undefined' && DEFAULT_DATA.config ? DEFAULT_DATA.config.rulesText : "");

    const officialRules = (typeof DEFAULT_DATA !== 'undefined' && DEFAULT_DATA.config && DEFAULT_DATA.config.rulesText)
      ? DEFAULT_DATA.config.rulesText : "";

    // Jamin regulasi selalu memakai teks resmi 11 Bab (A s.d K) lengkap tanpa tertimpa cache usang
    if (officialRules && (!rawText || rawText.length < (officialRules.length - 200) || !rawText.includes("### K. PENGHARGAAN"))) {
      rawText = officialRules;
      if (this.store && this.store.data && this.store.data.config) {
        this.store.data.config.rulesText = officialRules;
      }
    }

    const html = this.parseJuknisMarkdown(rawText);
    container.innerHTML = html;
    this._juknisRawText = rawText;
    this._currentJuknisChapter = 'ALL';

    // Jamin semua kartu bab regulasi langsung tampil terang & terbaca tanpa tertahan efek scroll-reveal
    container.querySelectorAll('.juknis-chapter-card').forEach(card => {
      card.classList.add('is-revealed');
      card.style.opacity = '1';
      card.style.transform = 'none';
      card.style.filter = 'none';
    });

    if (typeof this.initScrollReveal === "function") {
      this.initScrollReveal();
    }

    const activeContact = (this.store && this.store.data && this.store.data.config && this.store.data.config.contactCommittee && !this.store.data.config.contactCommittee.includes("Harun"))
      ? this.store.data.config.contactCommittee
      : "0859-3322-8817 (Ust. Ahmadi)";
    if (this.store && this.store.data && this.store.data.config) {
      this.store.data.config.contactCommittee = activeContact;
    }
    if (contactEl) {
      contactEl.textContent = activeContact;
    }
    const waHelpdeskBtn = document.querySelector(".juknis-helpdesk-actions a");
    if (waHelpdeskBtn) {
      const rawDigits = (this.cleanWhatsAppNumber ? this.cleanWhatsAppNumber(activeContact) : "6285933228817") || "6285933228817";
      const cleanWaNum = rawDigits.startsWith("0") ? "62" + rawDigits.substring(1) : (rawDigits.startsWith("62") ? rawDigits : "6285933228817");
      waHelpdeskBtn.href = `https://wa.me/${cleanWaNum}?text=${encodeURIComponent("Halo Panitia ACC 2026, saya ingin bertanya seputar regulasi dan pertandingan")}`;
    }
  },

  parseJuknisMarkdown(rawText) {
    if (!rawText || !rawText.trim()) {
      return '<div class="juknis-empty-state"><p>Belum ada data regulasi turnamen.</p></div>';
    }

    const rawChapters = rawText.split(/^### /m).filter(Boolean);
    let html = '';

    const chapterMeta = {
      'A': { icon: '📌', cat: 'Identitas & Pelaksanaan', tagColor: '#38bdf8' },
      'B': { icon: '📅', cat: 'Timeline & Jadwal Resmi', tagColor: '#60a5fa' },
      'C': { icon: '📋', cat: 'Ketentuan Peserta & TM', tagColor: '#34d399' },
      'D': { icon: '👥', cat: 'Ofisial Tim & ID Card', tagColor: '#2dd4bf' },
      'E': { icon: '⏱️', cat: 'Sistem Laga & Durasi Waktu', tagColor: '#fbbf24' },
      'F': { icon: '⚽', cat: 'Regulasi FIFA & Kick-In', tagColor: '#f59e0b' },
      'G': { icon: '🕌', cat: 'Tata Tertib & Adab Pesantren', tagColor: '#10b981' },
      'H': { icon: '🟨', cat: 'Sanksi Kartu, WO & Denda', tagColor: '#f87171' },
      'I': { icon: '📣', cat: 'Tata Tertib Suporter', tagColor: '#fb923c' },
      'J': { icon: '⚖️', cat: 'Gangguan, Medis & Protes', tagColor: '#a78bfa' },
      'K': { icon: '🏆', cat: 'Penghargaan & Hadiah Resmi', tagColor: '#f59e0b' }
    };

    rawChapters.forEach(rawChap => {
      const lines = rawChap.split('\n');
      const headerLine = lines[0].trim();
      const contentLines = lines.slice(1);

      const letterMatch = headerLine.match(/^([A-Z])\.\s*(.*)/);
      const letter = letterMatch ? letterMatch[1] : '•';
      const title = letterMatch ? letterMatch[2] : headerLine;
      const meta = chapterMeta[letter] || { icon: '📄', cat: 'Regulasi Turnamen', tagColor: '#fbbf24' };

      let bodyHtml = '';

      // Bab B: Timeline Grid
      if (letter === 'B') {
        bodyHtml += '<div class="juknis-timeline-grid">';
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean) return;
          const parts = clean.split(/:\s*(.*)/);
          if (parts.length >= 2) {
            bodyHtml += `
              <div class="juknis-timeline-item">
                <div class="juknis-timeline-date">${parts[0]}</div>
                <div class="juknis-timeline-desc">${parts[1]}</div>
              </div>`;
          } else {
            bodyHtml += `<div class="juknis-timeline-item"><div class="juknis-timeline-desc">${clean}</div></div>`;
          }
        });
        bodyHtml += '</div>';
      }
      // Bab H: Tabel Denda Kartu & Sanksi
      else if (letter === 'H') {
        bodyHtml += `
          <div class="juknis-table-wrap">
            <table class="juknis-table">
              <thead>
                <tr>
                  <th>Jenis Pelanggaran / Kartu</th>
                  <th>Kategori SD</th>
                  <th>Kategori SMP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Kartu Kuning</strong></td>
                  <td><span class="juknis-fee-pill yellow">Rp 10.000</span></td>
                  <td><span class="juknis-fee-pill yellow">Rp 20.000</span></td>
                </tr>
                <tr>
                  <td><strong>Kartu Merah Tidak Langsung</strong> (2 Kartu Kuning)</td>
                  <td><span class="juknis-fee-pill red">Rp 15.000</span></td>
                  <td><span class="juknis-fee-pill red">Rp 30.000</span></td>
                </tr>
                <tr>
                  <td><strong>Kartu Merah Langsung</strong> (Pelanggaran Berat)</td>
                  <td><span class="juknis-fee-pill red">Rp 25.000</span></td>
                  <td><span class="juknis-fee-pill red">Rp 50.000</span></td>
                </tr>
                <tr>
                  <td><strong>Kuning + Merah Langsung</strong></td>
                  <td><span class="juknis-fee-pill dark">Rp 60.000</span></td>
                  <td><span class="juknis-fee-pill dark">Rp 60.000</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;

        bodyHtml += '<div class="juknis-points-list">';
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean || clean.includes('Denda Administrasi Kartu')) return;

          let calloutClass = '';
          if (clean.includes('Sanksi Keterlambatan') || clean.includes('WO 3-0')) calloutClass = 'warning';
          if (clean.includes('Pemutihan kartu TIDAK BERLAKU')) calloutClass = 'danger';

          if (calloutClass) {
            bodyHtml += `
              <div class="juknis-callout ${calloutClass}">
                <span class="callout-icon">⚠️</span>
                <div>${clean}</div>
              </div>`;
          } else {
            bodyHtml += `
              <div class="juknis-point-item">
                <span class="point-dot">•</span>
                <div class="point-text">${clean}</div>
              </div>`;
          }
        });
        bodyHtml += '</div>';
      }
      // Bab K: Tabel Hadiah & Uang Pembinaan
      else if (letter === 'K') {
        bodyHtml += `
          <div class="juknis-table-wrap">
            <table class="juknis-table prize-table">
              <thead>
                <tr>
                  <th>Penghargaan Resmi</th>
                  <th>Kategori SD</th>
                  <th>Kategori SMP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="prize-badge gold">🥇 Juara I</span></td>
                  <td>Trofi + Sertifikat + <strong>Rp 1.500.000</strong></td>
                  <td>Trofi + Sertifikat + <strong>Rp 2.000.000</strong></td>
                </tr>
                <tr>
                  <td><span class="prize-badge silver">🥈 Juara II</span></td>
                  <td>Sertifikat + <strong>Rp 750.000</strong></td>
                  <td>Sertifikat + <strong>Rp 1.000.000</strong></td>
                </tr>
                <tr>
                  <td><span class="prize-badge bronze">🥉 Juara III</span></td>
                  <td>Sertifikat + <strong>Rp 500.000</strong></td>
                  <td>Sertifikat + <strong>Rp 500.000</strong></td>
                </tr>
                <tr>
                  <td><span class="prize-badge star">⭐ Pemain Terbaik (MVP)</span></td>
                  <td>Plakat + <strong>Rp 200.000</strong></td>
                  <td>Plakat + <strong>Rp 250.000</strong></td>
                </tr>
                <tr>
                  <td><span class="prize-badge ball">⚽ Top Scorer</span></td>
                  <td>Plakat + <strong>Rp 200.000</strong></td>
                  <td>Plakat + <strong>Rp 250.000</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
      // Bab G: Tata Tertib Pesantren
      else if (letter === 'G') {
        bodyHtml += `
          <div class="juknis-callout syariat">
            <span class="callout-icon">🕌</span>
            <div>
              <strong>Kewajiban Menutup Aurat di Lingkungan Pesantren:</strong><br/>
              Pemain putra <strong>wajib mengenakan celana training/panjang</strong> saat memasuki pesantren & bertanding. <strong>Dilarang keras memakai celana pendek</strong> di seluruh wilayah Ma'had Al-Fayyadh.
            </div>
          </div>
          <div class="juknis-points-list">
        `;
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean) return;
          bodyHtml += `
            <div class="juknis-point-item">
              <span class="point-dot">•</span>
              <div class="point-text">${clean}</div>
            </div>`;
        });
        bodyHtml += '</div>';
      }
      // Bab I: Tata Tertib Suporter
      else if (letter === 'I') {
        bodyHtml += `
          <div class="juknis-callout warning">
            <span class="callout-icon">🧕</span>
            <div>
              <strong>Syarat Mutlak Suporter/Penonton Putri:</strong><br/>
              Wajib mengenakan busana muslimah yang longgar, memakai rok panjang, bermasker, serta menjaga ketertiban. Dilarang keras mengenakan pakaian ketat atau celana panjang.
            </div>
          </div>
          <div class="juknis-points-list">
        `;
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean || clean.includes('Tahapan Sanksi')) return;
          bodyHtml += `
            <div class="juknis-point-item">
              <span class="point-dot">•</span>
              <div class="point-text">${clean}</div>
            </div>`;
        });
        bodyHtml += `</div>
          <div class="juknis-stepper-title">Tahapan Sanksi Pelanggaran Suporter:</div>
          <div class="juknis-stepper-grid">
            <div class="juknis-step-card">
              <div class="step-num">1</div>
              <div class="step-title">Peringatan Lisan</div>
              <div class="step-desc">Diberikan secara tegas pada pelanggaran ke-1 dan ke-2.</div>
            </div>
            <div class="juknis-step-card warning">
              <div class="step-num">2</div>
              <div class="step-title">Dikeluarkan Paksa</div>
              <div class="step-desc">Pelanggaran ke-3: oknum suporter dikeluarkan paksa dari area GOR.</div>
            </div>
            <div class="juknis-step-card danger">
              <div class="step-num">3</div>
              <div class="step-title">Diskualifikasi Tim</div>
              <div class="step-desc">Pelanggaran berulang: tim yang didukung langsung didiskualifikasi!</div>
            </div>
          </div>
        `;
      }
      // Bab F: Kick-in & FIFA
      else if (letter === 'F') {
        bodyHtml += `
          <div class="juknis-callout kickin-alert">
            <span class="callout-icon">⚽</span>
            <div>
              <strong>Aturan Khusus Tendangan ke Dalam (Kick-in):</strong><br/>
              Jika bola dari tendangan ke dalam langsung mengarah ke gawang lawan dan masuk tanpa menyentuh pemain lain, maka <strong>GOL TIDAK SAH</strong> (dilanjutkan lemparan gawang oleh kiper lawan). Bola <strong>wajib menyentuh pemain lain terlebih dahulu</strong> sebelum melewati garis gawang agar sah menjadi gol.
            </div>
          </div>
          <div class="juknis-points-list">
        `;
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean) return;
          bodyHtml += `
            <div class="juknis-point-item">
              <span class="point-dot">•</span>
              <div class="point-text">${clean}</div>
            </div>`;
        });
        bodyHtml += '</div>';
      }
      // Bab lainnya (A, C, D, E, J)
      else {
        bodyHtml += '<div class="juknis-points-list">';
        contentLines.forEach(l => {
          const clean = l.replace(/^[-*]\s*/, '').trim();
          if (!clean) return;

          if (clean.includes('Jeda Waktu Shalat Wajib')) {
            bodyHtml += `
              <div class="juknis-callout syariat">
                <span class="callout-icon">🕌</span>
                <div><strong>Jeda Waktu Shalat Wajib:</strong> Saat azan berkumandang, seluruh pertandingan dihentikan. Seluruh peserta dan suporter wajib melaksanakan sholat berjamaah.</div>
              </div>`;
          } else if (clean.includes('Anti Match Fixing')) {
            bodyHtml += `
              <div class="juknis-callout danger">
                <span class="callout-icon">🚫</span>
                <div><strong>Anti Match Fixing:</strong> Tim yang teridentifikasi melakukan pengaturan skor akan langsung didiskualifikasi tanpa kompromi!</div>
              </div>`;
          } else {
            bodyHtml += `
              <div class="juknis-point-item">
                <span class="point-dot">•</span>
                <div class="point-text">${clean}</div>
              </div>`;
          }
        });
        bodyHtml += '</div>';
      }

      html += `
        <div class="juknis-chapter-card is-revealed" id="juknisChap_${letter}" data-letter="${letter}">
          <div class="juknis-chapter-header">
            <div class="juknis-chapter-badge">${letter}</div>
            <div class="juknis-chapter-meta">
              <div class="juknis-chapter-cat">${meta.icon} ${meta.cat}</div>
              <h3 class="juknis-chapter-title">${title}</h3>
            </div>
          </div>
          <div class="juknis-chapter-body">
            ${bodyHtml}
          </div>
        </div>
      `;
    });

    return html;
  },

  filterJuknisChapter(letter) {
    this._currentJuknisChapter = letter;
    const chips = document.querySelectorAll('#juknisFilterChips .juknis-filter-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-chapter') === letter);
    });

    const cards = document.querySelectorAll('.juknis-chapter-card');
    cards.forEach(card => {
      if (letter === 'ALL') {
        card.style.display = '';
      } else {
        const cardLetter = card.getAttribute('data-letter');
        card.style.display = (cardLetter === letter) ? '' : 'none';
      }
    });

    if (letter !== 'ALL') {
      const targetCard = document.getElementById(`juknisChap_${letter}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  },

  filterJuknis(query) {
    const clearBtn = document.getElementById("juknisSearchClearBtn");
    const container = document.getElementById("juknisContent");
    if (!container) return;

    if (!query || !query.trim()) {
      if (clearBtn) clearBtn.style.display = 'none';
      const emptyMsg = document.getElementById('juknisSearchEmpty');
      if (emptyMsg) emptyMsg.style.display = 'none';
      this.filterJuknisChapter(this._currentJuknisChapter || 'ALL');
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-flex';
    const q = query.toLowerCase();
    const cards = container.querySelectorAll('.juknis-chapter-card');
    let matchedCount = 0;

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (text.includes(q)) {
        card.style.display = '';
        matchedCount++;
      } else {
        card.style.display = 'none';
      }
    });

    let emptyMsg = document.getElementById('juknisSearchEmpty');
    if (matchedCount === 0) {
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'juknisSearchEmpty';
        emptyMsg.className = 'juknis-search-empty';
        container.appendChild(emptyMsg);
      }
      emptyMsg.innerHTML = `<div class="empty-icon">🔍</div><p>Tidak ditemukan pasal atau aturan yang cocok dengan "<strong>${typeof Security !== 'undefined' ? Security.sanitize(query) : query}</strong>".</p>`;
      emptyMsg.style.display = 'block';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  },

  clearJuknisSearch() {
    const input = document.getElementById("juknisSearchInput");
    if (input) input.value = '';
    this.filterJuknis('');
  },

  // =========================================================
  // DRAW GRUP / LIVE GROUP DRAWING SIMULATOR METHODS
  // =========================================================
  getAudioContext() {
    if (!this._audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try { this._audioCtx = new AudioCtx(); } catch (e) { }
      }
    }
    if (this._audioCtx && this._audioCtx.state === "suspended") {
      try { this._audioCtx.resume(); } catch (e) { }
    }
    return this._audioCtx;
  },

  playDrawTickSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(640, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) { }
  },

  playDrawWinSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + (idx * 0.09);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch (e) { }
  },

  fireDrawConfetti() {
    const container = document.getElementById("drawConfettiContainer");
    if (!container) return;
    container.innerHTML = "";
    const colors = ["#f59e0b", "#10b981", "#0284c7", "#ec4899", "#8b5cf6", "#fbbf24", "#ffffff"];
    for (let i = 0; i < 32; i++) {
      const piece = document.createElement("div");
      piece.className = "draw-confetti-piece";
      const color = colors[Math.floor(Math.random() * colors.length)];
      const tx = (Math.random() - 0.5) * 440 + "px";
      const ty = (Math.random() * -100 - 20) + "px";
      const rot = (Math.random() * 720 - 360) + "deg";
      piece.style.backgroundColor = color;
      piece.style.left = "50%";
      piece.style.top = "50%";
      piece.style.setProperty("--tx", tx);
      piece.style.setProperty("--ty", ty);
      piece.style.setProperty("--rot", rot);
      piece.style.animationDelay = (Math.random() * 0.12) + "s";
      container.appendChild(piece);
    }
    setTimeout(() => {
      if (container) container.innerHTML = "";
    }, 1500);
  },

  getDrawTargetSequence() {
    // 4 Slots per group, cycling through A -> B -> C -> D for each slot 1 per 1
    const seq = [];
    const groups = ["A", "B", "C", "D"];
    for (let slot = 1; slot <= 4; slot++) {
      for (const g of groups) {
        seq.push({ group: g, slotIndex: slot });
      }
    }
    return seq;
  },

  getDrawState() {
    if (!this.drawState) {
      try {
        const raw = localStorage.getItem("acc_draw_state_2026");
        if (raw) this.drawState = JSON.parse(raw);
      } catch (e) { }
    }
    if (!this.drawState) {
      this.drawState = {
        SMP: { groups: { A: [], B: [], C: [], D: [] }, history: [], isReset: false },
        SD: { groups: { A: [], B: [], C: [], D: [] }, history: [], isReset: false }
      };
    }
    if (!this.drawState.SMP) this.drawState.SMP = { groups: { A: [], B: [], C: [], D: [] }, history: [], isReset: false };
    if (!this.drawState.SD) this.drawState.SD = { groups: { A: [], B: [], C: [], D: [] }, history: [], isReset: false };
    ["SMP", "SD"].forEach(cat => {
      if (!this.drawState[cat].groups) this.drawState[cat].groups = { A: [], B: [], C: [], D: [] };
      ["A", "B", "C", "D"].forEach(g => {
        if (!Array.isArray(this.drawState[cat].groups[g])) this.drawState[cat].groups[g] = [];
      });
      if (!Array.isArray(this.drawState[cat].history)) this.drawState[cat].history = [];
      this.drawState[cat].isReset = Boolean(this.drawState[cat].isReset);
    });
    return this.drawState;
  },

  saveDrawState() {
    try {
      localStorage.setItem("acc_draw_state_2026", JSON.stringify(this.drawState));
    } catch (e) { }
  },

  getDrawCategoryTeams(cat = this.currentDrawCat) {
    const teams = (this.store && this.store.data && Array.isArray(this.store.data.teams)) ? this.store.data.teams : [];
    return teams.filter(t => (t.category || "SMP") === cat);
  },

  getUndrawnTeams(cat = this.currentDrawCat) {
    const allTeams = this.getDrawCategoryTeams(cat);
    const state = this.getDrawState()[cat];
    const drawnIds = new Set(state.history.map(h => h.teamId));
    return allTeams.filter(t => !drawnIds.has(t.id));
  },

  getNextDrawTarget(cat = this.currentDrawCat) {
    const state = this.getDrawState()[cat];
    const seq = this.getDrawTargetSequence();
    const nextIdx = state.history.length;
    if (nextIdx >= seq.length) return null;
    return { ...seq[nextIdx], stepIndex: nextIdx + 1, totalSteps: seq.length };
  },

  setDrawCategory(cat) {
    if (this.isDrawingSpinning) return;
    if (this.isAutoDrawing) this.toggleAutoDraw(true);
    if (cat !== "SMP" && cat !== "SD") cat = "SMP";
    this.currentCategory = cat;
    this.currentDrawCat = cat;
    this.filterTeam = "all";
    this._lastTeamFilterKey = null;
    localStorage.setItem("acc_active_category", cat);
    this.updateCategoryUI();
    document.querySelectorAll(".btn-draw-cat").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.cat === cat);
    });
    this.renderDrawView();
  },

  isCategoryDrawn(cat = this.currentDrawCat || "SMP") {
    const allTeams = this.getDrawCategoryTeams(cat);
    if (!allTeams || allTeams.length === 0) return false;

    // 1. Prioritas Utama: Jika tim di turnamen sudah memiliki grup sah A, B, C, D (dari Supabase / turnamen)
    const validGroupTeams = allTeams.filter(t => t.group && ["A", "B", "C", "D"].includes(t.group) && t.group !== "-");
    if (validGroupTeams.length >= Math.min(16, allTeams.length) && validGroupTeams.length > 0) {
      return true;
    }

    const state = this.getDrawState()[cat];
    if (state && state.isReset) return false;

    // 2. Jika history undian di state lokal sudah lengkap
    if (state && state.history && state.history.length >= Math.min(16, allTeams.length) && state.history.length > 0) {
      return true;
    }

    return false;
  },

  setDrawPanitiaMode(mode) {
    this.drawPanitiaMode = mode;
    this.renderDrawView();
  },

  renderDrawView() {
    const cat = this.currentDrawCat || this.currentCategory || "SMP";
    this.currentDrawCat = cat;
    this.currentCategory = cat;
    this.syncDrawStateFromTournament(cat);

    const isPanitia = this.isAdmin();
    const state = this.getDrawState()[cat];
    const undrawn = this.getUndrawnTeams(cat);
    const nextTarget = this.getNextDrawTarget(cat);
    const isFinished = !nextTarget;
    const isDrawn = this.isCategoryDrawn(cat);

    // Update Category Button States
    document.querySelectorAll(".btn-draw-cat").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.cat === cat);
    });

    const userContainer = document.getElementById("drawUserContainer");
    const panitiaContainer = document.getElementById("drawPanitiaStageContainer");
    const roleBanner = document.getElementById("drawRoleBanner");

    // KONTROL MODE PANITIA
    if (isPanitia) {
      if (!this.drawPanitiaMode) this.drawPanitiaMode = "simulator";

      if (roleBanner) {
        roleBanner.style.display = "block";
        const catLabel = cat === "SMP" ? "SMP" : "SD";
        roleBanner.innerHTML = `
          <div class="draw-panitia-bar">
            <div class="draw-panitia-bar-info">
              <div class="draw-panitia-badge">👑 MODE PANITIA PELAKSANA (PANPEL)</div>
              <div class="draw-panitia-desc">
                Status Kategori <strong>${catLabel}</strong>:
                <span style="color: ${isDrawn ? '#34d399' : '#fbbf24'}; font-weight: 700;">
                  ${isDrawn ? '✅ Telah Selesai Diundi' : '⏳ Belum Selesai Diundi'}
                </span>
                ${state.history ? ` • (${state.history.length}/16 Tim Terundi)` : ''}
              </div>
            </div>
            <div class="draw-panitia-mode-btns">
              <button type="button" class="btn btn-sm ${this.drawPanitiaMode === 'simulator' ? 'btn-primary' : 'btn-outline'}" onclick="app.setDrawPanitiaMode('simulator')">
                🎮 Simulator Undian
              </button>
              <button type="button" class="btn btn-sm ${this.drawPanitiaMode === 'user' ? 'btn-primary' : 'btn-outline'}" onclick="app.setDrawPanitiaMode('user')">
                👁️ Tampilan Pengunjung (User View)
              </button>
            </div>
          </div>
        `;
      }

      if (this.drawPanitiaMode === "simulator") {
        if (panitiaContainer) panitiaContainer.style.display = "block";
        if (userContainer) userContainer.style.display = "none";
        this.renderDrawSimulator(cat, state, undrawn, nextTarget, isFinished);
        return;
      }
    } else {
      if (roleBanner) roleBanner.style.display = "none";
    }

    // TAMPILAN PENGUNJUNG / AKSES USER
    if (panitiaContainer) panitiaContainer.style.display = "none";
    if (userContainer) {
      userContainer.style.display = "block";
      this.renderDrawUserView(cat, isDrawn);
    }
  },

  renderDrawSimulator(cat, state, undrawn, nextTarget, isFinished) {
    const isPanitia = this.isAdmin();

    // 1. Target Banner
    const targetSlotText = document.getElementById("drawTargetSlotText");
    if (targetSlotText && targetSlotText.parentElement) {
      if (isFinished) {
        targetSlotText.textContent = "SELESAI — SEMUA GRUP TELAH LENGKAP";
        targetSlotText.parentElement.style.background = "rgba(16, 185, 129, 0.15)";
        targetSlotText.parentElement.style.borderColor = "rgba(16, 185, 129, 0.35)";
        targetSlotText.parentElement.style.color = "#34d399";
        targetSlotText.style.color = "#34d399";
      } else {
        targetSlotText.textContent = `GRUP ${nextTarget.group} — SLOT ${nextTarget.slotIndex} (Urutan ke-${nextTarget.stepIndex})`;
        targetSlotText.parentElement.style.background = "rgba(245, 158, 11, 0.12)";
        targetSlotText.parentElement.style.borderColor = "rgba(245, 158, 11, 0.35)";
        targetSlotText.parentElement.style.color = "#fbbf24";
        targetSlotText.style.color = "#fbbf24";
      }
    }

    // 2. Progress Strip
    const countText = document.getElementById("drawCountText");
    if (countText) {
      countText.textContent = `${state.history.length} / 16`;
    }

    const announce = document.getElementById("drawAnnouncement");
    if (announce && !this.isDrawingSpinning) {
      if (isFinished) {
        announce.textContent = "🎉 Seluruh 16 tim telah selesai diundi secara sah ke dalam 4 grup (Grup A, B, C, D) dan tersambung otomatis ke Klasemen & Jadwal!";
      } else if (state.history.length === 0) {
        announce.textContent = `Siap melakukan drawing resmi 1 per 1 untuk Kategori ${cat === "SMP" ? "SMP" : "SD"}. Tekan tombol putar untuk mengundi tim pertama!`;
      } else {
        const last = state.history[state.history.length - 1];
        announce.textContent = `Langkah Terakhir: ${last.teamName} diundi ke Grup ${last.group} (Slot ${last.slot}). Target berikutnya: Grup ${nextTarget.group} Slot ${nextTarget.slotIndex}.`;
      }
    }

    // 3. Update Reel Default View
    if (!this.isDrawingSpinning) {
      const reelName = document.getElementById("drawReelName");
      const reelSub = document.getElementById("drawReelSub");
      const reelBadge = document.getElementById("drawReelBadge");
      const reelItem = document.getElementById("drawReelItem");
      if (reelItem) reelItem.classList.remove("spinning", "winner-celebrate");

      if (isFinished) {
        if (reelBadge) {
          reelBadge.style.background = "#10b981";
          reelBadge.innerHTML = "🏆";
        }
        if (reelName) reelName.textContent = "Hasil Drawing Resmi Lengkap";
        if (reelSub) reelSub.textContent = `16 Tim ${cat} telah menempati Grup A, B, C, & D`;
      } else if (state.history.length > 0) {
        const last = state.history[state.history.length - 1];
        const lastTeam = this.getDrawCategoryTeams(cat).find(t => t.id === last.teamId);
        if (reelBadge) {
          reelBadge.style.background = (lastTeam && lastTeam.badgeColor) || "#f59e0b";
          reelBadge.innerHTML = (lastTeam && lastTeam.logo) ? `<img src="${lastTeam.logo}" alt="${last.teamName}">` : (lastTeam && lastTeam.shortName ? lastTeam.shortName.substring(0, 2) : "⚽");
        }
        if (reelName) reelName.textContent = last.teamName;
        if (reelSub) reelSub.textContent = `Terundi di Grup ${last.group} (Slot ${last.slot}) • ${undrawn.length} Tim Tersisa`;
      } else {
        if (reelBadge) {
          reelBadge.style.background = "#f59e0b";
          reelBadge.innerHTML = "🎲";
        }
        if (reelName) reelName.textContent = "Klik 'Putar Undian' untuk Mulai";
        if (reelSub) reelSub.textContent = `${undrawn.length} Tim Tersedia di Pot Undian`;
      }
    }

    // 4. Update Buttons
    const btnSpin = document.getElementById("btnDrawSingle");
    const btnSpinText = document.getElementById("btnDrawSingleText");
    const btnAuto = document.getElementById("btnDrawAuto");
    const btnReset = document.getElementById("btnDrawReset");
    const btnCopy = document.getElementById("btnDrawCopy");
    const btnApply = document.getElementById("btnDrawApply");

    if (btnSpin) {
      btnSpin.style.display = isPanitia ? "inline-flex" : "none";
      btnSpin.disabled = isFinished || this.isDrawingSpinning;
      if (btnSpinText) {
        btnSpinText.textContent = isFinished ? "Semua Tim Terundi" : "Putar & Undi 1 Tim (Berikutnya)";
      }
    }

    if (btnAuto) {
      btnAuto.style.display = isPanitia ? "inline-flex" : "none";
      btnAuto.disabled = isFinished;
    }

    if (btnReset) {
      btnReset.style.display = isPanitia ? "inline-flex" : "none";
    }

    if (btnCopy) {
      btnCopy.style.display = "inline-flex";
    }

    if (btnApply) {
      btnApply.style.display = isPanitia ? "inline-flex" : "none";
    }

    // Render Slots & Pool
    this.renderDrawSlots();
    this.renderDrawPool();
  },

  renderDrawUserView(cat, isDrawn) {
    const container = document.getElementById("drawUserContainer");
    if (!container) return;

    const catLabel = cat === "SMP" ? "SMP" : "SD";
    const allTeams = this.getDrawCategoryTeams(cat);
    const state = this.getDrawState()[cat];
    const groups = ["A", "B", "C", "D"];

    const heroTitle = document.getElementById("drawHeroTitle");
    const heroKicker = document.getElementById("drawHeroKicker");
    const heroDesc = document.getElementById("drawHeroDesc");

    if (isDrawn) {
      // ========================================================
      // KONDISI 2: SESUDAH DI-DRAW PANITIA (HASIL RESMI SAH)
      // ========================================================
      if (heroKicker) heroKicker.textContent = "HASIL RESMI TELAH DISAHKAN";
      if (heroTitle) heroTitle.innerHTML = `Hasil Resmi Drawing Grup <span class="gradient-text-gold">${catLabel}</span>`;
      if (heroDesc) heroDesc.textContent = `Seluruh 16 tim telah selesai diundi secara sah ke dalam 4 grup (Grup A, B, C, & D) untuk turnamen Al-Fayyadh Champions Cup 2026.`;

      let groupsHtml = "";
      groups.forEach(g => {
        let groupTeams = [];
        const tournamentGroupTeams = allTeams.filter(t => t.group === g && t.group !== "-");
        if (tournamentGroupTeams.length > 0) {
          groupTeams = tournamentGroupTeams.map((t, idx) => ({
            teamId: t.id,
            name: t.name,
            shortName: t.shortName || t.name,
            logo: t.logo || "",
            instansi: t.instansi || "",
            badgeColor: t.badgeColor || "#0284c7",
            slot: idx + 1
          }));
        } else if (state && state.groups && Array.isArray(state.groups[g]) && state.groups[g].length > 0) {
          groupTeams = [...state.groups[g]];
        }

        let teamsListHtml = "";
        for (let slot = 1; slot <= 4; slot++) {
          const t = groupTeams.find(item => item.slot === slot) || groupTeams[slot - 1];
          if (t) {
            const teamObj = (t.teamId && this.store && typeof this.store.getTeam === "function") ? this.store.getTeam(t.teamId) : null;
            const logoSrc = t.logo || (teamObj && teamObj.logo) || "";
            const instansi = (teamObj && teamObj.instansi) || t.instansi || "";
            const avatarHtml = logoSrc
              ? `<img src="${logoSrc}" alt="${t.name}" class="draw-user-team-logo" loading="lazy">`
              : `<span class="draw-user-team-abbr">${(t.shortName || t.name).substring(0, 2).toUpperCase()}</span>`;

            teamsListHtml += `
              <div class="draw-user-slot-row" onclick="app.navigateTo('/daftar-tim/detail-tim/${t.teamId || ''}', 'team-detail', { teamId: '${t.teamId || ''}' })" title="Klik untuk lihat profil tim ${t.name}">
                <div class="draw-user-slot-badge">${g}${slot}</div>
                <div class="draw-user-team-avatar" style="background: ${t.badgeColor || '#0284c7'};">
                  ${avatarHtml}
                </div>
                <div class="draw-user-team-meta">
                  <div class="draw-user-team-name">${t.name}</div>
                  <div class="draw-user-team-instansi">🏫 ${instansi || 'Sulawesi Selatan'}</div>
                </div>
                <div class="draw-user-slot-verified" title="Terundi sah">✓ Sah</div>
              </div>
            `;
          } else {
            teamsListHtml += `
              <div class="draw-user-slot-row empty">
                <div class="draw-user-slot-badge empty">${g}${slot}</div>
                <div class="draw-user-slot-placeholder">Slot ${slot} (Kosong)</div>
              </div>
            `;
          }
        }

        groupsHtml += `
          <div class="draw-user-group-card">
            <div class="draw-user-group-header">
              <div class="draw-user-group-title">
                <span class="draw-group-trophy">🏆</span>
                <span>GRUP ${g}</span>
              </div>
              <span class="draw-user-group-status-badge">4 Tim Terdaftar</span>
            </div>
            <div class="draw-user-slots-container">
              ${teamsListHtml}
            </div>
          </div>
        `;
      });

      container.innerHTML = `
        <!-- STATUS ALERT SESUDAH DIUNDI -->
        <div class="draw-status-card post-draw">
          <div class="draw-status-header">
            <div class="draw-status-pill success">
              <span class="draw-status-dot green"></span>
              <span>PENGUNDIAN SELESAI &amp; DISAHKAN</span>
            </div>
            <span class="draw-status-time">Resmi Turnamen ACC 2026</span>
          </div>
          <h3 class="draw-status-heading">Hasil Pembagian Grup Resmi Kategori ${catLabel}</h3>
          <p class="draw-status-caption">
            Pengundian grup resmi telah tuntas dilaksanakan. Setiap grup terdiri dari 4 tim yang akan saling bertanding memperebutkan tiket perempat final (fase gugur).
          </p>
          <div class="draw-user-actions-bar">
            <button type="button" class="btn btn-primary btn-sm btn-draw-action" onclick="app.copyDrawResults()">
              📋 Salin Teks Hasil Drawing
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-draw-action" onclick="app.switchTab('matches')">
              🏟️ Buka Jadwal Pertandingan
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-draw-action" onclick="app.switchTab('standings')">
              📊 Buka Klasemen Grup
            </button>
          </div>
        </div>

        <!-- 4 GRUP RESMI GRID -->
        <div class="draw-user-groups-grid">
          ${groupsHtml}
        </div>

        <!-- REGULASI KELOLOSAN NOTICE -->
        <div class="draw-user-notice-strip">
          <span class="draw-notice-icon">ℹ️</span>
          <div class="draw-notice-text">
            <strong>Format Kelolosan:</strong> Juara Grup (peringkat 1) dan Runner-up (peringkat 2) dari Grup A, B, C, dan D berhak melaju ke <strong>Babak Perempat Final (Bagan Fase Gugur)</strong>.
          </div>
        </div>
      `;

    } else {
      // ========================================================
      // KONDISI 1: SEBELUM DI-DRAW PANITIA (MENUNGGU PENGUNDIAN)
      // ========================================================
      if (heroKicker) heroKicker.textContent = "STATUS: MENUNGGU PENGUNDIAN RESMI";
      if (heroTitle) heroTitle.innerHTML = `Drawing Grup <span class="gradient-text-gold">${catLabel}</span> Belum Dimulai`;
      if (heroDesc) heroDesc.textContent = `Panitia pelaksana akan segera melakukan pengundian resmi 16 tim peserta ke dalam 4 grup (Grup A, B, C, & D).`;

      let emptyGroupsHtml = "";
      groups.forEach(g => {
        let emptySlotsHtml = "";
        for (let slot = 1; slot <= 4; slot++) {
          emptySlotsHtml += `
            <div class="draw-user-slot-row empty-pre">
              <div class="draw-user-slot-badge empty">${g}${slot}</div>
              <div class="draw-user-slot-placeholder">Slot ${slot} • Menunggu Undian Panitia</div>
              <span class="draw-user-slot-lock">🔒</span>
            </div>
          `;
        }

        emptyGroupsHtml += `
          <div class="draw-user-group-card pre-draw">
            <div class="draw-user-group-header">
              <div class="draw-user-group-title">
                <span class="draw-group-trophy pre">🎲</span>
                <span>GRUP ${g}</span>
              </div>
              <span class="draw-user-group-status-badge pending">Belum Diundi</span>
            </div>
            <div class="draw-user-slots-container">
              ${emptySlotsHtml}
            </div>
          </div>
        `;
      });

      let teamsBadgesHtml = "";
      if (allTeams.length === 0) {
        teamsBadgesHtml = `<div class="draw-empty-pool-text">Daftar tim kategori ${catLabel} sedang disiapkan oleh panitia.</div>`;
      } else {
        teamsBadgesHtml = allTeams.map((t, idx) => {
          const avatarHtml = t.logo
            ? `<img src="${t.logo}" alt="${t.name}" class="draw-pool-logo-img" loading="lazy">`
            : `<span class="draw-pool-logo-abbr">${(t.shortName || t.name).substring(0, 2).toUpperCase()}</span>`;

          return `
            <div class="draw-pool-team-item" onclick="app.navigateTo('/daftar-tim/detail-tim/${t.id}', 'team-detail', { teamId: '${t.id}' })" style="cursor: pointer;" title="${t.name} - ${t.instansi || ''}">
              <div class="draw-pool-team-num">#${idx + 1}</div>
              <div class="draw-pool-team-avatar" style="background: ${t.badgeColor || '#0284c7'};">
                ${avatarHtml}
              </div>
              <div class="draw-pool-team-info">
                <div class="draw-pool-team-name">${t.name}</div>
                <div class="draw-pool-team-instansi">🏫 ${t.instansi || 'Sulawesi Selatan'}</div>
              </div>
            </div>
          `;
        }).join("");
      }

      container.innerHTML = `
        <!-- STATUS ALERT SEBELUM DIUNDI -->
        <div class="draw-status-card pre-draw">
          <div class="draw-status-header">
            <div class="draw-status-pill warning">
              <span class="draw-status-dot yellow"></span>
              <span>BELUM DIMULAI • MENUNGGU PENGUNDIAN RESMI</span>
            </div>
            <span class="draw-status-time">Jadwal Drawing ACC 2026</span>
          </div>
          <h3 class="draw-status-heading">Pengundian Grup Kategori ${catLabel}</h3>
          <p class="draw-status-caption">
            Proses drawing resmi pembagian grup turnamen futsal Al-Fayyadh Champions Cup 2026 belum dilaksanakan oleh Panitia Pelaksana. Pengundian akan dilakukan secara terbuka, transparan, dan disiarkan langsung.
          </p>

          <!-- METADATA GRID INFO PELAKSANAAN -->
          <div class="draw-pre-info-grid">
            <div class="draw-pre-info-item">
              <div class="draw-pre-info-icon">📅</div>
              <div class="draw-pre-info-content">
                <div class="draw-pre-info-label">Jadwal Pengundian</div>
                <div class="draw-pre-info-val">Kamis, 19 November 2026 • 16:00 WITA</div>
              </div>
            </div>
            <div class="draw-pre-info-item">
              <div class="draw-pre-info-icon">📍</div>
              <div class="draw-pre-info-content">
                <div class="draw-pre-info-label">Lokasi Drawing</div>
                <div class="draw-pre-info-val">Ma'had Al-Fayyadh Maros</div>
              </div>
            </div>
            
            <div class="draw-pre-info-item">
              <div class="draw-pre-info-icon">🛡️</div>
              <div class="draw-pre-info-content">
                <div class="draw-pre-info-label">Aturan Fair Play</div>
                <div class="draw-pre-info-val">Sistem Anti Satu Grup (Tim 1 sekolah otomatis dipisah)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- POT TIM MENUNGGU UNDIAN -->
        <div class="draw-pool-showcase-section">
          <div class="draw-pool-section-header">
            <div>
              <h3 class="draw-pool-section-title">
                <span>🗳️</span> Pot Tim Peserta Menunggu Undian (${allTeams.length} Tim Terdaftar)
              </h3>
              <p class="draw-pool-section-subtitle">
                Daftar tim resmi kategori ${catLabel} yang siap diundi ke dalam Grup A, B, C, dan D
              </p>
            </div>
          </div>
          <div class="draw-pool-teams-grid">
            ${teamsBadgesHtml}
          </div>
        </div>

        <!-- PREVIEW STRUKTUR 4 GRUP KOSONG -->
        <div class="draw-pre-groups-section">
          <div class="draw-pre-section-header">
            <h3 class="draw-pre-section-title">
              <span>📋</span> Struktur 4 Grup Turnamen (Menunggu Hasil Undian)
            </h3>
            <p class="draw-pre-section-subtitle">
              Masing-masing grup akan diisi oleh 4 tim hasil undian resmi panitia pelaksana.
            </p>
          </div>
          <div class="draw-user-groups-grid">
            ${emptyGroupsHtml}
          </div>
        </div>

        <!-- NOTICE OTOMATIS UPDATE -->
        <div class="draw-user-notice-strip">
          <span class="draw-notice-icon">💡</span>
          <div class="draw-notice-text">
            <strong>Pembaruan Otomatis:</strong> Begitu panitia pelaksana menyelesaikan pengundian resmi dan menyimpannya, halaman ini akan langsung otomatis menampilkan hasil pembagian grup resmi tanpa perlu refresh manual.
          </div>
        </div>
      `;
    }

    if (typeof this.initScrollReveal === "function") {
      this.initScrollReveal();
    }
  },

  renderDrawSlots() {
    const container = document.getElementById("drawGroupsGrid");
    if (!container) return;
    const cat = this.currentDrawCat || "SMP";
    const state = this.getDrawState()[cat];
    const nextTarget = this.getNextDrawTarget(cat);
    const groups = ["A", "B", "C", "D"];

    let html = "";
    groups.forEach(g => {
      const groupTeams = state.groups[g] || [];
      const count = groupTeams.length;

      let slotsHtml = "";
      for (let slot = 1; slot <= 4; slot++) {
        const teamInSlot = groupTeams.find(t => t.slot === slot) || groupTeams[slot - 1];
        const isTarget = nextTarget && nextTarget.group === g && nextTarget.slotIndex === slot;

        if (teamInSlot) {
          const avatarHtml = teamInSlot.logo
            ? `<img src="${teamInSlot.logo}" alt="${teamInSlot.name}">`
            : (teamInSlot.shortName ? teamInSlot.shortName.substring(0, 2) : "⚽");

          const liveFullTeam = (teamInSlot.teamId && this.store && typeof this.store.getTeam === "function") ? this.store.getTeam(teamInSlot.teamId) : null;
          const slotInstansi = (liveFullTeam && liveFullTeam.instansi) || teamInSlot.instansi || "";
          slotsHtml += `
            <div class="draw-slot-item filled" id="drawSlot_${cat}_${g}_${slot}">
              <div class="draw-slot-num">${slot}</div>
              <div class="draw-slot-avatar" style="background: ${teamInSlot.badgeColor || '#0284c7'};">
                ${avatarHtml}
              </div>
              <div class="draw-slot-info">
                <div class="draw-slot-name" title="${teamInSlot.name}">${teamInSlot.name}</div>
                <div class="draw-slot-city">${slotInstansi ? `🏫 ${slotInstansi}` : (teamInSlot.city || 'Sulawesi Selatan')}</div>
              </div>
            </div>
          `;
        } else if (isTarget) {
          slotsHtml += `
            <div class="draw-slot-item target-active" id="drawSlot_${cat}_${g}_${slot}">
              <div class="draw-slot-num">🎯</div>
              <div class="draw-slot-info">
                <div class="draw-slot-placeholder">Target Undian Berikutnya...</div>
              </div>
            </div>
          `;
        } else {
          slotsHtml += `
            <div class="draw-slot-item empty" id="drawSlot_${cat}_${g}_${slot}">
              <div class="draw-slot-num">${slot}</div>
              <div class="draw-slot-info">
                <div class="draw-slot-placeholder">Slot ${slot} (Menunggu)</div>
              </div>
            </div>
          `;
        }
      }

      html += `
        <div class="draw-group-box">
          <div class="draw-group-box-header">
            <span class="draw-group-tag group-${g}">🏆 GRUP ${g}</span>
            <span class="draw-group-count">${count} / 4 Tim</span>
          </div>
          <div class="draw-slots-list">
            ${slotsHtml}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderDrawPool() {
    const countEl = document.getElementById("drawPoolCount");
    const container = document.getElementById("drawPoolBadges");
    if (!container) return;

    const cat = this.currentDrawCat || "SMP";
    const allTeams = this.getDrawCategoryTeams(cat);
    const state = this.getDrawState()[cat];
    const drawnIds = new Set(state.history.map(h => h.teamId));
    const undrawnCount = allTeams.length - drawnIds.size;

    if (countEl) countEl.textContent = undrawnCount;

    if (undrawnCount === 0) {
      container.innerHTML = `
        <div style="padding: 14px 18px; text-align: center; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); font-weight: 700; font-size: 0.86rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="font-size: 1.2rem;">🎉</span>
          <span>Seluruh ${allTeams.length} tim (${cat}) telah selesai diundi secara sah ke dalam 4 grup (Grup A, B, C, & D) dan tersinkron otomatis ke Klasemen & Jadwal!</span>
        </div>
      `;
      return;
    }

    let html = "";
    allTeams.forEach(t => {
      const isDrawn = drawnIds.has(t.id);
      const pillClass = isDrawn ? "draw-pool-pill is-drawn" : "draw-pool-pill available";
      const icon = isDrawn ? "✓" : "🎲";

      const instBadge = (t.instansi && t.instansi.trim())
        ? `<span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.14); color: #047857; padding: 1px 6px; border-radius: 999px; font-weight: 700;">🏫 ${t.instansi.trim()}</span>`
        : '';

      html += `
        <div class="${pillClass}" title="${t.name}${t.instansi ? ' • Instansi: ' + t.instansi : ''}">
          <span class="draw-pool-avatar" style="background: ${t.badgeColor || '#64748b'};"></span>
          <span>${t.name}</span>
          ${instBadge}
          <span style="font-size: 0.72rem; opacity: 0.75;">${icon}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  // Pemilih Tim Draw Grup yang 100% Patuh Aturan Instansi (Exact Backtracking Anti-Satu-Grup + Anti-Deadlock)
  pickInstansiSafeDrawTeam(cat, targetGroup, undrawn) {
    if (!undrawn || undrawn.length === 0) return null;
    const state = this.getDrawState()[cat];
    const groupKeys = ["A", "B", "C", "D"];
    const totalCatTeams = this.getDrawCategoryTeams(cat).length;
    const maxSlotsPerGroup = Math.max(4, Math.ceil(totalCatTeams / 4));

    const getInst = (item) => {
      if (!item) return "";
      let raw = item.instansi || "";
      const tid = item.teamId || item.id;
      if (tid && this.store && typeof this.store.getTeam === "function") {
        const liveT = this.store.getTeam(tid);
        if (liveT && liveT.instansi) raw = liveT.instansi;
      }
      return String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
    };

    // Instansi yang sudah ada di targetGroup saat ini
    const usedInTarget = new Set(
      (state.groups[targetGroup] || []).map(getInst).filter(Boolean)
    );

    // 1. Saring kandidat yang TIDAK memiliki Instansi yang sama dengan tim yang sudah masuk di targetGroup
    let candidates = undrawn.filter(t => {
      const inst = getInst(t);
      return !inst || !usedInTarget.has(inst);
    });

    if (candidates.length === 0) {
      candidates = undrawn;
    }

    // 2. Exact Feasibility Solver (Anti-Deadlock 100%):
    // Hanya pilih kandidat yang menjamin SELURUH tim tersisa masih bisa dibagi ke 4 grup tanpa 1 pun bentrok Instansi!
    const isFeasibleChoice = (cand) => {
      const remCap = {};
      const groupSets = {};
      groupKeys.forEach(gk => {
        const arr = state.groups[gk] || [];
        remCap[gk] = Math.max(0, maxSlotsPerGroup - arr.length);
        groupSets[gk] = new Set(arr.map(getInst).filter(Boolean));
      });

      const candInst = getInst(cand);
      if (remCap[targetGroup] <= 0) return false;
      remCap[targetGroup] -= 1;
      if (candInst) groupSets[targetGroup].add(candInst);

      // Hitung frekuensi instansi pada sisa tim yang belum diundi
      const counts = {};
      undrawn.forEach(t => {
        if (t.id === cand.id) return;
        const inst = getInst(t);
        if (inst) counts[inst] = (counts[inst] || 0) + 1;
      });

      // Hanya instansi yang muncul >1x di sisa pot ATAU sudah muncul di grup yang masih punya slot kosong yang perlu diselesaikan
      const constrained = [];
      Object.entries(counts).forEach(([inst, count]) => {
        const existsInOpenGroup = groupKeys.some(gk => remCap[gk] > 0 && groupSets[gk].has(inst));
        if (count > 1 || existsInOpenGroup) {
          constrained.push({ inst, count });
        }
      });

      if (constrained.length === 0) return true;

      // Urutkan yang paling ketat lebih dulu agar pencarian selesai dalam mikrodetik
      constrained.sort((a, b) => b.count - a.count);

      let steps = 0;
      const MAX_STEPS = 4000;

      const solve = (idx) => {
        if (idx >= constrained.length) return true;
        if (++steps > MAX_STEPS) return true;
        const { inst, count } = constrained[idx];
        const validGroups = groupKeys.filter(gk => remCap[gk] > 0 && !groupSets[gk].has(inst));
        if (validGroups.length < count) return false;

        // Pilih `count` grup berbeda dari `validGroups` (maksimal C(4,2)=6 kombinasi)
        const pickCombo = (start, chosen) => {
          if (chosen.length === count) {
            chosen.forEach(gk => { remCap[gk] -= 1; groupSets[gk].add(inst); });
            const ok = solve(idx + 1);
            chosen.forEach(gk => { remCap[gk] += 1; groupSets[gk].delete(inst); });
            return ok;
          }
          for (let i = start; i <= validGroups.length - (count - chosen.length); i++) {
            chosen.push(validGroups[i]);
            if (pickCombo(i + 1, chosen)) return true;
            chosen.pop();
          }
          return false;
        };

        return pickCombo(0, []);
      };

      return solve(0);
    };

    const feasibleCandidates = candidates.filter(isFeasibleChoice);
    const finalPool = feasibleCandidates.length > 0 ? feasibleCandidates : candidates;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  },

  spinSingleDraw(onFinished = null) {
    if (!this.isAdmin()) {
      this.showToast("🔒 Fitur pengundian hanya dapat dijalankan oleh Panitia Pelaksana (Panpel).");
      return;
    }

    if (this.isDrawingSpinning) return;

    const cat = this.currentDrawCat || "SMP";
    const nextTarget = this.getNextDrawTarget(cat);
    if (!nextTarget) {
      this.showToast("🎉 Semua 16 tim sudah lengkap diundi ke dalam grup!");
      if (this.isAutoDrawing) this.toggleAutoDraw(true);
      return;
    }

    const undrawn = this.getUndrawnTeams(cat);
    if (undrawn.length === 0) {
      this.showToast("Tidak ada lagi tim di pot undian!");
      if (this.isAutoDrawing) this.toggleAutoDraw(true);
      return;
    }

    // Pemenang dipilih secara acak dengan aturan wajib: 2 tim ber-Instansi sama TIDAK BOLEH 1 grup!
    const winnerTeam = this.pickInstansiSafeDrawTeam(cat, nextTarget.group, undrawn);
    this.isDrawingSpinning = true;

    // Audio & UI setup
    this.getAudioContext();
    const btnSpin = document.getElementById("btnDrawSingle");
    if (btnSpin) btnSpin.disabled = true;

    const announce = document.getElementById("drawAnnouncement");
    if (announce) {
      announce.textContent = `🎰 Sedang mengocok nama tim untuk GRUP ${nextTarget.group} — SLOT ${nextTarget.slotIndex}...`;
    }

    const reelItem = document.getElementById("drawReelItem");
    const reelName = document.getElementById("drawReelName");
    const reelSub = document.getElementById("drawReelSub");
    const reelBadge = document.getElementById("drawReelBadge");

    if (reelItem) {
      reelItem.classList.remove("winner-celebrate");
      reelItem.classList.add("spinning");
    }

    // Animasi putaran dengan deselerasi bertahap
    const allPoolTeams = this.getDrawCategoryTeams(cat);
    const totalTicks = 26;
    let tickCount = 0;

    const runTick = () => {
      tickCount++;
      const randomDisplayTeam = allPoolTeams[Math.floor(Math.random() * allPoolTeams.length)];

      if (reelName) reelName.textContent = randomDisplayTeam.name;
      if (reelSub) reelSub.textContent = `Mengacak untuk Grup ${nextTarget.group}...`;
      if (reelBadge) {
        reelBadge.style.background = randomDisplayTeam.badgeColor || "#f59e0b";
        reelBadge.innerHTML = randomDisplayTeam.logo ? `<img src="${randomDisplayTeam.logo}">` : (randomDisplayTeam.shortName ? randomDisplayTeam.shortName.substring(0, 2) : "🎲");
      }

      this.playDrawTickSound();

      if (tickCount < totalTicks) {
        const progress = tickCount / totalTicks;
        const delay = 45 + Math.pow(progress, 2.6) * 320;
        setTimeout(runTick, delay);
      } else {
        // PENGUMUMAN RESMI TIM PEMENANG!
        if (reelItem) {
          reelItem.classList.remove("spinning");
          reelItem.classList.add("winner-celebrate");
        }

        if (reelName) reelName.textContent = winnerTeam.name;
        if (reelSub) reelSub.textContent = `RESMI: Masuk ke GRUP ${nextTarget.group} (Slot ${nextTarget.slotIndex})`;
        if (reelBadge) {
          reelBadge.style.background = winnerTeam.badgeColor || "#10b981";
          reelBadge.innerHTML = winnerTeam.logo ? `<img src="${winnerTeam.logo}">` : (winnerTeam.shortName ? winnerTeam.shortName.substring(0, 2) : "🏆");
        }

        this.playDrawWinSound();
        this.fireDrawConfetti();

        // Update state
        const state = this.getDrawState()[cat];
        state.isReset = false;
        state.groups[nextTarget.group].push({
          teamId: winnerTeam.id,
          name: winnerTeam.name,
          shortName: winnerTeam.shortName || winnerTeam.name,
          badgeColor: winnerTeam.badgeColor || "#0284c7",
          city: winnerTeam.city || "",
          instansi: winnerTeam.instansi || "",
          logo: winnerTeam.logo || "",
          slot: nextTarget.slotIndex
        });

        state.history.push({
          step: nextTarget.stepIndex,
          group: nextTarget.group,
          slot: nextTarget.slotIndex,
          teamId: winnerTeam.id,
          teamName: winnerTeam.name
        });

        this.saveDrawState();
        this.isDrawingSpinning = false;

        const updatedNext = this.getNextDrawTarget(cat);

        // LANGSUNG SAMBUNGKAN KE TOURNAMENT (KLASEMEN, JADWAL, TIM, BRACKET)
        // Jika sudah selesai 16 tim, otomatis sinkronkan juga ke Cloud Supabase!
        this.connectDrawToTournament(cat, !updatedNext);

        // Re-render UI components
        this.renderDrawSlots();
        this.renderDrawPool();

        // Animate the stamped slot
        setTimeout(() => {
          const stampedEl = document.getElementById(`drawSlot_${cat}_${nextTarget.group}_${nextTarget.slotIndex}`);
          if (stampedEl) stampedEl.classList.add("just-stamped");
        }, 50);

        // Update Announcement & Target Header
        const targetSlotText = document.getElementById("drawTargetSlotText");
        if (targetSlotText) {
          const pillEl = targetSlotText.parentElement;
          if (!updatedNext) {
            targetSlotText.textContent = "SELESAI — SEMUA GRUP TELAH LENGKAP";
            targetSlotText.style.color = "#065f46";
            if (pillEl) {
              pillEl.style.background = "#ecfdf5";
              pillEl.style.borderColor = "#a7f3d0";
              pillEl.style.color = "#047857";
            }
          } else {
            targetSlotText.textContent = `GRUP ${updatedNext.group} — SLOT ${updatedNext.slotIndex} (Urutan ke-${updatedNext.stepIndex})`;
            targetSlotText.style.color = "#b45309";
            if (pillEl) {
              pillEl.style.background = "#fef3c7";
              pillEl.style.borderColor = "#fde68a";
              pillEl.style.color = "#92400e";
            }
          }
        }

        const countText = document.getElementById("drawCountText");
        if (countText) countText.textContent = `${state.history.length} / 16`;

        if (announce) {
          announce.textContent = `🎉 RESMI: ${winnerTeam.name} sah menempati Grup ${nextTarget.group} (Slot ${nextTarget.slotIndex})! Otomatis terhubung ke Klasemen & Jadwal.`;
        }

        if (btnSpin) {
          btnSpin.disabled = !updatedNext;
        }

        if (typeof onFinished === "function") {
          onFinished();
        }
      }
    };

    runTick();
  },

  toggleAutoDraw(forceStop = false) {
    if (!this.isAdmin()) {
      this.showToast("🔒 Fitur pengundian otomatis hanya dapat dijalankan oleh Panitia Pelaksana (Panpel).");
      return;
    }

    if (this.isAutoDrawing || forceStop) {
      this.isAutoDrawing = false;
      if (this._autoDrawTimer) {
        clearTimeout(this._autoDrawTimer);
        this._autoDrawTimer = null;
      }
      const btn = document.getElementById("btnDrawAuto");
      if (btn) {
        btn.classList.remove("is-running");
        btn.innerHTML = `<span class="btn-auto-icon">⚡</span> <span class="btn-auto-text">Undi Otomatis 1 per 1</span>`;
      }
      return;
    }

    const cat = this.currentDrawCat || "SMP";
    const nextTarget = this.getNextDrawTarget(cat);
    if (!nextTarget) {
      this.showToast("Semua 16 tim sudah selesai diundi!");
      return;
    }

    this.isAutoDrawing = true;
    const btn = document.getElementById("btnDrawAuto");
    if (btn) {
      btn.classList.add("is-running");
      btn.innerHTML = `<span class="btn-auto-icon">🛑</span> <span class="btn-auto-text">Hentikan Auto-Draw</span>`;
    }

    const runNextStep = () => {
      if (!this.isAutoDrawing) return;
      const target = this.getNextDrawTarget(cat);
      if (!target) {
        this.toggleAutoDraw(true);
        this.showToast("🎉 Seluruh grup telah lengkap diundi & otomatis tersambung ke Klasemen dan Jadwal!");
        return;
      }

      this.spinSingleDraw(() => {
        if (!this.isAutoDrawing) return;
        this._autoDrawTimer = setTimeout(() => {
          runNextStep();
        }, 1300);
      });
    };

    runNextStep();
  },

  resetDraw() {
    if (!this.isAdmin()) {
      this.showToast("🔒 Reset undian hanya dapat dilakukan oleh Panitia Pelaksana (Panpel).");
      return;
    }

    if (this.isDrawingSpinning) return;
    const cat = this.currentDrawCat || "SMP";
    const catLabel = cat === "SMP" ? "SMP" : "SD";

    if (!confirm(`Apakah Anda yakin ingin me-reset hasil undian grup ${catLabel}? Seluruh tim akan dikembalikan ke pot undian dan dikosongkan dari klasemen & jadwal.`)) {
      return;
    }

    if (this.isAutoDrawing) this.toggleAutoDraw(true);

    const state = this.getDrawState()[cat];
    state.groups = { A: [], B: [], C: [], D: [] };
    state.history = [];
    state.isReset = true;
    this.saveDrawState();

    // Kosongkan grup tim di turnamen agar klasemen bersih & tidak otomatis terisi ulang sebelum diundi ulang
    (this.store.data.teams || []).forEach(teamObj => {
      if ((teamObj.category || "SMP") === cat) {
        teamObj.group = "-";
      }
    });

    // Kosongkan pasangan tim pada jadwal babak grup kategori ini menjadi TBD hingga diundi ulang
    (this.store.data.matches || []).forEach(mObj => {
      if ((mObj.category || "SMP") === cat && mObj.stage === "group") {
        mObj.homeId = "";
        mObj.awayId = "";
      }
    });

    this.store.saveData();
    if (typeof this.store.syncKnockoutFromStandings === "function") {
      this.store.syncKnockoutFromStandings();
    }

    try {
      this.renderStandings();
      this.renderMatches();
      this.renderTeams();
      this.renderBracket();
      if (this.currentTab === "home") {
        this.renderHome();
        this.renderLiveStreamHero();
      }
    } catch (e) { }

    // Update group_letter in Supabase Cloud without touching team rosters or photos
    if (window.SupabaseService && window.SupabaseService.client) {
      try {
        const catTeams = (this.store.data.teams || []).filter(t => (t.category || "SMP") === cat);
        for (const t of catTeams) {
          window.SupabaseService.client.from('teams').update({ group_letter: '-' }).eq('id', t.id).then(() => { }).catch(() => { });
        }
        const catMatches = (this.store.data.matches || []).filter(m => {
          const hTeam = this.store.getTeam(m.homeId);
          return hTeam && (hTeam.category || "SMP") === cat;
        });
        for (const m of catMatches) {
          window.SupabaseService.syncMatch(m).catch(() => { });
        }
      } catch (drawSyncErr) {
        console.warn("Draw reset sync notice:", drawSyncErr);
      }
    }

    this.renderDrawView();
    this.showToast(`🔄 Hasil drawing ${catLabel} berhasil di-reset! Semua grup kembali kosong (0/16).`);
  },

  copyDrawResults() {
    const cat = this.currentDrawCat || "SMP";
    const catLabel = cat === "SMP" ? "SMP" : "SD";
    const state = this.getDrawState()[cat];
    const groups = ["A", "B", "C", "D"];

    let text = `🏆 HASIL RESMI DRAWING GRUP ACC 2026 🏆\n`;
    text += `Kategori: ${catLabel}\n`;
    text += `Lokasi: GOR Futsal Ma'had Al-Fayyadh\n`;
    text += `Status: ${state.history.length}/16 Tim Terundi\n`;
    text += `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n\n`;

    groups.forEach(g => {
      text += `📌 GRUP ${g}:\n`;
      const list = state.groups[g] || [];
      if (list.length === 0) {
        text += `  (Belum diundi)\n`;
      } else {
        list.forEach((item, idx) => {
          text += `  ${idx + 1}. ${item.name} ${item.city ? `(${item.city})` : ''}\n`;
        });
      }
      text += `\n`;
    });

    text += `Turnamen Futsal Antar-Sekolah & Pesantren se-Sulsel\n`;
    text += `Official Portal: ${window.location.origin}${window.location.pathname}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("📋 Hasil drawing grup berhasil disalin! Siap dibagikan ke WhatsApp.");
      }).catch(() => {
        this.legacyCopyText(text);
      });
    } else {
      this.legacyCopyText(text);
    }
  },

  // =========================================================
  // INTEGRASI DRAW GRUP KE TURNAMEN (KLASEMEN, JADWAL, BRACKET)
  // =========================================================
  connectDrawToTournament(cat = this.currentDrawCat, syncCloud = false) {
    if (!cat) cat = "SMP";
    const state = this.getDrawState()[cat];
    if (!state || !state.groups) return;

    let updatedTeamCount = 0;
    const groups = ["A", "B", "C", "D"];

    // 1. Update grup tim di this.store.data.teams
    groups.forEach(g => {
      const list = state.groups[g] || [];
      list.forEach(item => {
        const teamObj = (this.store.data.teams || []).find(t => t.id === item.teamId);
        if (teamObj) {
          teamObj.group = g;
          updatedTeamCount++;
        }
      });
    });

    // 2. Update jadwal pertandingan babak grup (Matchday 1, 2, 3) sesuai penempatan slot
    groups.forEach(g => {
      const slotList = state.groups[g] || [];
      const slotMap = {};
      slotList.forEach(item => {
        if (item.slot) slotMap[item.slot] = item.teamId;
      });

      const gMatches = (this.store.data.matches || []).filter(m =>
        (m.category || "SMP") === cat &&
        m.stage === "group" &&
        m.group === g
      );

      // Matchday 1: Slot 1 vs Slot 2, Slot 3 vs Slot 4
      const md1 = gMatches.filter(m => Number(m.matchday) === 1).sort((a, b) => a.id.localeCompare(b.id));
      if (md1[0] && !md1[0].isManualTeam) {
        if (slotMap[1]) md1[0].homeId = slotMap[1];
        if (slotMap[2]) md1[0].awayId = slotMap[2];
      }
      if (md1[1] && !md1[1].isManualTeam) {
        if (slotMap[3]) md1[1].homeId = slotMap[3];
        if (slotMap[4]) md1[1].awayId = slotMap[4];
      }

      // Matchday 2: Slot 1 vs Slot 3, Slot 2 vs Slot 4
      const md2 = gMatches.filter(m => Number(m.matchday) === 2).sort((a, b) => a.id.localeCompare(b.id));
      if (md2[0] && !md2[0].isManualTeam) {
        if (slotMap[1]) md2[0].homeId = slotMap[1];
        if (slotMap[3]) md2[0].awayId = slotMap[3];
      }
      if (md2[1] && !md2[1].isManualTeam) {
        if (slotMap[2]) md2[1].homeId = slotMap[2];
        if (slotMap[4]) md2[1].awayId = slotMap[4];
      }

      // Matchday 3: Slot 1 vs Slot 4, Slot 2 vs Slot 3
      const md3 = gMatches.filter(m => Number(m.matchday) === 3).sort((a, b) => a.id.localeCompare(b.id));
      if (md3[0] && !md3[0].isManualTeam) {
        if (slotMap[1]) md3[0].homeId = slotMap[1];
        if (slotMap[4]) md3[0].awayId = slotMap[4];
      }
      if (md3[1] && !md3[1].isManualTeam) {
        if (slotMap[2]) md3[1].homeId = slotMap[2];
        if (slotMap[3]) md3[1].awayId = slotMap[3];
      }
    });

    // 3. Simpan perubahan secara persisten di localStorage
    this.store.saveData();

    // 4. Update pemetaan babak gugur jika ada
    if (typeof this.store.syncKnockoutFromStandings === "function") {
      this.store.syncKnockoutFromStandings();
    }

    // 5. Render ulang tampilan Klasemen, Jadwal, Tim, & Bagan
    try {
      this.renderStandings();
      this.renderMatches();
      this.renderTeams();
      this.renderBracket();
      if (this.currentTab === "home") {
        this.renderHome();
        this.renderLiveStreamHero();
      }
    } catch (e) { }

    // 6. Sinkronisasi grup drawing ke Cloud Supabase tanpa menimpa data pemain atau foto tim
    if (syncCloud && window.SupabaseService && window.SupabaseService.client) {
      try {
        const catTeams = (this.store.data.teams || []).filter(t => (t.category || "SMP") === cat);
        for (const t of catTeams) {
          window.SupabaseService.client.from('teams').update({ group_letter: t.group }).eq('id', t.id).then(() => { }).catch(() => { });
        }
        const catMatches = (this.store.data.matches || []).filter(m => {
          const hTeam = this.store.getTeam(m.homeId);
          return hTeam && (hTeam.category || "SMP") === cat;
        });
        for (const m of catMatches) {
          window.SupabaseService.syncMatch(m).catch(() => { });
        }
      } catch (drawSyncErr) {
        console.warn("Draw apply sync notice:", drawSyncErr);
      }
    }
  },

  // Rekonstruksi drawState dari data tim turnamen jika di perangkat peserta belum ada history lokal
  syncDrawStateFromTournament(cat = this.currentDrawCat, fromRemote = false) {
    if (!cat) cat = "SMP";
    const state = this.getDrawState()[cat];
    const allTeams = (this.store && this.store.data && this.store.data.teams) || [];
    const catAllTeams = allTeams.filter(t => (t.category || "SMP") === cat);

    // Lindungi sesi drawing/reset yang sedang berlangsung pada perangkat Panpel dari timpaan remote lama
    if (fromRemote && this.isAdmin() && (state.isReset || (state.history && state.history.length > 0 && state.history.length < 16))) {
      return;
    }

    // Jika semua tim di kategori ini bertanda "-" (baru saja di-reset oleh Panpel)
    if (catAllTeams.length > 0 && catAllTeams.every(t => t.group === "-")) {
      if (state.history.length > 0 || !state.isReset) {
        state.groups = { A: [], B: [], C: [], D: [] };
        state.history = [];
        state.isReset = true;
        this.saveDrawState();
      }
      return;
    }

    // Jangan timpa jika sesi drawing sedang berlangsung aktif (misal baru terundi 5 dari 16 tim)
    if (!fromRemote && state && state.history && state.history.length > 0 && state.history.length < 16) return;
    if (fromRemote && state && state.isReset && catAllTeams.some(t => !t.group || t.group === "-")) return;

    const catTeams = catAllTeams.filter(t => t.group && ["A", "B", "C", "D"].includes(t.group));
    if (catTeams.length >= 16) {
      const groups = ["A", "B", "C", "D"];
      let hasValidGroups = true;
      groups.forEach(g => {
        const teamsInG = catTeams.filter(t => t.group === g);
        if (teamsInG.length !== 4) hasValidGroups = false;
      });

      if (hasValidGroups) {
        if (state.history && state.history.length === 16) {
          const isSameSet = groups.every(g => {
            const localIds = (state.groups[g] || []).map(x => x.teamId).sort().join(",");
            const remoteIds = catTeams.filter(t => t.group === g).map(t => t.id).sort().join(",");
            return localIds === remoteIds;
          });
          if (isSameSet) return;
        }

        state.isReset = false;
        groups.forEach(g => {
          const teamsInG = catTeams.filter(t => t.group === g);
          state.groups[g] = teamsInG.map((t, idx) => ({
            teamId: t.id,
            name: t.name,
            shortName: t.shortName || t.name,
            badgeColor: t.badgeColor || "#0284c7",
            city: t.city || "",
            logo: t.logo || "",
            slot: idx + 1
          }));
        });
        state.history = [];
        for (let s = 1; s <= 4; s++) {
          for (const g of groups) {
            const item = (state.groups[g] || []).find(x => x.slot === s);
            if (item) {
              state.history.push({
                step: state.history.length + 1,
                group: g,
                slot: s,
                teamId: item.teamId,
                teamName: item.name
              });
            }
          }
        }
        this.saveDrawState();
      }
    }
  },

  applyDrawToTournament() {
    if (!this.isAdmin()) {
      this.showToast("⚠️ Fitur ini hanya untuk Panitia Pelaksana (Panpel).");
      return;
    }

    const cat = this.currentDrawCat || "SMP";
    const state = this.getDrawState()[cat];
    if (state.history.length < 16) {
      if (!confirm(`Baru ${state.history.length} dari 16 tim yang terundi. Tetap terapkan hasil parsial ke turnamen (Klasemen & Jadwal)?`)) {
        return;
      }
    } else {
      if (!confirm(`Terapkan hasil drawing ${cat} ke data resmi turnamen? Seluruh grup di Klasemen & Jadwal Pertandingan akan diperbarui dan disinkronkan ke Supabase Cloud.`)) {
        return;
      }
    }

    this.connectDrawToTournament(cat, true);
    this.showToast(`💾 Hasil drawing ${cat} berhasil disimpan & disinkronkan ke Klasemen, Jadwal, dan Cloud Supabase!`);
  },

  closeAllModals() {
    this.activeTeamModalId = null;
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  },

  openTeamEditorModal(teamId) {
    if (window.admin && typeof window.admin.openTeamEditorModal === 'function') {
      window.admin.openTeamEditorModal(teamId);
    }
  },

  // MODAL: Show Team Details & Full Roster
  openTeamModal(teamId) {
    this.activeTeamModalId = teamId;
    if (this.store && typeof this.store.syncPlayerStatsFromMatches === 'function') {
      this.store.syncPlayerStatsFromMatches();
    }
    const team = this.store.getTeam(teamId);
    if (!team) return;

    if ((!team.players || team.players.length === 0) && window.SupabaseService && typeof window.SupabaseService.fetchTeamFull === 'function') {
      window.SupabaseService.fetchTeamFull(team.id).then(full => {
        if (full && Array.isArray(full.players) && full.players.length > 0) {
          team.players = full.players;
          if (full.coach_photo && (!team.official || !team.official.coachPhoto)) {
            if (!team.official) team.official = {};
            team.official.coachPhoto = full.coach_photo;
          }
          if (full.manager_photo && (!team.official || !team.official.managerPhoto)) {
            if (!team.official) team.official = {};
            team.official.managerPhoto = full.manager_photo;
          }
          this.store.saveData();
          if (this.activeTeamModalId === team.id) {
            this.openTeamModal(team.id);
          }
        }
      }).catch(() => { });
    }

    const isPanitia = this.isAdmin();

    const modal = document.getElementById("teamModal");
    const title = document.getElementById("teamModalTitle");
    const body = document.getElementById("teamModalBody");

    title.innerHTML = `
      <span class="mini-badge" style="background: ${team.badgeColor || '#0284c7'}; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; padding: 0;">
        ${team.logo ? `<img src="${team.logo}" alt="${team.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : team.shortName.substring(0, 2)}
      </span>
      <span>${team.name} (${team.group && team.group !== '-' ? 'Grup ' + team.group : 'Belum Diundi'})</span>
    `;

    const waLink = this.getWhatsAppUrl(team.official.phone, `Halo Official ${team.name}, informasi ACC 2026`);

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
        
        <!-- Combined PELATIH / ASISTEN PELATIH Card (Mobile Friendly & Ringkas) -->
        <div class="team-official-card unified-coach-manager">
          <img src="${team.official.coachPhoto || team.official.managerPhoto || 'assets/coach_bayu.jpg'}" alt="Foto Pelatih / Asisten Pelatih" class="team-official-avatar" onerror="this.onerror=null; this.src='assets/coach_bayu.jpg'">
          <div style="flex: 1; min-width: 0;">
            <span class="team-official-role">👔 PELATIH / ASISTEN PELATIH</span>
            <div class="team-official-name">
              ${team.official.coach && team.official.manager && team.official.coach !== team.official.manager ? `${team.official.coach} / ${team.official.manager}` : (team.official.coach || team.official.manager || 'Official Tim')}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              Pelatih: <strong>${team.official.coach || '-'}</strong> • Asisten Pelatih: <strong>${team.official.manager || '-'}</strong>
            </div>
          </div>
        </div>

        <div class="team-meta-info-grid">
          <div><span class="team-meta-lbl">Medis:</span><strong class="team-meta-val">${team.official.medic || '-'}</strong></div>
          <div><span class="team-meta-lbl">Jersey Utama:</span><span class="team-meta-val">${team.official.jerseyHome || '-'}</span></div>
          <div><span class="team-meta-lbl">Jersey Cadangan:</span><span class="team-meta-val">${team.official.jerseyAway || '-'}</span></div>
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
      // Sinkronkan akumulasi kartu & gol aktual dari rekaman pertandingan
      let matchYc = 0;
      let matchRc = 0;
      let matchGoals = 0;
      const cleanPName = (p.name || '').toLowerCase().trim();

      (this.store.data.matches || []).forEach(m => {
        if (m.cards && Array.isArray(m.cards)) {
          m.cards.forEach(c => {
            const isTeam = !c.team || c.team === team.id || c.team === team.name || c.team === team.shortName;
            const cardPName = (c.player || '').toLowerCase().trim();
            const isPlayer = cardPName === cleanPName ||
              cardPName === `${cleanPName} (#${p.no})` ||
              (p.no && cardPName.includes(`#${p.no}`)) ||
              cardPName.includes(cleanPName) ||
              cleanPName.includes(cardPName);
            if (isTeam && isPlayer) {
              if (c.type === 'yellow') matchYc += 1;
              if (c.type === 'red') matchRc += 1;
            }
          });
        }
        if (m.scorers && Array.isArray(m.scorers)) {
          m.scorers.forEach(s => {
            const isTeam = !s.team || s.team === team.id || s.team === team.name || s.team === team.shortName;
            const scorerPName = (s.player || '').toLowerCase().trim();
            const isPlayer = scorerPName === cleanPName ||
              scorerPName === `${cleanPName} (#${p.no})` ||
              (p.no && scorerPName.includes(`#${p.no}`)) ||
              scorerPName.includes(cleanPName) ||
              cleanPName.includes(scorerPName);
            if (isTeam && isPlayer) {
              matchGoals += 1;
            }
          });
        }
      });

      const totalYc = matchYc;
      const totalRc = matchRc;
      const totalGoals = Math.max(parseInt(p.goals, 10) || 0, matchGoals);

      p.yc = totalYc;
      p.rc = totalRc;
      p.goals = totalGoals;

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
                  <td style="font-weight: 700; color: var(--primary); text-align: center;">${totalGoals}</td>
                  <td style="text-align: center;">
                    ${totalYc > 0 ? `<span class="card-icon-y" title="${totalYc} Kartu Kuning"></span> ${totalYc}` : ''}
                    ${totalRc > 0 ? `<span class="card-icon-r" title="${totalRc} Kartu Merah"></span> ${totalRc}` : ''}
                    ${totalYc === 0 && totalRc === 0 ? '<span style="color:var(--text-subtle);">-</span>' : ''}
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

  backFromMatchDetail() {
    this.switchTab("matches");
  },

  refreshActiveMatchDetail() {
    if (this.currentTab === "match-detail" && this.activeDetailMatchId) {
      this.renderMatchDetailPage(this.activeDetailMatchId);
    }
    const modal = document.getElementById("matchDetailModal");
    if (modal && modal.classList.contains("active") && this.activeDetailMatchId) {
      this.renderMatchDetailPage(this.activeDetailMatchId);
    }
  },

  // DEDICATED FULL-PAGE MATCH DETAIL CENTER
  showMatchDetail(matchId) {
    try {
      const early = document.getElementById("earlyRouteStyle");
      if (early) early.remove();
      const earlyFloat = document.getElementById("earlyFloatStyle");
      if (earlyFloat) earlyFloat.remove();
    } catch (_) { }

    this.activeDetailMatchId = matchId;
    this.currentTab = "match-detail";

    document.documentElement.classList.remove("snap-scroll-active");
    document.body.classList.remove("snap-scroll-active");

    // Switch tab DOM with display guarantee
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.remove("active");
      pane.style.display = "none";
    });
    const pane = document.getElementById("pane-match-detail");
    if (pane) {
      pane.classList.add("active");
      pane.style.display = "block";
    }

    try {
      history.pushState({ tab: "match-detail", matchId: matchId }, "", `/jadwal-skor/detail-laga/${encodeURIComponent(matchId)}`);
    } catch (_) { }

    this.renderMatchDetailPage(matchId);
    this.updateFloatingCategoryVisibility();

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  renderMatchDetailPage(matchId) {
    const container = document.getElementById("matchDetailPageContainer");
    if (!container) return;

    const match = this.store.data.matches.find(m => m.id === matchId);
    if (!match) {
      container.innerHTML = `
        <div class="md-nav-header">
          <button type="button" class="md-back-btn" onclick="app.backFromMatchDetail()">← Kembali ke Jadwal &amp; Skor</button>
        </div>
        <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
          Pertandingan dengan ID "${matchId}" tidak ditemukan.
        </div>
      `;
      return;
    }

    // Ensure metadata & lineup exist
    if (window.admin && typeof window.admin.ensureMatchLineup === 'function') {
      window.admin.ensureMatchLineup(match);
    }

    const home = this.store.getTeam(match.homeId) || { name: match.homePlaceholder || "TBD", shortName: "TBD", city: "-", badgeColor: "#10b981", players: [] };
    const away = this.store.getTeam(match.awayId) || { name: match.awayPlaceholder || "TBD", shortName: "TBD", city: "-", badgeColor: "#3b82f6", players: [] };

    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    let hScore = "-";
    let aScore = "-";
    if (isLive || isFinished) {
      hScore = match.homeScore ?? match.homeScoreLive ?? 0;
      aScore = match.awayScore ?? match.awayScoreLive ?? 0;
    }

    const homeScorers = (match.scorers || []).filter(s => s.team === match.homeId);
    const awayScorers = (match.scorers || []).filter(s => s.team === match.awayId);
    if (isLive || isFinished) {
      if (homeScorers.length > 0) hScore = Math.max(Number(hScore) || 0, homeScorers.length);
      if (awayScorers.length > 0) aScore = Math.max(Number(aScore) || 0, awayScorers.length);
    }

    const hasPenalties = isFinished && (match.penaltyHomeScore !== null && match.penaltyAwayScore !== null && match.penaltyHomeScore !== undefined && match.penaltyAwayScore !== undefined);

    let statusText = "Akan Datang";
    let statusClass = "upcoming";
    if (isLive) {
      if (match.isTimerPaused) {
        statusText = `⏸️ JEDA ${match.liveMinute || ''}`.trim();
        statusClass = "live is-paused";
      } else {
        statusText = `🔴 LIVE ${match.liveMinute || ''}`.trim();
        statusClass = "live";
      }
    } else if (isFinished) {
      statusText = "🏁 Selesai (FT)";
      statusClass = "finished";
    }

    const cleanMin = (m) => {
      if (!m) return "";
      const d = m.toString().replace(/[^0-9]/g, "");
      return d ? `${d}'` : `${m}'`;
    };

    // Gabungkan & urutkan kronologi gol, kartu, dan pergantian pemain
    const eventsList = [];
    (match.scorers || []).forEach(s => {
      if (!s || !s.player || s.player === 'undefined') return;
      const isOg = Boolean(s.isOwnGoal || s.ownGoal || String(s.player || '').toLowerCase().includes('bunuh diri') || String(s.player || '').toLowerCase().includes('(gbd)'));
      eventsList.push({
        type: isOg ? 'own_goal' : 'goal',
        isOwnGoal: isOg,
        team: s.team,
        player: s.player,
        assist: isOg ? '' : (s.assist || ''),
        minStr: cleanMin(s.minute),
        minNum: parseInt((s.minute || '0').replace(/\D/g, ''), 10) || 0
      });
    });

    (match.cards || []).forEach(c => {
      // Saring ketat agar metadata atau objek rusak tidak pernah dianggap kartu
      if (!c || c._meta || !c.player || c.player === 'undefined' || c.player === 'null') return;
      if (c.type !== 'yellow' && c.type !== 'red') return;
      eventsList.push({
        type: c.type === 'yellow' ? 'yellow_card' : 'red_card',
        team: c.team,
        player: c.player,
        role: c.role || 'Pemain',
        minStr: cleanMin(c.minute),
        minNum: parseInt((c.minute || '0').replace(/\D/g, ''), 10) || 0
      });
    });

    eventsList.sort((a, b) => a.minNum - b.minNum);

    const hFouls = parseInt(match.homeFouls, 10) || 0;
    const aFouls = parseInt(match.awayFouls, 10) || 0;

    const hLineup = match.lineup?.home || { onCourt: [], bench: [] };
    const aLineup = match.lineup?.away || { onCourt: [], bench: [] };

    const getPlayerExtraInfo = (teamId, pName) => {
      const gCount = (match.scorers || []).filter(s => s && s.player && s.team === teamId && s.player === pName).length;
      const cards = (match.cards || []).filter(c => c && !c._meta && c.player && c.player !== 'undefined' && c.team === teamId && c.player === pName);
      const yc = cards.filter(c => c.type === 'yellow').length;
      const rc = cards.filter(c => c.type === 'red').length;
      let extra = '';
      if (gCount > 0) extra += ` <span style="color:#fbbf24; font-weight:800;">⚽${gCount > 1 ? gCount : ''}</span>`;
      if (yc > 0) extra += ` <span class="card-icon-y" title="${yc} Kartu Kuning"></span>${yc > 1 ? yc : ''}`;
      if (rc > 0) extra += ` <span class="card-icon-r" title="Kartu Merah"></span>`;
      return extra;
    };

    const renderLineupCol = (team, side, lineupObj) => {
      const players = (team.players || []).slice().sort((a, b) => (Number(a.no) || 99) - (Number(b.no) || 99));

      // Ofisial tim
      const officials = [];
      if (team.coach) officials.push({ name: team.coach, role: "Pelatih", photo: team.coachPhoto });
      if (team.manager) officials.push({ name: team.manager, role: "Asisten Pelatih / Manajer", photo: team.managerPhoto });
      if (team.official?.manager && team.official.manager !== team.manager) officials.push({ name: team.official.manager, role: "Manajer", photo: team.official.managerPhoto });
      if (team.official?.asstCoach && team.official.asstCoach !== team.manager) officials.push({ name: team.official.asstCoach, role: "Asisten Pelatih", photo: team.official.asstCoachPhoto });
      if (team.medic) officials.push({ name: team.medic, role: "Tim Medis", photo: team.medicPhoto });

      return `
        <div class="md-lineup-col-card">
          <div class="md-lineup-team-header">
            <div style="width:36px; height:36px; border-radius:50%; background:${team.badgeColor || '#0284c7'}; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid rgba(255,255,255,0.2);">
              ${team.logo ? `<img src="${team.logo}" alt="${team.name}" style="width:100%;height:100%;object-fit:contain;">` : `<span style="font-weight:800;font-size:0.75rem;color:#fff;">${(team.shortName || 'TBD').substring(0, 3)}</span>`}
            </div>
            <div>
              <strong style="font-size:0.92rem; color:#fff; display:block;">${team.name}</strong>
              <span style="font-size:0.72rem; color:var(--text-muted);">${team.instansi || team.city || '-'}</span>
            </div>
          </div>

          <!-- SEMUA PEMAIN TERDAFTAR -->
          <div style="margin-bottom: 14px;">
            <div style="font-size: 0.76rem; font-weight: 800; color: #10b981; margin-bottom: 8px; display:flex; align-items:center; justify-content:space-between;">
              <span>🏃 SKUAD PEMAIN TERDAFTAR</span>
              <span style="font-size: 0.68rem; opacity: 0.85;">${players.length} Pemain</span>
            </div>
            ${players.length === 0 ? `
              <div style="font-size:0.75rem; color:var(--text-muted); padding:6px;">Belum ada pemain terdaftar.</div>
            ` : players.map(p => `
              <div class="md-player-row on-court" style="margin-bottom: 4px;">
                <span class="md-player-num">#${p.no || '-'}</span>
                <span class="md-player-name">${p.name} ${getPlayerExtraInfo(team.id, p.name)}</span>
                <span class="md-player-pos">${p.pos || 'Pemain'}</span>
              </div>
            `).join("")}
          </div>

          <!-- STAF & OFISIAL TIM -->
          <div>
            <div style="font-size: 0.76rem; font-weight: 800; color: #fbbf24; margin-bottom: 6px;">
              👔 STAF &amp; OFISIAL RESMI TIM
            </div>
            ${officials.length === 0 ? `
              <div style="font-size:0.75rem; color:var(--text-muted); padding:6px;">Belum ada data ofisial terdaftar.</div>
            ` : `
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${officials.map(o => {
        const oCards = (match.cards || []).filter(c => c && !c._meta && c.player && c.player !== 'undefined' && c.team === team.id && c.player === o.name);
        let cBadge = '';
        if (oCards.some(c => c.type === 'yellow')) cBadge += ' <span class="card-icon-y" title="Kartu Kuning Ofisial"></span>';
        if (oCards.some(c => c.type === 'red')) cBadge += ' <span class="card-icon-r" title="Kartu Merah Ofisial"></span>';
        return `
                    <div class="md-official-chip">
                      ${o.photo ? `<img src="${o.photo}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">` : `<span>👤</span>`}
                      <strong>${o.name}</strong>
                      <span style="color:var(--text-muted); font-size:0.68rem;">(${o.role})</span>
                      ${cBadge}
                    </div>
                  `;
      }).join("")}
              </div>
            `}
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      <!-- NAV HEADER BREADCRUMB & TOMBOL PANITIA -->
      <div class="md-nav-header">
        <button type="button" class="md-back-btn" onclick="app.backFromMatchDetail()">
          ← Kembali ke Jadwal &amp; Skor
        </button>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${this.isAdmin() ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="admin.openQuickScore('${match.id}')" style="padding: 8px 14px; font-weight: 800; font-size: 0.82rem;">
              ⚙️ Kontrol Laga (Panitia)
            </button>
          ` : ''}
        </div>
      </div>

      <!-- STADIUM SCOREBOARD HERO CARD -->
      <div class="md-stadium-card">
        <div class="md-stadium-badge-row">
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <span class="md-stage-pill">${match.category || 'SMP'} • ${this.store.getMatchStageName(match)}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">${match.id}</span>
          </div>
          <div class="md-score-status-badge ${statusClass}">
            ${isLive ? '<span class="pulse-dot"></span>' : ''}
            <span>${statusText}</span>
          </div>
        </div>

        <div class="md-matchup-grid">
          <!-- HOME -->
          <div class="md-team-box">
            <div class="md-team-logo-wrap" style="border-color: ${home.badgeColor || '#10b981'};">
              ${home.logo ? `<img src="${home.logo}" alt="${home.name}" class="md-team-logo-img">` : `<span class="md-team-logo-fallback">${(home.shortName || 'TBD').substring(0, 3)}</span>`}
            </div>
            <div class="md-team-title">${home.name}</div>
            <div class="md-team-sub">📍 ${home.city || '-'}</div>
          </div>

          <!-- CENTER SCORE -->
          <div class="md-score-center">
            ${isLive ? `
              <div class="md-live-minute-top ${match.isTimerPaused ? 'is-paused' : ''}" id="mdLiveMinuteTop" title="${match.isTimerPaused ? 'Waktu Pertandingan Dijeda (m:dd)' : 'Live Minute Pertandingan (m:dd)'}">
                <span class="md-live-clock-digits" id="mdLiveClockDigits">${this.formatMatchLiveMinute(match)}</span>
              </div>
            ` : ''}
            <div class="md-score-digits">
              <span>${hScore}</span>
              <span class="md-score-colon">:</span>
              <span>${aScore}</span>
            </div>
            ${hasPenalties ? `
              <div class="md-penalty-shootout-banner">
                🎯 Adu Penalti: ${match.penaltyHomeScore} - ${match.penaltyAwayScore}
                ${match.penaltyWinner ? `<br><small>Pemenang Lolos: ${app.store.getTeam(match.penaltyWinner)?.shortName || match.penaltyWinner}</small>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- AWAY -->
          <div class="md-team-box">
            <div class="md-team-logo-wrap" style="border-color: ${away.badgeColor || '#3b82f6'};">
              ${away.logo ? `<img src="${away.logo}" alt="${away.name}" class="md-team-logo-img">` : `<span class="md-team-logo-fallback">${(away.shortName || 'TBD').substring(0, 3)}</span>`}
            </div>
            <div class="md-team-title">${away.name}</div>
            <div class="md-team-sub">📍 ${away.city || '-'}</div>
          </div>
        </div>

        <div class="md-meta-strip">
          <span class="md-meta-item">📅 ${match.date || 'Hari Pertandingan'}</span>
          <span class="md-meta-item">⏰ ${match.time ? `${match.time} ` : '-'}</span>
        </div>
      </div>

      <!-- KRONOLOGI KEJADIAN LAGA (TIMELINE DUA SISI: KIRI TIM A, KANAN TIM B) -->
      <div class="md-section-title">
        <span>⏱️</span> Kronologi Kejadian Laga
      </div>
      <div class="md-timeline-card">
        <!-- Header Nama Tim di Kiri & Kanan -->
        <div class="md-timeline-header-teams">
          <div class="md-timeline-team-name home">
            <span class="team-dot" style="background: ${home.badgeColor || '#10b981'};"></span>
            <span title="${home.name}">${home.name}</span>
          </div>
          <div class="md-timeline-center-label">⏱️ Waktu</div>
          <div class="md-timeline-team-name away">
            <span title="${away.name}">${away.name}</span>
            <span class="team-dot" style="background: ${away.badgeColor || '#3b82f6'};"></span>
          </div>
        </div>

        ${eventsList.length === 0 ? `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px 12px;">
            Belum ada gol atau kartu pelanggaran yang dicatat pada pertandingan ini.
          </div>
        ` : `
          <div class="md-timeline-list">
            ${eventsList.map(e => {
      const isHome = (e.team === match.homeId || (home.id && e.team === home.id) || e.team === home.name || e.team === home.shortName);
      let iconHtml = '⚽';
      let subText = '';

      if (e.type === 'goal') {
        iconHtml = '⚽';
        if (e.assist) subText = `<span class="md-event-sub">Assist: <strong>${e.assist}</strong></span>`;
      } else if (e.type === 'own_goal') {
        iconHtml = '⚡';
        subText = `<span class="md-event-sub og-tag">Gol Bunuh Diri (OG)</span>`;
      } else if (e.type === 'yellow_card') {
        iconHtml = '<span class="card-icon-y" title="Kartu Kuning"></span>';
        if (e.role && e.role !== 'Pemain') subText = `<span class="md-event-sub">(${e.role})</span>`;
      } else if (e.type === 'red_card') {
        iconHtml = '<span class="card-icon-r" title="Kartu Merah"></span>';
        if (e.role && e.role !== 'Pemain') subText = `<span class="md-event-sub">(${e.role})</span>`;
      }

      return `
                <div class="md-timeline-row ${isHome ? 'home-event' : 'away-event'}">
                  <!-- Sisi Kiri (Tim A / Home) -->
                  <div class="md-timeline-side home">
                    ${isHome ? `
                      <div class="md-event-bubble home">
                        <div class="md-event-main">
                          <span class="md-event-player">${e.player}</span>
                          <span class="md-event-icon">${iconHtml}</span>
                        </div>
                        ${subText}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Center: Menit Kejadian -->
                  <div class="md-timeline-center">
                    <span class="md-timeline-min-badge">${e.minStr || "•"}</span>
                  </div>

                  <!-- Sisi Kanan (Tim B / Away) -->
                  <div class="md-timeline-side away">
                    ${!isHome ? `
                      <div class="md-event-bubble away">
                        <div class="md-event-main">
                          <span class="md-event-icon">${iconHtml}</span>
                          <span class="md-event-player">${e.player}</span>
                        </div>
                        ${subText}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
    }).join("")}
          </div>
        `}
      </div>
      
      <!-- AKUMULASI PELANGGARAN TIM (FOULS BANNER) -->
      <div class="md-foul-banner">
        <div class="md-foul-side">
          <span style="font-weight: 800; font-size: 0.85rem; color: #ffffff;">${home.shortName || home.name}:</span>
          <span class="md-foul-count ${hFouls >= 5 ? 'danger' : ''}">${hFouls}</span>
          ${hFouls >= 5 ? `<span style="font-size: 0.7rem; color: #ef4444; font-weight: 800;">🚨 LIMIT 10m!</span>` : `<span style="font-size: 0.7rem; color: var(--text-muted);">${5 - hFouls} foul tersisa</span>`}
        </div>

        <div style="font-weight: 800; font-size: 0.82rem; color: #fbbf24; text-align: center;">
          ⚠️ TOTAL PELANGGARAN: ${hFouls} - ${aFouls}
        </div>

        <div class="md-foul-side" style="justify-content: flex-end;">
          ${aFouls >= 5 ? `<span style="font-size: 0.7rem; color: #ef4444; font-weight: 800;">🚨 LIMIT 10m!</span>` : `<span style="font-size: 0.7rem; color: var(--text-muted);">${5 - aFouls} foul tersisa</span>`}
          <span class="md-foul-count ${aFouls >= 5 ? 'danger' : ''}">${aFouls}</span>
          <span style="font-weight: 800; font-size: 0.85rem; color: #ffffff;">:${away.shortName || away.name}</span>
        </div>
      </div>


      <!-- DAFTAR SKUAD & OFISIAL (DUAL COLUMN) -->
      <div class="md-section-title">
        <span>📋</span> Daftar Skuad Lengkap &amp; Staf Ofisial Tim
      </div>
      <div class="md-lineup-dual-grid">
        ${renderLineupCol(home, 'home', hLineup)}
        ${renderLineupCol(away, 'away', aLineup)}
      </div>
    `;
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
    toast.innerHTML = `<span></span> <span>${message}</span>`;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  },

  // PWA Support
  initPwa() {
    window.addEventListener("beforeinstallprompt", (e) => {
      const btnInstall = document.getElementById("btnInstallPwa");
      if (btnInstall) {
        e.preventDefault();
        window.deferredPrompt = e;
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
});

// Guarantee window.app === app unified single instance
app._realSwitchTab = app.switchTab.bind(app);
app._realNavigateTo = app.navigateTo.bind(app);
app._realSetCategory = app.setCategory.bind(app);
app._realCloseMobileMenu = app.closeMobileMenu.bind(app);
app._realOpenMobileMenu = app.openMobileMenu.bind(app);

// Initialize when DOM ready (supports already-loaded state on mobile/PWA cache)
const _bootAppSafely = () => {
  try {
    app.init();
  } catch (err) {
    console.error("Critical app.init error:", err);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _bootAppSafely);
} else {
  _bootAppSafely();
}
