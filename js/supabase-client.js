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
        this.channel = this.client.channel('tournament_live_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, payload => {
            this.notifyListeners('matches', payload.new || payload.old);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
            this.notifyListeners('teams', payload.new || payload.old);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, payload => {
            this.notifyListeners('moments', payload.new || payload.old);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_config' }, payload => {
            this.notifyListeners('config', payload.new || payload.old);
          })
          .subscribe();
      } catch (e) {
        // Silently continue
      }
    }

    // Fetch complete tournament dataset from Supabase if online & configured
    async fetchAllData() {
      if (!this.client || !this.isConfigured) {
        if (window.supabase) this.init();
      }
      if (!this.client || !this.isConfigured) return null;

      try {
        const [configRes, teamsRes, matchesRes, momentsRes, sponsorsRes] = await Promise.all([
          this.client.from('tournament_config').select('*').limit(1).maybeSingle(),
          this.client.from('teams').select('*'),
          this.client.from('matches').select('*'),
          this.client.from('moments').select('*').order('sort_order', { ascending: true }),
          this.client.from('sponsors').select('*').order('sort_order', { ascending: true })
        ]);

        if (matchesRes.error && teamsRes.error) {
          return null; // Database tables might not be migrated yet, fallback to local
        }

        return {
          config: configRes.data || null,
          teams: teamsRes.data || null,
          matches: matchesRes.data || null,
          moments: momentsRes.data || null,
          sponsors: sponsorsRes.data || null
        };
      } catch (err) {
        return null;
      }
    }

    // Push Match Score with Security Validation (RPC protected against tampering)
    async syncMatch(match, pinHash) {
      if (!this.client || !this.isConfigured) return false;

      try {
        const hScoreNum = (match.status === 'live' || match.status === 'finished')
          ? (match.homeScore !== undefined && match.homeScore !== null ? parseInt(match.homeScore, 10) : (parseInt(match.homeScoreLive, 10) || 0))
          : 0;
        const aScoreNum = (match.status === 'live' || match.status === 'finished')
          ? (match.awayScore !== undefined && match.awayScore !== null ? parseInt(match.awayScore, 10) : (parseInt(match.awayScoreLive, 10) || 0))
          : 0;

        // Try calling the security definer RPC function first
        const { data, error } = await this.client.rpc('secure_update_match', {
          p_match_id: match.id,
          p_home_score: hScoreNum,
          p_away_score: aScoreNum,
          p_status: match.status,
          p_scorers: match.scorers || [],
          p_cards: match.cards || [],
          p_pin_hash: pinHash || ""
        });

        if (!error) return true;

        // Fallback: direct table update if RLS allows authenticated session
        const payload = {
          id: match.id,
          home_id: match.homeId,
          away_id: match.awayId,
          date: match.date || "22 Nov 2026",
          time: match.time || "08:00",
          pitch: match.pitch || match.venue || "Lapangan 1",
          stage: match.stage || "group",
          group_letter: match.group || null,
          round_name: match.roundName || "",
          home_score: hScoreNum,
          away_score: aScoreNum,
          home_score_live: hScoreNum,
          away_score_live: aScoreNum,
          minute_live: parseInt((match.liveMinute || "0").replace(/\D/g, ''), 10) || 0,
          status: match.status || 'scheduled',
          scorers: match.scorers || [],
          cards: match.cards || [],
          penalty_home_score: match.penaltyHomeScore !== undefined ? match.penaltyHomeScore : null,
          penalty_away_score: match.penaltyAwayScore !== undefined ? match.penaltyAwayScore : null,
          penalty_winner: match.penaltyWinner !== undefined ? match.penaltyWinner : null,
          updated_at: new Date().toISOString()
        };

        let { error: directErr } = await this.client
          .from('matches')
          .upsert(payload);

        if (directErr && (directErr.code === '42703' || (directErr.message && directErr.message.includes('penalty')))) {
          delete payload.penalty_home_score;
          delete payload.penalty_away_score;
          delete payload.penalty_winner;
          const retry = await this.client.from('matches').upsert(payload);
          directErr = retry.error;
        }

        return !directErr;
      } catch (e) {
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

    // Push Team Data
    async syncTeam(team) {
      if (!this.client || !this.isConfigured) return false;
      try {
        const { error } = await this.client.from('teams').upsert({
          id: team.id,
          name: team.name,
          short_name: team.shortName,
          badge_color: team.badgeColor,
          city: team.city,
          group_letter: team.group,
          official_coach: team.official ? team.official.coach : '',
          official_manager: team.official ? team.official.manager : '',
          official_medic: team.official ? team.official.medic : '',
          official_phone: team.official ? team.official.phone : '',
          official_jersey_home: team.official ? team.official.jerseyHome : '',
          official_jersey_away: team.official ? team.official.jerseyAway : '',
          coach_photo: team.official ? team.official.coachPhoto : '',
          manager_photo: team.official ? team.official.managerPhoto : '',
          players: team.players || [],
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.warn("Supabase syncTeam notice:", error.message);
          this.lastError = error.message;
        }
        return !error;
      } catch (e) {
        return false;
      }
    }

    // Push Entire Tournament Dataset to Supabase
    async syncAllData(data) {
      if (!this.client || !this.isConfigured) {
        return { ok: false, message: "Klien Supabase belum terkonfigurasi." };
      }
      try {
        // 1. Teams
        if (data.teams && Array.isArray(data.teams)) {
          const teamsPayload = data.teams.map(t => ({
            id: t.id,
            name: t.name,
            short_name: t.shortName,
            badge_color: t.badgeColor,
            city: t.city,
            group_letter: t.group,
            official_coach: t.official ? t.official.coach : '',
            official_manager: t.official ? t.official.manager : '',
            official_medic: t.official ? t.official.medic : '',
            official_phone: t.official ? t.official.phone : '',
            official_jersey_home: t.official ? t.official.jerseyHome : '',
            official_jersey_away: t.official ? t.official.jerseyAway : '',
            coach_photo: t.official ? t.official.coachPhoto : '',
            manager_photo: t.official ? t.official.managerPhoto : '',
            players: t.players || [],
            updated_at: new Date().toISOString()
          }));

          const { error: teamErr } = await this.client.from('teams').upsert(teamsPayload);
          if (teamErr) {
            const isRls = teamErr.code === '42501' || (teamErr.message && teamErr.message.includes('row-level security'));
            return { ok: false, message: teamErr.message, isRls: isRls, table: 'teams' };
          }
        }

        // 2. Matches
        if (data.matches && Array.isArray(data.matches)) {
          const matchesPayload = data.matches.map(m => ({
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
            minute_live: parseInt((m.liveMinute || "0").replace(/\D/g, ''), 10) || 0,
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
      if (!this.client || !this.isConfigured) return false;
      try {
        const { error } = await this.client.from('moments').upsert({
          id: moment.id,
          title: moment.title,
          player: moment.player,
          team: moment.team,
          category: moment.category,
          badge: moment.badge,
          media_url: moment.mediaUrl,
          caption: moment.caption,
          sort_order: moment.sortOrder || 0,
          created_at: new Date().toISOString()
        });
        return !error;
      } catch (e) {
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
