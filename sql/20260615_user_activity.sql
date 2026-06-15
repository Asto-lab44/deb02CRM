-- ════════════════════════════════════════════════════════════════════
-- Migration : Activity tracking (sessions + errors + page views minimal)
-- Tuile "Temps & Activités" — détection blocages et collaborateurs idle
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. SESSIONS UTILISATEUR
-- ─────────────────────────────────────────────────────────────────
-- Une ligne par session de travail (du login à la fermeture/timeout).
CREATE TABLE IF NOT EXISTS user_sessions (
  id              text PRIMARY KEY,                       -- SES-{timestamp}{rand}
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name       text,
  user_email      text,

  started_at      timestamptz NOT NULL DEFAULT now(),
  last_activity   timestamptz NOT NULL DEFAULT now(),     -- heartbeat toutes les 60s
  ended_at        timestamptz,
  end_reason      text,                                   -- 'logout' | 'timeout' | 'closed' | 'browser_close'

  -- Verrouillage écran (page hidden via Visibility API)
  is_locked       boolean NOT NULL DEFAULT false,
  locked_at       timestamptz,
  total_locked_s  integer NOT NULL DEFAULT 0,             -- cumul secondes verrouillées

  -- Métadonnées
  user_agent      text,
  ip_hash         text,                                   -- haché pour RGPD
  platform        text,                                   -- Windows / Mac / Linux / iOS / Android
  browser         text,                                   -- Chrome / Firefox / Safari / Edge

  -- Compteurs
  page_views      integer NOT NULL DEFAULT 1,
  errors_count    integer NOT NULL DEFAULT 0,

  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user      ON user_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active    ON user_sessions(last_activity DESC) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_started   ON user_sessions(started_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- 2. ÉVÉNEMENTS UTILISATEUR (lock, unlock, error, page_view, login, logout)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id              text PRIMARY KEY,                       -- EVT-{ts}{rand}
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name       text,
  user_email      text,
  session_id      text REFERENCES user_sessions(id) ON DELETE CASCADE,

  type            text NOT NULL,                          -- login/logout/lock/unlock/error/page_view/idle_timeout
  severity        text DEFAULT 'info',                    -- info/warn/error
  path            text,                                   -- /crm, /gestion-commerciale, etc.
  message         text,                                   -- court résumé human-readable

  -- Pour les erreurs : stack + détails
  error_type      text,
  error_stack     text,
  error_url       text,                                   -- fichier source de l'erreur
  error_line      integer,

  payload         jsonb DEFAULT '{}'::jsonb,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_time   ON user_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session     ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type        ON user_events(type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity    ON user_events(severity, occurred_at DESC) WHERE severity IN ('warn','error');
CREATE INDEX IF NOT EXISTS idx_events_path        ON user_events(path);

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — Tous les utilisateurs authentifiés peuvent LIRE tout
--          mais INSÉRER uniquement leurs propres lignes
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_read_all   ON user_sessions;
DROP POLICY IF EXISTS sessions_insert_own ON user_sessions;
DROP POLICY IF EXISTS sessions_update_own ON user_sessions;
DROP POLICY IF EXISTS events_read_all     ON user_events;
DROP POLICY IF EXISTS events_insert_own   ON user_events;

CREATE POLICY sessions_read_all   ON user_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY sessions_insert_own ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_update_own ON user_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY events_read_all     ON user_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY events_insert_own   ON user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. RPC : heartbeat — met à jour last_activity sans réécrire toute la ligne
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION activity_heartbeat(p_session_id text)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE user_sessions
     SET last_activity = now()
   WHERE id = p_session_id
     AND user_id = auth.uid()
     AND ended_at IS NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC : vue agrégée pour le dashboard (online users, idle counts, etc.)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION activity_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  result jsonb;
BEGIN
  WITH active_sessions AS (
    SELECT * FROM user_sessions
     WHERE ended_at IS NULL
       AND last_activity > now() - interval '5 minutes'
  )
  SELECT jsonb_build_object(
    'online_now',     (SELECT count(*) FROM active_sessions),
    'locked_now',     (SELECT count(*) FROM active_sessions WHERE is_locked),
    'sessions_today', (SELECT count(*) FROM user_sessions WHERE started_at > current_date),
    'events_today',   (SELECT count(*) FROM user_events  WHERE occurred_at > current_date),
    'errors_today',   (SELECT count(*) FROM user_events  WHERE severity = 'error' AND occurred_at > current_date)
  ) INTO result;
  RETURN result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Vérifier après exécution :
-- SELECT count(*) FROM user_sessions;
-- SELECT count(*) FROM user_events;
-- SELECT activity_dashboard_stats();
-- ═══════════════════════════════════════════════════════════════════
