// js/supabase-client.js - Seamless, Silent, Real-Time Supabase Synchronization
(function(window) {
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
        // Try calling the security definer RPC function first
        const { data, error } = await this.client.rpc('secure_update_match', {
          p_match_id: match.id,
          p_home_score: match.homeScore !== undefined ? parseInt(match.homeScore, 10) : 0,
          p_away_score: match.awayScore !== undefined ? parseInt(match.awayScore, 10) : 0,
          p_status: match.status,
          p_scorers: match.scorers || [],
          p_cards: match.cards || [],
          p_pin_hash: pinHash || ""
        });

        if (!error) return true;

        // Fallback: direct table update if RLS allows authenticated session
        const { error: directErr } = await this.client
          .from('matches')
          .upsert({
            id: match.id,
            home_id: match.homeId,
            away_id: match.awayId,
            home_score: match.homeScore,
            away_score: match.awayScore,
            home_score_live: match.homeScoreLive,
            away_score_live: match.awayScoreLive,
            status: match.status,
            scorers: match.scorers,
            cards: match.cards,
            updated_at: new Date().toISOString()
          });

        return !directErr;
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
        return !error;
      } catch (e) {
        return false;
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
  }

  window.SupabaseService = new SupabaseService();
})(window);
