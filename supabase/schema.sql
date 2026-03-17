-- ============================================================
-- Web3Work Production Database Schema — v2.1 (Fixed)
-- Compatible with Supabase PostgreSQL (all recent versions)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Drop existing (uncomment only for FRESH reset) ──────────
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS referrals CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS escrows CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS proposals CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS job_status CASCADE;
-- DROP TYPE IF EXISTS proposal_status CASCADE;
-- DROP TYPE IF EXISTS payment_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS subscription_tier CASCADE;
-- DROP TYPE IF EXISTS subscription_status CASCADE;
-- DROP TYPE IF EXISTS escrow_status CASCADE;

-- ─── Enums ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('freelancer', 'employer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft', 'pending_payment', 'active', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('lemon_squeezy', 'busd_bsc', 'stripe');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trialing', 'past_due');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('funded', 'released', 'disputed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email                     TEXT NOT NULL UNIQUE,
  password_hash             TEXT NOT NULL,
  role                      user_role DEFAULT 'freelancer' NOT NULL,
  email_verified            BOOLEAN DEFAULT FALSE NOT NULL,
  email_verification_token  TEXT,
  password_reset_token      TEXT,
  password_reset_expiry     TIMESTAMPTZ,
  is_active                 BOOLEAN DEFAULT TRUE NOT NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  display_name    TEXT NOT NULL,
  bio             TEXT,
  avatar_url      TEXT,
  location        TEXT,
  website         TEXT,
  twitter         TEXT,
  github          TEXT,
  skills          TEXT[],
  hourly_rate     NUMERIC(10,2),
  wallet_address  TEXT,
  referral_code   TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by     UUID REFERENCES users(id),
  total_earnings  NUMERIC(10,2) DEFAULT 0,
  rating          NUMERIC(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                  subscription_tier DEFAULT 'free' NOT NULL,
  status                subscription_status DEFAULT 'active' NOT NULL,
  ls_subscription_id    TEXT,
  ls_customer_id        TEXT,
  ls_variant_id         TEXT,
  ls_order_id           TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  proposals_left        INTEGER DEFAULT 3,
  job_posts_left        INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Jobs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL,
  tags             TEXT[],
  budget_min       NUMERIC(10,2),
  budget_max       NUMERIC(10,2),
  budget_currency  TEXT DEFAULT 'USDT',
  is_fixed         BOOLEAN DEFAULT TRUE,
  experience_level TEXT DEFAULT 'mid',
  deadline         TIMESTAMPTZ,
  status           job_status DEFAULT 'pending_payment' NOT NULL,
  payment_tx_hash  TEXT,
  is_featured      BOOLEAN DEFAULT FALSE,
  view_count       INTEGER DEFAULT 0,
  proposal_count   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Proposals ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter   TEXT NOT NULL,
  bid_amount     NUMERIC(10,2) NOT NULL,
  delivery_days  INTEGER NOT NULL,
  status         proposal_status DEFAULT 'pending' NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, freelancer_id)
);

-- ─── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id         UUID REFERENCES jobs(id),
  amount         NUMERIC(10,2) NOT NULL,
  currency       TEXT DEFAULT 'USD' NOT NULL,
  method         payment_method NOT NULL,
  status         payment_status DEFAULT 'pending' NOT NULL,
  ls_order_id    TEXT,
  ls_checkout_id TEXT,
  tx_hash        TEXT,
  from_wallet    TEXT,
  to_wallet      TEXT,
  description    TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Escrow ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escrows (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  proposal_id       UUID NOT NULL REFERENCES proposals(id),
  employer_id       UUID NOT NULL REFERENCES users(id),
  freelancer_id     UUID NOT NULL REFERENCES users(id),
  amount            NUMERIC(10,2) NOT NULL,
  currency          TEXT DEFAULT 'BUSD',
  status            escrow_status DEFAULT 'funded' NOT NULL,
  contract_address  TEXT,
  fund_tx_hash      TEXT,
  release_tx_hash   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id    UUID NOT NULL REFERENCES users(id),
  receiver_id  UUID NOT NULL REFERENCES users(id),
  job_id       UUID REFERENCES jobs(id),
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id       UUID NOT NULL REFERENCES jobs(id),
  reviewer_id  UUID NOT NULL REFERENCES users(id),
  reviewee_id  UUID NOT NULL REFERENCES users(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, reviewer_id)
);

-- ─── Referrals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id      UUID NOT NULL REFERENCES users(id),
  referred_id      UUID NOT NULL REFERENCES users(id) UNIQUE,
  bonus_amount     NUMERIC(10,2) DEFAULT 0,
  bonus_paid       BOOLEAN DEFAULT FALSE,
  first_payment_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_employer    ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status      ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category    ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_created     ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_job    ON proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_fl     ON proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subs_user        ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recv    ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user      ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_ref     ON profiles(referral_code);

-- ─── Function: updated_at auto-update ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers before recreating (safe re-run)
DROP TRIGGER IF EXISTS users_updated_at         ON users;
DROP TRIGGER IF EXISTS profiles_updated_at      ON profiles;
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS jobs_updated_at          ON jobs;
DROP TRIGGER IF EXISTS proposals_updated_at     ON proposals;
DROP TRIGGER IF EXISTS payments_updated_at      ON payments;
DROP TRIGGER IF EXISTS escrows_updated_at       ON escrows;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER escrows_updated_at
  BEFORE UPDATE ON escrows FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Function: Auto-create profile + subscription on register ─
CREATE OR REPLACE FUNCTION on_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO subscriptions (user_id, tier, status, proposals_left, job_posts_left)
  VALUES (NEW.id, 'free', 'active', 3, 0)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_on_user_created ON users;
CREATE TRIGGER trigger_on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION on_user_created();

-- ─── Function: Update proposal_count on job ──────────────────
CREATE OR REPLACE FUNCTION update_job_proposal_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET proposal_count = proposal_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET proposal_count = GREATEST(proposal_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposal_count ON proposals;
CREATE TRIGGER trigger_proposal_count
  AFTER INSERT OR DELETE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_job_proposal_count();

-- ─── Function: Update profile rating after review ────────────
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating       = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
CREATE TRIGGER trigger_update_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- ─── Row Level Security ───────────────────────────────────────
-- The backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- RLS below protects against direct client queries.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (safe re-run)
DROP POLICY IF EXISTS users_own          ON users;
DROP POLICY IF EXISTS profiles_read      ON profiles;
DROP POLICY IF EXISTS profiles_own       ON profiles;
DROP POLICY IF EXISTS subs_own           ON subscriptions;
DROP POLICY IF EXISTS jobs_public_read   ON jobs;
DROP POLICY IF EXISTS jobs_own_write     ON jobs;
DROP POLICY IF EXISTS proposals_read     ON proposals;
DROP POLICY IF EXISTS proposals_own_write ON proposals;
DROP POLICY IF EXISTS payments_own       ON payments;
DROP POLICY IF EXISTS escrows_own        ON escrows;
DROP POLICY IF EXISTS messages_own       ON messages;
DROP POLICY IF EXISTS reviews_public_read ON reviews;
DROP POLICY IF EXISTS reviews_own_write  ON reviews;
DROP POLICY IF EXISTS notifications_own  ON notifications;
DROP POLICY IF EXISTS referrals_own      ON referrals;

-- Users: only own record
CREATE POLICY users_own ON users
  FOR ALL USING (id = current_setting('app.user_id', true)::UUID);

-- Profiles: public read, own write
CREATE POLICY profiles_read ON profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_own ON profiles
  FOR ALL USING (user_id = current_setting('app.user_id', true)::UUID);

-- Subscriptions: own only
CREATE POLICY subs_own ON subscriptions
  FOR ALL USING (user_id = current_setting('app.user_id', true)::UUID);

-- Jobs: active jobs are public; own jobs always accessible
CREATE POLICY jobs_public_read ON jobs
  FOR SELECT USING (
    status = 'active'
    OR employer_id = current_setting('app.user_id', true)::UUID
  );
CREATE POLICY jobs_own_write ON jobs
  FOR ALL USING (employer_id = current_setting('app.user_id', true)::UUID);

-- Proposals: job owner sees proposals for their jobs; freelancer sees own
CREATE POLICY proposals_read ON proposals
  FOR SELECT USING (
    freelancer_id = current_setting('app.user_id', true)::UUID
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = proposals.job_id
        AND jobs.employer_id = current_setting('app.user_id', true)::UUID
    )
  );
CREATE POLICY proposals_own_write ON proposals
  FOR ALL USING (freelancer_id = current_setting('app.user_id', true)::UUID);

-- Payments: own only
CREATE POLICY payments_own ON payments
  FOR ALL USING (user_id = current_setting('app.user_id', true)::UUID);

-- Escrows: employer or freelancer
CREATE POLICY escrows_own ON escrows
  FOR SELECT USING (
    employer_id   = current_setting('app.user_id', true)::UUID
    OR freelancer_id = current_setting('app.user_id', true)::UUID
  );

-- Messages: sender or receiver
CREATE POLICY messages_own ON messages
  FOR ALL USING (
    sender_id   = current_setting('app.user_id', true)::UUID
    OR receiver_id = current_setting('app.user_id', true)::UUID
  );

-- Reviews: public read, own write
CREATE POLICY reviews_public_read ON reviews
  FOR SELECT USING (true);
CREATE POLICY reviews_own_write ON reviews
  FOR INSERT WITH CHECK (reviewer_id = current_setting('app.user_id', true)::UUID);

-- Notifications: own only
CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = current_setting('app.user_id', true)::UUID);

-- Referrals: own only
CREATE POLICY referrals_own ON referrals
  FOR SELECT USING (referrer_id = current_setting('app.user_id', true)::UUID);

-- ─── Platform Stats View ──────────────────────────────────────
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*)              FROM users         WHERE is_active = TRUE)            AS total_users,
  (SELECT COUNT(*)              FROM jobs          WHERE status = 'active')            AS active_jobs,
  (SELECT COUNT(*)              FROM jobs          WHERE status = 'completed')         AS completed_jobs,
  (SELECT COALESCE(SUM(amount), 0) FROM payments   WHERE status = 'completed')        AS total_revenue,
  (SELECT COUNT(*)              FROM subscriptions WHERE status = 'active'
                                                     AND tier != 'free')               AS paid_subscribers,
  (SELECT COUNT(*)              FROM proposals)                                        AS total_proposals;

-- ─── Revenue by Month function (used by admin dashboard) ─────
CREATE OR REPLACE FUNCTION get_revenue_by_month()
RETURNS TABLE(month TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    SUM(amount) AS revenue
  FROM payments
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at) DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql;

-- ─── Done ──────────────────────────────────────────────────────
-- All tables, indexes, triggers, RLS policies, and views created.
-- Next step: copy your Supabase credentials to .env
-- SUPABASE_URL      → Settings → API → Project URL
-- SUPABASE_ANON_KEY → Settings → API → anon public
-- SUPABASE_SERVICE_ROLE_KEY → Settings → API → service_role (keep secret!)
-- DATABASE_URL      → Settings → Database → Connection string (URI)
