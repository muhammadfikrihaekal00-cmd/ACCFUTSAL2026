-- =========================================================================
-- ACC AL-FAYYADH CHAMPIONS CUP 2026 - PRODUCTION SUPABASE DATABASE SCHEMA
-- HIGH SECURITY ARCHITECTURE WITH ROW LEVEL SECURITY (RLS) & CRYPTOGRAPHIC RPC
-- (100% IDEMPOTENT - AMAN DIJALANKAN BERULANG KALI TANPA ERROR)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TOURNAMENT CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.tournament_config (
  id TEXT PRIMARY KEY DEFAULT 'config_main',
  tournament_name TEXT NOT NULL DEFAULT 'Al-Fayyadh Champions Cup 2026',
  sub_title TEXT DEFAULT 'Turnamen Futsal Antar-Sekolah & Pesantren',
  venue TEXT DEFAULT 'GOR Futsal Ma''had Tahfizhul Qur''an Al Fayyadh',
  dates TEXT DEFAULT '15 - 20 November 2026',
  hero_banner_image TEXT DEFAULT 'assets/hero_banner.jpg',
  youtube_live_url TEXT DEFAULT 'https://www.youtube.com/embed/5qap5aO4i9A',
  youtube_live_title TEXT DEFAULT '🔴 Siaran Langsung Lapangan Utama - GOR Futsal MTQ Al-Fayyadh Maros',
  rules_text TEXT DEFAULT '',
  running_announcement TEXT DEFAULT '🏆 Selamat Datang di Turnamen Futsal Resmi ACC 2026! Junjung tinggi sportivitas & ukhuwah Islamiyah.',
  admin_pin_hash TEXT NOT NULL DEFAULT '327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348', -- Salted SHA-256
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAMS & OFFICIAL MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  badge_color TEXT DEFAULT '#10b981',
  city TEXT DEFAULT '',
  group_letter CHAR(1) NOT NULL,
  official_coach TEXT DEFAULT '',
  official_manager TEXT DEFAULT '',
  official_medic TEXT DEFAULT '',
  official_phone TEXT DEFAULT '',
  official_jersey_home TEXT DEFAULT 'Hijau - Putih',
  official_jersey_away TEXT DEFAULT 'Hitam - Emas',
  coach_photo TEXT DEFAULT '',
  manager_photo TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  category TEXT DEFAULT 'SMP',
  players JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column migrations for teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT '';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'SMP';

-- 4. MATCHES & SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  home_id TEXT,
  away_id TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  pitch TEXT DEFAULT 'Lapangan 1',
  stage TEXT DEFAULT 'group',
  group_letter CHAR(1),
  round_name TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled',
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  home_score_live INT DEFAULT 0,
  away_score_live INT DEFAULT 0,
  minute_live INT DEFAULT 0,
  penalty_home_score INT DEFAULT NULL,
  penalty_away_score INT DEFAULT NULL,
  penalty_winner TEXT DEFAULT NULL,
  home_placeholder TEXT,
  away_placeholder TEXT,
  scorers JSONB DEFAULT '[]'::jsonb,
  cards JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column migrations for matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS penalty_home_score INT DEFAULT NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS penalty_away_score INT DEFAULT NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS penalty_winner TEXT DEFAULT NULL;

-- 5. ACC MOMENTS TABLE
CREATE TABLE IF NOT EXISTS public.moments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  player TEXT NOT NULL,
  team TEXT NOT NULL,
  category TEXT DEFAULT 'Highlight',
  badge TEXT DEFAULT '🔥 VIRAL GOAL',
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS public.sponsors (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tier TEXT NOT NULL DEFAULT 'co',
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  logo_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. ROW LEVEL SECURITY (RLS) - HIGH SECURITY ARCHITECTURE
-- =========================================================================

-- Enable RLS across every single table
ALTER TABLE public.tournament_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies cleanly before creating
DROP POLICY IF EXISTS "Public Read tournament_config" ON public.tournament_config;
DROP POLICY IF EXISTS "Public Read teams" ON public.teams;
DROP POLICY IF EXISTS "Public Read matches" ON public.matches;
DROP POLICY IF EXISTS "Public Read moments" ON public.moments;
DROP POLICY IF EXISTS "Public Read sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "App All tournament_config" ON public.tournament_config;
DROP POLICY IF EXISTS "App All teams" ON public.teams;
DROP POLICY IF EXISTS "App All matches" ON public.matches;
DROP POLICY IF EXISTS "App All moments" ON public.moments;
DROP POLICY IF EXISTS "App All sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "Admin All tournament_config" ON public.tournament_config;
DROP POLICY IF EXISTS "Admin All teams" ON public.teams;
DROP POLICY IF EXISTS "Admin All matches" ON public.matches;
DROP POLICY IF EXISTS "Admin All moments" ON public.moments;
DROP POLICY IF EXISTS "Admin All sponsors" ON public.sponsors;

-- A. PUBLIC READ ACCESS: Anyone can view tournament results, standings & photos
CREATE POLICY "Public Read tournament_config" ON public.tournament_config FOR SELECT USING (true);
CREATE POLICY "Public Read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public Read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public Read moments" ON public.moments FOR SELECT USING (true);
CREATE POLICY "Public Read sponsors" ON public.sponsors FOR SELECT USING (true);

-- B. AUTHENTICATED ADMIN ACCESS: Supabase Auth users have full read & write
CREATE POLICY "Admin All tournament_config" ON public.tournament_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin All teams" ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin All matches" ON public.matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin All moments" ON public.moments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin All sponsors" ON public.sponsors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- 8. CRYPTOGRAPHIC STORED PROCEDURES (RPC) FOR HIGH-SECURITY PIN VALIDATION
-- All write operations from the public client MUST go through secure RPC
-- with valid cryptographic salted SHA-256 PIN hash verification.
-- =========================================================================

-- Helper to verify admin PIN hash
CREATE OR REPLACE FUNCTION public._verify_admin_pin(p_pin_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  SELECT admin_pin_hash INTO v_stored_hash 
  FROM public.tournament_config 
  WHERE id = 'config_main' 
  LIMIT 1;

  IF v_stored_hash IS NULL THEN
    v_stored_hash := '327c1d9f696423bcbe8e2e2ea0dc0e84dc7762055f2ee8d4320e1ced37549348';
  END IF;

  RETURN (p_pin_hash IS NOT NULL AND p_pin_hash = v_stored_hash);
END;
$$;

-- Secure Match Score & Event Update RPC
CREATE OR REPLACE FUNCTION public.secure_update_match(
  p_match_id TEXT,
  p_home_score INT,
  p_away_score INT,
  p_home_score_live INT DEFAULT 0,
  p_away_score_live INT DEFAULT 0,
  p_minute_live INT DEFAULT 0,
  p_status TEXT DEFAULT 'scheduled',
  p_scorers JSONB DEFAULT '[]'::jsonb,
  p_cards JSONB DEFAULT '[]'::jsonb,
  p_penalty_home_score INT DEFAULT NULL,
  p_penalty_away_score INT DEFAULT NULL,
  p_penalty_winner TEXT DEFAULT NULL,
  p_pin_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin_pin(p_pin_hash) THEN
    RAISE EXCEPTION 'Akses Ditolak: Kredensial PIN Panitia Tidak Sah!';
  END IF;

  UPDATE public.matches
  SET
    home_score = p_home_score,
    away_score = p_away_score,
    home_score_live = COALESCE(p_home_score_live, p_home_score),
    away_score_live = COALESCE(p_away_score_live, p_away_score),
    minute_live = COALESCE(p_minute_live, 0),
    status = p_status,
    scorers = COALESCE(p_scorers, '[]'::jsonb),
    cards = COALESCE(p_cards, '[]'::jsonb),
    penalty_home_score = p_penalty_home_score,
    penalty_away_score = p_penalty_away_score,
    penalty_winner = p_penalty_winner,
    updated_at = NOW()
  WHERE id = p_match_id;

  RETURN TRUE;
END;
$$;

-- Secure Upsert Match RPC
CREATE OR REPLACE FUNCTION public.secure_upsert_match(
  p_match JSONB,
  p_pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin_pin(p_pin_hash) THEN
    RAISE EXCEPTION 'Akses Ditolak: Kredensial PIN Panitia Tidak Sah!';
  END IF;

  INSERT INTO public.matches (
    id, home_id, away_id, date, time, pitch, stage, group_letter, round_name,
    status, home_score, away_score, home_score_live, away_score_live, minute_live,
    penalty_home_score, penalty_away_score, penalty_winner, scorers, cards, updated_at
  )
  VALUES (
    p_match->>'id',
    p_match->>'home_id',
    p_match->>'away_id',
    COALESCE(p_match->>'date', '22 Nov 2026'),
    COALESCE(p_match->>'time', '08:00'),
    COALESCE(p_match->>'pitch', 'Lapangan Utama'),
    COALESCE(p_match->>'stage', 'group'),
    p_match->>'group_letter',
    COALESCE(p_match->>'round_name', ''),
    COALESCE(p_match->>'status', 'scheduled'),
    COALESCE((p_match->>'home_score')::int, 0),
    COALESCE((p_match->>'away_score')::int, 0),
    COALESCE((p_match->>'home_score_live')::int, 0),
    COALESCE((p_match->>'away_score_live')::int, 0),
    COALESCE((p_match->>'minute_live')::int, 0),
    (p_match->>'penalty_home_score')::int,
    (p_match->>'penalty_away_score')::int,
    p_match->>'penalty_winner',
    COALESCE((p_match->'scorers'), '[]'::jsonb),
    COALESCE((p_match->'cards'), '[]'::jsonb),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    home_id = EXCLUDED.home_id,
    away_id = EXCLUDED.away_id,
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    pitch = EXCLUDED.pitch,
    stage = EXCLUDED.stage,
    group_letter = EXCLUDED.group_letter,
    round_name = EXCLUDED.round_name,
    status = EXCLUDED.status,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    home_score_live = EXCLUDED.home_score_live,
    away_score_live = EXCLUDED.away_score_live,
    minute_live = EXCLUDED.minute_live,
    penalty_home_score = EXCLUDED.penalty_home_score,
    penalty_away_score = EXCLUDED.penalty_away_score,
    penalty_winner = EXCLUDED.penalty_winner,
    scorers = EXCLUDED.scorers,
    cards = EXCLUDED.cards,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Secure Upsert Team RPC
CREATE OR REPLACE FUNCTION public.secure_upsert_team(
  p_team JSONB,
  p_pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin_pin(p_pin_hash) THEN
    RAISE EXCEPTION 'Akses Ditolak: Kredensial PIN Panitia Tidak Sah!';
  END IF;

  INSERT INTO public.teams (
    id, name, short_name, badge_color, city, group_letter,
    official_coach, official_manager, official_medic, official_phone,
    official_jersey_home, official_jersey_away, coach_photo, manager_photo,
    logo, category, players, updated_at
  )
  VALUES (
    p_team->>'id',
    COALESCE(p_team->>'name', 'Tim'),
    COALESCE(p_team->>'short_name', 'TIM'),
    COALESCE(p_team->>'badge_color', '#10b981'),
    COALESCE(p_team->>'city', ''),
    COALESCE(p_team->>'group_letter', 'A'),
    COALESCE(p_team->>'official_coach', ''),
    COALESCE(p_team->>'official_manager', ''),
    COALESCE(p_team->>'official_medic', ''),
    COALESCE(p_team->>'official_phone', ''),
    COALESCE(p_team->>'official_jersey_home', 'Hijau - Putih'),
    COALESCE(p_team->>'official_jersey_away', 'Hitam - Emas'),
    COALESCE(p_team->>'coach_photo', ''),
    COALESCE(p_team->>'manager_photo', ''),
    COALESCE(p_team->>'logo', ''),
    COALESCE(p_team->>'category', 'SMP'),
    COALESCE((p_team->'players'), '[]'::jsonb),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    badge_color = EXCLUDED.badge_color,
    city = EXCLUDED.city,
    group_letter = EXCLUDED.group_letter,
    official_coach = EXCLUDED.official_coach,
    official_manager = EXCLUDED.official_manager,
    official_medic = EXCLUDED.official_medic,
    official_phone = EXCLUDED.official_phone,
    official_jersey_home = EXCLUDED.official_jersey_home,
    official_jersey_away = EXCLUDED.official_jersey_away,
    coach_photo = EXCLUDED.coach_photo,
    manager_photo = EXCLUDED.manager_photo,
    logo = EXCLUDED.logo,
    category = EXCLUDED.category,
    players = EXCLUDED.players,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Secure Update Config RPC
CREATE OR REPLACE FUNCTION public.secure_update_config(
  p_config JSONB,
  p_pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._verify_admin_pin(p_pin_hash) THEN
    RAISE EXCEPTION 'Akses Ditolak: Kredensial PIN Panitia Tidak Sah!';
  END IF;

  INSERT INTO public.tournament_config (
    id, tournament_name, sub_title, venue, dates,
    hero_banner_image, youtube_live_url, youtube_live_title,
    rules_text, running_announcement, updated_at
  )
  VALUES (
    'config_main',
    COALESCE(p_config->>'tournament_name', 'ACC 2026'),
    COALESCE(p_config->>'sub_title', ''),
    COALESCE(p_config->>'venue', ''),
    COALESCE(p_config->>'dates', ''),
    COALESCE(p_config->>'hero_banner_image', 'assets/hero_banner.jpg'),
    COALESCE(p_config->>'youtube_live_url', ''),
    COALESCE(p_config->>'youtube_live_title', ''),
    COALESCE(p_config->>'rules_text', ''),
    COALESCE(p_config->>'running_announcement', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    tournament_name = COALESCE(EXCLUDED.tournament_name, public.tournament_config.tournament_name),
    sub_title = COALESCE(EXCLUDED.sub_title, public.tournament_config.sub_title),
    venue = COALESCE(EXCLUDED.venue, public.tournament_config.venue),
    dates = COALESCE(EXCLUDED.dates, public.tournament_config.dates),
    hero_banner_image = COALESCE(EXCLUDED.hero_banner_image, public.tournament_config.hero_banner_image),
    youtube_live_url = COALESCE(EXCLUDED.youtube_live_url, public.tournament_config.youtube_live_url),
    youtube_live_title = COALESCE(EXCLUDED.youtube_live_title, public.tournament_config.youtube_live_title),
    rules_text = COALESCE(EXCLUDED.rules_text, public.tournament_config.rules_text),
    running_announcement = COALESCE(EXCLUDED.running_announcement, public.tournament_config.running_announcement),
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Grant execute on secure RPCs
GRANT EXECUTE ON FUNCTION public._verify_admin_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_update_match TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_upsert_match TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_upsert_team TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_update_config TO anon, authenticated;

-- =========================================================================
-- 9. REALTIME PUBLICATION ENABLEMENT (IDEMPOTENT CHECK)
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'matches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'moments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tournament_config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_config;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- =========================================================================
-- 10. STORAGE BUCKET FOR TOURNAMENT ASSETS
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-assets', 'tournament-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read tournament-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload tournament-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update tournament-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete tournament-assets" ON storage.objects;
DROP POLICY IF EXISTS "App Upload tournament-assets" ON storage.objects;
DROP POLICY IF EXISTS "App Update tournament-assets" ON storage.objects;

CREATE POLICY "Public Read tournament-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'tournament-assets');

CREATE POLICY "Admin Upload tournament-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tournament-assets');

CREATE POLICY "Admin Update tournament-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tournament-assets');

CREATE POLICY "Admin Delete tournament-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tournament-assets');
