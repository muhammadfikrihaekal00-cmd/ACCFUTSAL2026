// js/supabase-client.js - Seamless, Silent, Real-Time Supabase Synchronization
(function (window) {
  'use strict';

  // Default configuration placeholders (Can be injected via window.SUPABASE_CONFIG or localStorage)
  // Sensitive keys are NEVER exposed in plain text in GitHub repositories!
  const DEFAULT_CONFIG = {
    url: window.__ENV_SUPABASE_URL || "https://qxanfoqijpznszezwzef.supabase.co",
    anonKey: window.__ENV_SUPABASE_ANON_KEY || "sb_publishable_3sH1x2EhzsmxKtCAei-sbg_ZAunYZja",
    storageBucket: "tournament-assets"
  };

  class SupabaseService {
    constructor() {
      this.client = null;
      this.isConfigured = false;
      this.channel = null;
      this.listeners = [];
      this.init();
    }

    isReady() {
      if ((!this.isConfigured || !this.client) && window.supabase) {
        this.init();
      }
      return !!this.isConfigured && !!this.client;
    }

    cleanUrl(rawUrl) {
      if (!rawUrl) return "";
      let url = rawUrl.trim();
      url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return url;
    }

    cleanKey(rawKey) {
      if (!rawKey) return "";
      let key = rawKey.trim();
      key = key.replace(/^["']|["']$/g, '');
      const match = key.match(/(sb_publishable_[a-zA-Z0-9_\-]+|sb_secret_[a-zA-Z0-9_\-]+|eyJ[a-zA-Z0-9._\-]+)/);
      if (match) {
        return match[1];
      }
      return key;
    }

    parseEnvSnippet(text) {
      if (!text) return null;
      let url = "";
      let key = "";
      const urlMatch = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.supabase\.co/i);
      if (urlMatch) {
        url = urlMatch[0];
      }
      const keyMatch = text.match(/(sb_publishable_[a-zA-Z0-9_\-]+|sb_secret_[a-zA-Z0-9_\-]+|eyJ[a-zA-Z0-9._\-]+)/);
      if (keyMatch) {
        key = keyMatch[1];
      }
      if (url || key) {
        return { url, key };
      }
      return null;
    }

    init() {
      // Check for config from window or localStorage
      let cfg = { ...DEFAULT_CONFIG };
      try {
        const stored = localStorage.getItem("acc_supabase_cfg");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            if (parsed.url) cfg.url = parsed.url;
            if (parsed.anonKey && parsed.anonKey.length >= 30) cfg.anonKey = parsed.anonKey;
          }
        }
      } catch (e) {
        // Silent fallback
      }

      if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
        cfg = { ...cfg, ...window.SUPABASE_CONFIG };
      }

      this.lastError = null;

      const targetUrl = this.cleanUrl(cfg.url);
      const targetKey = this.cleanKey(cfg.anonKey);

      if (!targetUrl || !targetKey) {
        this.isConfigured = false;
        return;
      }

      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        this.lastError = "Library Supabase JS belum selesai dimuat. Coba refresh halaman Anda.";
        this.isConfigured = false;
        return;
      }

      try {
        this.client = window.supabase.createClient(targetUrl, targetKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        this.isConfigured = true;
        this.setupRealtimeSubscriptions();
      } catch (err) {
        console.error("Supabase createClient error:", err);
        this.lastError = err ? (err.message || err.toString()) : "Gagal inisialisasi client";
        this.client = null;
        this.isConfigured = false;
      }
    }

    // Save Supabase credentials silently
    configure(url, anonKey) {
      if (!url || !anonKey) return false;
      try {
        const cleanedUrl = this.cleanUrl(url);
        const cleanedKey = this.cleanKey(anonKey);
        localStorage.setItem("acc_supabase_cfg", JSON.stringify({ url: cleanedUrl, anonKey: cleanedKey }));
        this.init();
        return this.isConfigured;
      } catch (e) {
        return false;
      }
    }

    async testConnection() {
      if (!this.client || !this.isConfigured) {
        return { ok: false, message: this.lastError || "Client belum aktif." };
      }
      try {
        const { data, error } = await this.client.from('tournament_config').select('id').limit(1);
        if (error) {
          if (error.code === '42P01') {
            return { ok: true, message: "Tersambung ke Supabase (tabel sedang disiapkan)." };
          }
          return { ok: false, message: error.message || "Gagal query ke Supabase." };
        }
        return { ok: true, message: "Tersambung sempurna ke Supabase Cloud!" };
      } catch (e) {
        return { ok: false, message: e.message || "Gagal menghubungi Supabase." };
      }
    }

    // Listen for incoming remote updates without showing noisy UI alerts
    onRemoteUpdate(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    }

    notifyListeners(table, payload) {
      this.listeners.forEach(fn => {
        try {
          fn(table, payload);
        } catch (e) {
          console.error("Listener error", e);
        }
      });
    }

    // Real-Time WebSocket channels for live score & tournament updates
    setupRealtimeSubscriptions() {
      if (!this.client) return;

      try {
        if (this.channel) {
          try {
            this.client.removeChannel(this.channel);
          } catch (e) { }
        }
        this.channel = this.client.channel('tournament_live_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, payload => {
            if (payload.eventType === 'DELETE') {
              this.notifyListeners('matches', { id: payload.old && payload.old.id, _deleted: true });
            } else {
              this.notifyListeners('matches', payload.new || payload.old);
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
            if (payload.eventType === 'DELETE') {
              this.notifyListeners('teams', { id: payload.old && payload.old.id, _deleted: true });
            } else {
              this.notifyListeners('teams', payload.new || payload.old);
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, payload => {
            if (payload.eventType === 'DELETE') {
              this.notifyListeners('moments', { id: payload.old && payload.old.id, _deleted: true });
            } else {
              this.notifyListeners('moments', payload.new || payload.old);
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_config' }, payload => {
            this.notifyListeners('config', payload.new || payload.old);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, payload => {
            if (payload.eventType === 'DELETE') {
              this.notifyListeners('sponsors', { id: payload.old && payload.old.id, _deleted: true });
            } else {
              this.notifyListeners('sponsors', payload.new || payload.old);
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log("🟢 Realtime channel Supabase aktif terhubung!");
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn("⚠️ Realtime channel terputus, menghubungkan ulang...");
              setTimeout(() => {
                if (navigator.onLine) this.setupRealtimeSubscriptions();
              }, 3000);
            }
          });
      } catch (e) {
        console.warn("Realtime subscription fallback error:", e);
      }
    }

    // Fetch complete tournament dataset from Supabase if online & configured
    async fetchAllData(options = {}) {
      if (!this.client || !this.isConfigured) {
        if (window.supabase) this.init();
      }
      if (!this.client || !this.isConfigured) return null;

      try {
        // Kolom skuad pemain wajib selalu dimuat agar panitia dapat mencatat gol, kartu, dan susunan pemain di detail laga
        const teamCols = 'id, name, short_name, badge_color, city, group_letter, official_coach, official_manager, official_jersey_home, official_jersey_away, players, updated_at';

        // 1. Fetch complete tournament dataset in parallel with optimized payload (excludes heavy logos blob, registry backups)
        const [configListRes, teamsRes, matchesRes, momentsRes, sponsorsRes] = await Promise.all([
          this.client.from('tournament_config').select('*').in('id', ['config_main', 'team_meta_registry', 'mvp_spotlight_registry']),
          this.client.from('teams').select(teamCols),
          this.client.from('matches').select('*'),
          this.client.from('moments').select('id, title, player, team, category, badge, media_url, caption, sort_order, created_at').order('sort_order', { ascending: true }).limit(30),
          this.client.from('sponsors').select('*').order('sort_order', { ascending: true })
        ]);

        if (matchesRes.error && teamsRes.error) {
          console.warn('[Supabase] Both matches and teams errored:', matchesRes.error, teamsRes.error);
          return null; // Database tables might not be migrated yet, fallback to local
        }

        const teamsRawData = (teamsRes && teamsRes.data && Array.isArray(teamsRes.data)) ? teamsRes.data : null;

        let mainConfig = null;
        let teamLogos = {};
        let teamMeta = {};
        let mvpList = [];
        let momentsRegistryList = null;

        // Coba baca teamLogos dari cache localStorage dulu agar instan & hemat bandwidth
        try {
          const cachedLogos = localStorage.getItem('acc_team_logos_cache');
          if (cachedLogos) {
            teamLogos = JSON.parse(cachedLogos) || {};
          }
        } catch (_) { }

        if (configListRes && configListRes.data && Array.isArray(configListRes.data)) {
          mainConfig = configListRes.data.find(c => c.id === 'config_main') || configListRes.data[0] || null;
          const metaRow = configListRes.data.find(c => c.id === 'team_meta_registry');
          if (metaRow && metaRow.rules_text) {
            try {
              teamMeta = JSON.parse(metaRow.rules_text) || {};
            } catch (_) { }
          }
          const mvpRow = configListRes.data.find(c => c.id === 'mvp_spotlight_registry');
          if (mvpRow && mvpRow.rules_text) {
            try {
              mvpList = JSON.parse(mvpRow.rules_text) || [];
            } catch (_) { }
          }
          const momentsRegistryRow = configListRes.data.find(c => c.id === 'moments_registry');
          if (momentsRegistryRow && momentsRegistryRow.rules_text) {
            try {
              momentsRegistryList = JSON.parse(momentsRegistryRow.rules_text) || null;
            } catch (_) { }
          }
        }

        // Lazy fetch logos registry di background jika belum ada di cache
        if (Object.keys(teamLogos).length === 0) {
          setTimeout(async () => {
            try {
              if (this.client) {
                const { data: logosRow } = await this.client.from('tournament_config').select('rules_text').eq('id', 'team_logos_registry').maybeSingle();
                if (logosRow && logosRow.rules_text) {
                  localStorage.setItem('acc_team_logos_cache', logosRow.rules_text);
                }
              }
            } catch (_) { }
          }, 3500);
        }

        // Normalisasi daftar momen turnamen: utamakan tabel 'moments' online (Single Source of Truth)
        let finalMoments = null;
        if (momentsRes && Array.isArray(momentsRes.data) && momentsRes.data.length > 0) {
          finalMoments = momentsRes.data.map(m => ({
            id: m.id,
            title: m.title || '',
            player: m.player || '',
            team: m.team || '',
            category: m.category || 'SMP',
            badge: m.badge || '🔥 HIGHLIGHT',
            tag: m.tag || 'NEW',
            image: m.media_url || m.image || m.mediaUrl || 'assets/hero_banner.jpg',
            mediaUrl: m.media_url || m.image || m.mediaUrl || 'assets/hero_banner.jpg',
            caption: m.caption || '',
            sortOrder: m.sort_order || 0
          }));
        } else if (Array.isArray(momentsRegistryList) && momentsRegistryList.length > 0) {
          finalMoments = momentsRegistryList;
        }

        // Lampirkan metadata (category, instansi, logo) ke setiap baris tim
        const teamsList = Array.isArray(teamsRawData) ? teamsRawData.map(t => {
          const m = teamMeta[t.id] || {};
          return {
            ...t,
            category: t.category || m.category || undefined,
            instansi: t.instansi || m.instansi || '',
            logo: t.logo || teamLogos[t.id] || ''
          };
        }) : null;

        return {
          config: mainConfig,
          teamLogos: teamLogos,
          teamMeta: teamMeta,
          mvps: mvpList,
          teams: teamsList,
          matches: matchesRes.data || null,
          moments: finalMoments,
          sponsors: sponsorsRes.data || null
        };
      } catch (err) {
        console.error('[Supabase] fetchAllData exception:', err);
        return null;
      }
    }

    // Lazy-load full team roster (players + photos) on demand only when viewing team detail
    async fetchTeamFull(teamId) {
      if (!this.client || !this.isConfigured || !teamId) return null;
      try {
        const res = await this.client.from('teams').select('*').eq('id', teamId).single();
        return res.data || null;
      } catch (e) {
        return null;
      }
    }

    // Push Match Score with Security Validation & Direct Realtime Cloud Sync
    async syncMatch(match, pinHash) {
      if (!this.client || !this.isConfigured) return false;
      if (!match || !match.id || typeof match.id !== 'string') return false;

      // Filter ketat: Registry config, ID tim, atau phantom duplicate BUKAN pertandingan valid!
      const cleanId = match.id.trim();
      if (
        cleanId === 'M_SMP_23' ||
        /^T\d+$/i.test(cleanId) ||
        cleanId.includes('registry') ||
        cleanId.includes('config') ||
        cleanId === 'team_meta_registry' ||
        cleanId === 'team_logos_registry'
      ) {
        console.warn('[Supabase] syncMatch ditolak: item bukan pertandingan turnamen valid:', cleanId);
        return false;
      }

      try {
        const hScoreNum = (match.status === 'live' || match.status === 'finished')
          ? (match.homeScore !== undefined && match.homeScore !== null ? parseInt(match.homeScore, 10) : (parseInt(match.homeScoreLive, 10) || 0))
          : 0;
        const aScoreNum = (match.status === 'live' || match.status === 'finished')
          ? (match.awayScore !== undefined && match.awayScore !== null ? parseInt(match.awayScore, 10) : (parseInt(match.awayScoreLive, 10) || 0))
          : 0;

        const minuteNum = match.status === 'live'
          ? (parseInt(String(match.liveMinute || "1").replace(/\D/g, ''), 10) || 1)
          : 0;

        // Siapkan kartu dan sematkan metadata laga (lineup 5 pemain, pergantian, foul, & pause timer) secara aman tanpa merusak skema database
        const cleanCards = (Array.isArray(match.cards) ? [...match.cards] : []).filter(c => c && !c._meta);
        if (match.lineup || match.substitutions || match.homeFouls !== undefined || match.awayFouls !== undefined || match.knockoutKey || match.isTimerPaused !== undefined || match.liveElapsedSec !== undefined) {
          cleanCards.push({
            _meta: true,
            knockoutKey: match.knockoutKey || null,
            lineup: match.lineup || null,
            substitutions: Array.isArray(match.substitutions) ? match.substitutions : [],
            homeFouls: parseInt(match.homeFouls, 10) || 0,
            awayFouls: parseInt(match.awayFouls, 10) || 0,
            isTimerPaused: Boolean(match.isTimerPaused),
            liveElapsedSec: typeof match.liveElapsedSec === "number" ? match.liveElapsedSec : null,
            liveClockDisplay: match.liveClockDisplay || null
          });
        }

        // Persist all match details (schedule, pitch, teams, stage, scores) to Supabase
        const upsertPayload = {
          id: match.id,
          home_id: (match.homeId !== undefined && match.homeId !== null) ? String(match.homeId) : "",
          away_id: (match.awayId !== undefined && match.awayId !== null) ? String(match.awayId) : "",
          date: match.date || "22 Nov 2026",
          time: match.time || "08:00 - 08:40 WITA",
          pitch: match.pitch || match.venue || "Lapangan 1 (Utama Vinyl)",
          stage: match.stage || (/(QF|SF|3RD|FINAL)/i.test(match.id) ? "knockout" : "group"),
          group_letter: match.group || match.group_letter || null,
          round_name: match.roundName || match.round_name || "",
          home_placeholder: match.homePlaceholder || null,
          away_placeholder: match.awayPlaceholder || null,
          status: match.status || 'scheduled',
          home_score: hScoreNum,
          away_score: aScoreNum,
          home_score_live: hScoreNum,
          away_score_live: aScoreNum,
          minute_live: minuteNum,
          scorers: Array.isArray(match.scorers) ? match.scorers : [],
          cards: cleanCards,
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await this.client
          .from('matches')
          .upsert(upsertPayload, { onConflict: 'id' });

        if (upsertErr) {
          console.error('[Supabase] syncMatch upsert error:', upsertErr);
          // Fallback coba update
          const { error: updateErr } = await this.client
            .from('matches')
            .update(upsertPayload)
            .eq('id', match.id);
          if (updateErr) {
            console.error('[Supabase] syncMatch update error:', updateErr);
            return false;
          }
        }

        return true;
      } catch (e) {
        console.error('[Supabase] syncMatch error:', e);
        return false;
      }
    }

    // Delete Match from Supabase
    async deleteMatch(matchId) {
      if (!this.client || !this.isConfigured || !matchId) return false;
      try {
        const { error } = await this.client.from('matches').delete().eq('id', matchId);
        if (error) {
          console.error('[Supabase] deleteMatch error:', error);
          return false;
        }
        return true;
      } catch (e) {
        console.error('[Supabase] deleteMatch error:', e);
        return false;
      }
    }

    // Push Config Data
    async syncConfig(config) {
      if (!this.client || !this.isConfigured) return false;
      try {
        const payload = {
          id: 'config_main',
          tournament_name: config.tournamentName || "ACC 2026",
          sub_title: config.subTitle || "",
          venue: config.venue || "",
          dates: config.dates || "",
          running_announcement: config.runningAnnouncement || "",
          hero_banner_image: config.heroBannerImage || "",
          rules_text: config.rulesText || "",
          youtube_live_url: config.youtubeLiveUrl || "",
          youtube_live_title: config.youtubeLiveTitle || "",
          updated_at: new Date().toISOString()
        };
        const { error } = await this.client.from('tournament_config').upsert(payload);
        if (error && (error.code === '42703' || (error.message && error.message.includes('youtube_live')))) {
          // Column doesn't exist in Supabase yet, fallback gracefully
          delete payload.youtube_live_url;
          delete payload.youtube_live_title;
          const { error: retryErr } = await this.client.from('tournament_config').upsert(payload);
          return !retryErr;
        }
        return !error;
      } catch (e) {
        return false;
      }
    }

    // Push MVP Spotlight Registry (Multiple MVPs Carousel Sync)
    async syncMvpList(mvpList) {
      if (!this.client || !this.isConfigured) return false;
      try {
        const cleanList = Array.isArray(mvpList) ? mvpList : [];
        const payload = {
          id: 'mvp_spotlight_registry',
          rules_text: JSON.stringify(cleanList),
          updated_at: new Date().toISOString()
        };
        const { error } = await this.client.from('tournament_config').upsert(payload);
        if (error) {
          console.warn('[Supabase] syncMvpList error:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[Supabase] syncMvpList exception:', err);
        return false;
      }
    }

    // Push Team Logo to Dedicated Registry Table
    async syncTeamLogo(teamId, logoUrl) {
      if (!this.client || !this.isConfigured || !teamId) return false;
      try {
        const { data } = await this.client
          .from('tournament_config')
          .select('rules_text')
          .eq('id', 'team_logos_registry')
          .maybeSingle();

        let registry = {};
        if (data && data.rules_text) {
          try { registry = JSON.parse(data.rules_text) || {}; } catch (_) { }
        }
        registry[teamId] = logoUrl || '';

        const { error } = await this.client
          .from('tournament_config')
          .upsert({
            id: 'team_logos_registry',
            tournament_name: 'Team Logos Registry',
            rules_text: JSON.stringify(registry),
            updated_at: new Date().toISOString()
          });
        return !error;
      } catch (e) {
        console.warn("syncTeamLogo notice:", e);
        return false;
      }
    }

    // Push Team Metadata (Category & Instansi) to Dedicated Registry Row in tournament_config
    async syncTeamMeta(teamId, category, instansi) {
      if ((!this.client || !this.isConfigured) && window.supabase) this.init();
      if (!this.client || !this.isConfigured) return false;
      try {
        const { data: existing } = await this.client
          .from('tournament_config')
          .select('rules_text')
          .eq('id', 'team_meta_registry')
          .maybeSingle();

        let registry = {};
        if (existing && existing.rules_text) {
          try { registry = JSON.parse(existing.rules_text) || {}; } catch (_) { }
        }
        registry[teamId] = {
          category: category || (registry[teamId] && registry[teamId].category) || 'SMP',
          instansi: instansi !== undefined ? String(instansi || '').trim() : ((registry[teamId] && registry[teamId].instansi) || '')
        };

        const { error } = await this.client
          .from('tournament_config')
          .upsert({
            id: 'team_meta_registry',
            tournament_name: 'Team Metadata Registry (Category & Instansi)',
            rules_text: JSON.stringify(registry),
            updated_at: new Date().toISOString()
          });
        if (error) {
          console.warn("syncTeamMeta notice:", error.message);
          this.lastError = error.message;
        }
        return !error;
      } catch (e) {
        console.warn("syncTeamMeta notice:", e);
        return false;
      }
    }

    // Delete Team from Supabase Online Database (+ cleanup team_meta_registry)
    async deleteTeam(teamId) {
      if ((!this.client || !this.isConfigured) && window.supabase) this.init();
      if (!this.client || !this.isConfigured || !teamId) return false;
      try {
        const { error } = await this.client.from('teams').delete().eq('id', teamId);
        if (error) {
          console.warn("Supabase deleteTeam notice:", error.message);
          this.lastError = error.message;
          return false;
        }
        // Bersihkan entri metadata tim dari team_meta_registry
        try {
          const { data: existing } = await this.client
            .from('tournament_config')
            .select('rules_text')
            .eq('id', 'team_meta_registry')
            .maybeSingle();
          if (existing && existing.rules_text) {
            const registry = JSON.parse(existing.rules_text) || {};
            if (registry[teamId] !== undefined) {
              delete registry[teamId];
              await this.client
                .from('tournament_config')
                .upsert({
                  id: 'team_meta_registry',
                  tournament_name: 'Team Metadata Registry (Category & Instansi)',
                  rules_text: JSON.stringify(registry),
                  updated_at: new Date().toISOString()
                });
            }
          }
        } catch (_) { }
        return true;
      } catch (e) {
        return false;
      }
    }

    // Push Team Data (100% Online Sync: public.teams + team_meta_registry + team_logos_registry)
    async syncTeam(team) {
      if ((!this.client || !this.isConfigured) && window.supabase) {
        this.init();
      }
      if (!this.client || !this.isConfigured) {
        this.lastError = "Supabase belum terhubung";
        return false;
      }
      try {
        let existingRem = null;
        try {
          const { data: rem } = await this.client.from('teams').select('*').eq('id', team.id).maybeSingle();
          if (rem) existingRem = rem;
        } catch (_) { }

        // Non-destructive photo & logo preservation (mendukung base64, URL cloud, & path assets/...)
        const hasImg = (v) => typeof v === 'string' && v.trim().length > 5;
        let coachPhoto = team.official ? (team.official.coachPhoto || team.coach_photo || '') : '';
        if (!hasImg(coachPhoto) && existingRem && hasImg(existingRem.coach_photo)) {
          coachPhoto = existingRem.coach_photo;
        }
        let managerPhoto = team.official ? (team.official.managerPhoto || team.manager_photo || '') : '';
        if (!hasImg(managerPhoto) && existingRem && hasImg(existingRem.manager_photo)) {
          managerPhoto = existingRem.manager_photo;
        }
        let logo = team.logo || '';
        let players = Array.isArray(team.players) ? [...team.players] : [];
        if (existingRem && Array.isArray(existingRem.players) && existingRem.players.length > 0) {
          const remHasPhotos = existingRem.players.some(p => hasImg(p.photo));
          if (remHasPhotos) {
            players = players.map((p, pIdx) => {
              const rP = existingRem.players[pIdx] || existingRem.players.find(x => x.no === p.no || (x.name && x.name === p.name));
              return {
                ...p,
                photo: hasImg(p.photo) ? p.photo : (rP && hasImg(rP.photo) ? rP.photo : '')
              };
            });
          }
        }

        // Kirim tepat 16 kolom resmi tabel public.teams di Postgres (zero HTTP 400 error!)
        const payload = {
          id: team.id,
          name: team.name,
          short_name: team.shortName || (team.name || '').substring(0, 10).toUpperCase(),
          badge_color: team.badgeColor || '#10b981',
          city: team.city || '',
          group_letter: team.group || 'A',
          official_coach: team.official ? (team.official.coach || '') : '',
          official_manager: team.official ? (team.official.manager || '') : '',
          official_medic: team.official ? (team.official.medic || '') : '',
          official_phone: '',
          official_jersey_home: team.official ? (team.official.jerseyHome || '') : '',
          official_jersey_away: team.official ? (team.official.jerseyAway || '') : '',
          coach_photo: coachPhoto,
          manager_photo: managerPhoto,
          players: players,
          updated_at: new Date().toISOString()
        };

        const { error } = await this.client.from('teams').upsert(payload);

        if (error) {
          console.warn("Supabase syncTeam error:", error.message);
          this.lastError = error.message;
          return false;
        }

        // Simpan kategori & instansi ke team_meta_registry (online & sinkron lintas perangkat)
        await this.syncTeamMeta(team.id, team.category || 'SMP', team.instansi || '');

        // Simpan logo ke team_logos_registry agar sinkron 100% di semua device (HP, Laptop, PC)
        if (logo) {
          await this.syncTeamLogo(team.id, logo);
        }

        return true;
      } catch (e) {
        this.lastError = e && e.message ? e.message : String(e);
        return false;
      }
    }

    // Push Entire Tournament Dataset to Supabase with Intelligent Cooperative Merging
    async syncAllData(data) {
      if (!this.client || !this.isConfigured) {
        return { ok: false, message: "Klien Supabase belum terkonfigurasi." };
      }
      try {
        // 1. Teams
        if (data.teams && Array.isArray(data.teams)) {
          // Fetch existing remote teams first to prevent clobbering other devices' work!
          let existingRemoteTeams = [];
          try {
            const { data: remList } = await this.client.from('teams').select('*');
            if (remList && Array.isArray(remList)) existingRemoteTeams = remList;
          } catch (_) { }

          // Safely merge logos registry without overwriting existing cloud logos!
          try {
            const { data: regRow } = await this.client
              .from('tournament_config')
              .select('rules_text')
              .eq('id', 'team_logos_registry')
              .maybeSingle();
            let remoteReg = {};
            if (regRow && regRow.rules_text) {
              try { remoteReg = JSON.parse(regRow.rules_text) || {}; } catch (_) { }
            }
            const localLogos = {};
            data.teams.forEach(t => {
              if (t.id && t.logo) localLogos[t.id] = t.logo;
            });
            const mergedReg = { ...remoteReg, ...localLogos };
            if (Object.keys(mergedReg).length > 0) {
              await this.client.from('tournament_config').upsert({
                id: 'team_logos_registry',
                tournament_name: 'Team Logos Registry',
                rules_text: JSON.stringify(mergedReg),
                updated_at: new Date().toISOString()
              });
            }
          } catch (regErr) {
            console.warn("Logos registry merge error:", regErr);
          }

          const teamsPayload = data.teams.map(t => {
            const rem = existingRemoteTeams.find(r => r.id === t.id);

            const teamName = t.name || (rem ? rem.name : '');
            const shortName = t.shortName || (rem ? rem.short_name : (teamName || '').substring(0, 10).toUpperCase());

            // Pertahankan foto pelatih & asisten jika lokal kosong
            let coachPhoto = t.official ? (t.official.coachPhoto || t.coach_photo || '') : '';
            if ((!coachPhoto || coachPhoto.length < 30) && rem && rem.coach_photo && rem.coach_photo.length > 30) {
              coachPhoto = rem.coach_photo;
            }
            let managerPhoto = t.official ? (t.official.managerPhoto || t.manager_photo || '') : '';
            if ((!managerPhoto || managerPhoto.length < 30) && rem && rem.manager_photo && rem.manager_photo.length > 30) {
              managerPhoto = rem.manager_photo;
            }

            // Pertahankan official contact jika lokal kosong
            let coach = t.official ? t.official.coach : '';
            if (!coach && rem && rem.official_coach) coach = rem.official_coach;
            let manager = t.official ? t.official.manager : '';
            if (!manager && rem && rem.official_manager) manager = rem.official_manager;
            let phone = '';
            let jerseyHome = t.official ? t.official.jerseyHome : '';
            if (!jerseyHome && rem && rem.official_jersey_home) jerseyHome = rem.official_jersey_home;
            let jerseyAway = t.official ? t.official.jerseyAway : '';
            if (!jerseyAway && rem && rem.official_jersey_away) jerseyAway = rem.official_jersey_away;

            // Merge pemain & pertahankan foto jika lokal kosong
            let players = Array.isArray(t.players) ? [...t.players] : [];
            if (rem && Array.isArray(rem.players) && rem.players.length > 0 && players.length > 0) {
              players = players.map((p, pIdx) => {
                const rP = rem.players[pIdx] || rem.players.find(x => x.no === p.no || (x.name && x.name === p.name));
                return {
                  ...p,
                  photo: (p.photo && p.photo.length > 30) ? p.photo : (rP && rP.photo ? rP.photo : '')
                };
              });
            }

            return {
              id: t.id,
              name: teamName,
              short_name: shortName,
              badge_color: t.badgeColor || (rem ? rem.badge_color : '#10b981'),
              city: t.city || (rem ? rem.city : ''),
              group_letter: t.group || (rem ? rem.group_letter : 'A'),
              official_coach: coach,
              official_manager: manager,
              official_medic: (t.official ? t.official.medic : '') || (rem ? rem.official_medic : ''),
              official_phone: '',
              official_jersey_home: jerseyHome,
              official_jersey_away: jerseyAway,
              coach_photo: coachPhoto,
              manager_photo: managerPhoto,
              players: players,
              updated_at: new Date().toISOString()
            };
          });

          // Simpan juga metadata (category & instansi) ke team_meta_registry
          try {
            const { data: metaRow } = await this.client
              .from('tournament_config')
              .select('rules_text')
              .eq('id', 'team_meta_registry')
              .maybeSingle();
            let remoteMeta = {};
            if (metaRow && metaRow.rules_text) {
              try { remoteMeta = JSON.parse(metaRow.rules_text) || {}; } catch (_) { }
            }
            data.teams.forEach(t => {
              if (!t || !t.id) return;
              const prev = remoteMeta[t.id] || {};
              remoteMeta[t.id] = {
                category: t.category || prev.category || 'SMP',
                instansi: (t.instansi && t.instansi.trim()) ? t.instansi.trim() : (prev.instansi || '')
              };
            });
            await this.client.from('tournament_config').upsert({
              id: 'team_meta_registry',
              tournament_name: 'Team Metadata Registry (Category & Instansi)',
              rules_text: JSON.stringify(remoteMeta),
              updated_at: new Date().toISOString()
            });
          } catch (_) { }

          let { error: teamErr } = await this.client.from('teams').upsert(teamsPayload);
          if (teamErr) {
            const isRls = teamErr.code === '42501' || (teamErr.message && teamErr.message.includes('row-level security'));
            return { ok: false, message: teamErr.message, isRls: isRls, table: 'teams' };
          }
        }

        // 2. Matches
        if (data.matches && Array.isArray(data.matches)) {
          const cleanMatches = data.matches.filter(m => m && m.id && m.id !== 'M_SMP_23' && !/^T\d+$/i.test(m.id) && !m.id.includes('registry') && !m.id.includes('config'));
          const matchesPayload = cleanMatches.map(m => ({
            id: m.id,
            home_id: m.homeId,
            away_id: m.awayId,
            date: m.date || "22 Nov 2026",
            time: m.time || "08:00",
            pitch: m.pitch || m.venue || "Lapangan 1",
            stage: m.stage || "group",
            group_letter: m.group || null,
            round_name: m.roundName || "",
            home_score: m.homeScore !== undefined ? m.homeScore : 0,
            away_score: m.awayScore !== undefined ? m.awayScore : 0,
            home_score_live: m.homeScoreLive !== undefined ? m.homeScoreLive : 0,
            away_score_live: m.awayScoreLive !== undefined ? m.awayScoreLive : 0,
            minute_live: m.status === 'live' ? (parseInt((m.liveMinute || "1").replace(/\D/g, ''), 10) || 1) : 0,
            home_placeholder: m.homePlaceholder || null,
            away_placeholder: m.awayPlaceholder || null,
            status: m.status || 'scheduled',
            scorers: m.scorers || [],
            cards: m.cards || [],
            penalty_home_score: m.penaltyHomeScore !== undefined ? m.penaltyHomeScore : null,
            penalty_away_score: m.penaltyAwayScore !== undefined ? m.penaltyAwayScore : null,
            penalty_winner: m.penaltyWinner !== undefined ? m.penaltyWinner : null,
            updated_at: new Date().toISOString()
          }));

          let { error: matchErr } = await this.client.from('matches').upsert(matchesPayload);
          if (matchErr && (matchErr.code === '42703' || (matchErr.message && matchErr.message.includes('penalty')))) {
            const fallbackMatches = matchesPayload.map(({ penalty_home_score, penalty_away_score, penalty_winner, ...rest }) => rest);
            const retry = await this.client.from('matches').upsert(fallbackMatches);
            matchErr = retry.error;
          }
          if (matchErr) {
            const isRls = matchErr.code === '42501' || (matchErr.message && matchErr.message.includes('row-level security'));
            return { ok: false, message: matchErr.message, isRls: isRls, table: 'matches' };
          }
        }

        // 3. Config
        if (data.config) {
          const { error: cfgErr } = await this.client.from('tournament_config').upsert({
            id: 'config_main',
            tournament_name: data.config.tournamentName || "ACC 2026",
            sub_title: data.config.subTitle || "",
            venue: data.config.venue || "",
            dates: data.config.dates || "",
            running_announcement: data.config.runningAnnouncement || "",
            hero_banner_image: data.config.heroBannerImage || "",
            rules_text: data.config.rulesText || "",
            youtube_live_url: data.config.youtubeLiveUrl || "",
            youtube_live_title: data.config.youtubeLiveTitle || "",
            updated_at: new Date().toISOString()
          });
          if (cfgErr) {
            const isRls = cfgErr.code === '42501' || (cfgErr.message && cfgErr.message.includes('row-level security'));
            return { ok: false, message: cfgErr.message, isRls: isRls, table: 'tournament_config' };
          }
        }

        return { ok: true, message: "Berhasil menyinkronkan seluruh data ke Supabase Cloud!" };
      } catch (err) {
        return { ok: false, message: err.message || err.toString() };
      }
    }

    // Push Moment Data
    async syncMoment(moment) {
      if (!this.client || !this.isConfigured || !moment || !moment.id) return false;
      try {
        const imgUrl = moment.image || moment.media_url || moment.mediaUrl || '';
        const payload = {
          id: moment.id,
          title: moment.title || '',
          player: moment.player || '',
          team: moment.team || '',
          category: moment.category || 'SMP',
          badge: moment.badge || '🔥 HIGHLIGHT',
          media_url: imgUrl,
          caption: moment.caption || '',
          sort_order: moment.sortOrder || moment.sort_order || 0,
          created_at: moment.created_at || new Date().toISOString()
        };
        const { error } = await this.client.from('moments').upsert(payload);
        if (error) console.warn('[Supabase] syncMoment table notice:', error);
        return !error;
      } catch (e) {
        console.warn('[Supabase] syncMoment exception:', e);
        return false;
      }
    }

    // Delete Moment from Supabase Cloud
    async deleteMoment(momentId) {
      if (!this.client || !this.isConfigured || !momentId) return false;
      try {
        const { error } = await this.client.from('moments').delete().eq('id', momentId);
        if (error) console.warn('[Supabase] deleteMoment table notice:', error);
        return !error;
      } catch (e) {
        console.warn('[Supabase] deleteMoment exception:', e);
        return false;
      }
    }

    // Push Moments Registry Backup to tournament_config (Guarantees multi-device persistence without inflating payload)
    async syncMomentsList(momentsList) {
      if (!this.client || !this.isConfigured) return false;
      try {
        const cleanList = Array.isArray(momentsList) ? momentsList.map(m => ({
          ...m,
          image: (typeof m.image === 'string' && m.image.startsWith('data:image')) ? '' : (m.image || ''),
          mediaUrl: (typeof m.mediaUrl === 'string' && m.mediaUrl.startsWith('data:image')) ? '' : (m.mediaUrl || ''),
          media_url: (typeof m.media_url === 'string' && m.media_url.startsWith('data:image')) ? '' : (m.media_url || '')
        })) : [];
        const payload = {
          id: 'moments_registry',
          rules_text: JSON.stringify(cleanList),
          updated_at: new Date().toISOString()
        };
        const { error } = await this.client.from('tournament_config').upsert(payload);
        if (error) console.warn('[Supabase] syncMomentsList error:', error);
        return !error;
      } catch (err) {
        console.warn('[Supabase] syncMomentsList exception:', err);
        return false;
      }
    }

    // Push Sponsor Data (Utama / Normal)
    async syncSponsor(sponsor, tier = 'platinum') {
      if (!this.client || !this.isConfigured) return false;
      try {
        const { error } = await this.client.from('sponsors').upsert({
          id: sponsor.id,
          tier: tier,
          name: sponsor.name,
          subtitle: sponsor.role || sponsor.type || '',
          logo_url: sponsor.image || '',
          sort_order: Date.now() % 1000000,
          created_at: new Date().toISOString()
        });
        return !error;
      } catch (e) {
        return false;
      }
    }

    // Delete Sponsor from Supabase
    async deleteSponsor(sponsorId) {
      if (!this.client || !this.isConfigured) return false;
      try {
        const { error } = await this.client.from('sponsors').delete().eq('id', sponsorId);
        return !error;
      } catch (e) {
        return false;
      }
    }

    // Upload Image to Supabase Storage Bucket
    async uploadImage(file, prefix = "acc") {
      if (!this.client || !this.isConfigured) return null;
      try {
        const ext = (file.name && file.name.split('.').pop()) || 'jpg';
        const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt || 'jpg'}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await this.client.storage
          .from('tournament-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.warn("Supabase Storage upload note:", error.message);
          return null;
        }

        const { data: publicData } = this.client.storage
          .from('tournament-assets')
          .getPublicUrl(filePath);

        return publicData?.publicUrl || null;
      } catch (err) {
        console.warn("Storage upload exception:", err);
        return null;
      }
    }
  }

  window.SupabaseService = new SupabaseService();
})(window);
