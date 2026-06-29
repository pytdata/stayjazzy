// ============================================================
// Database schema bootstrap
// ------------------------------------------------------------
// Creates every table the application expects (idempotently) and
// seeds the singleton/default rows the admin dashboard needs.
//
// This runs automatically on server start and lazily on the first
// DB request, so a fresh deployment provisions its own schema
// without a manual migration step.
// ============================================================
import bcrypt from 'bcryptjs'
import { query } from './db.js'

const SCHEMA_SQL = `
-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Admins ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  reset_otp TEXT,
  reset_otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- admins table may pre-exist (created by the legacy auto-seed) without a role column
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';

-- ── Service catalogue ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES service_packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_service_id UUID REFERENCES sub_services(id) ON DELETE CASCADE,
  tier_type TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  is_included BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

-- ── Portfolio ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Marketing content ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  bw_logo_url TEXT,
  colored_logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  content_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audience / leads ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_source TEXT DEFAULT 'subscriber',
  status TEXT DEFAULT 'pending',
  message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT,
  user_identifier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bookings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_phone TEXT,
  user_name TEXT,
  selected_services JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  current_stage TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stage_name TEXT,
  status TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── OTP ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_admin_id UUID
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  booking_id UUID,
  sender_type TEXT,
  sender_name TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_default_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_pattern TEXT NOT NULL,
  response TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_start TEXT DEFAULT '09:00',
  active_end TEXT DEFAULT '17:00',
  timezone TEXT DEFAULT 'Africa/Accra',
  sms_enabled BOOLEAN DEFAULT FALSE,
  alert_phone TEXT,
  alert_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  reference TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending',
  gateway TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  stage_name TEXT,
  percentage NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  payment_method TEXT DEFAULT 'paystack',
  offline_instructions TEXT,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paystack';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS offline_instructions TEXT;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  booking_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  payment_method TEXT DEFAULT 'paystack',
  payment_details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paystack';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT,
  transaction_id UUID,
  invoice_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  payment_method TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Company & SEO settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Stay Jazzy Multimedia',
  tagline TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  registration_number TEXT,
  tax_number TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  merchant_momo_name TEXT,
  merchant_momo_number TEXT,
  logo_url TEXT,
  header_logo_height INTEGER DEFAULT 48,
  menu_logo_height INTEGER DEFAULT 48,
  footer_logo_height INTEGER DEFAULT 48,
  admin_logo_height INTEGER DEFAULT 40,
  signature_urls JSONB DEFAULT '[]'::jsonb,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS header_logo_height INTEGER DEFAULT 48;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS menu_logo_height INTEGER DEFAULT 48;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS footer_logo_height INTEGER DEFAULT 48;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS admin_logo_height INTEGER DEFAULT 40;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS merchant_momo_name TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS merchant_momo_number TEXT;

CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT DEFAULT 'Stay Jazzy Multimedia',
  site_description TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  og_image_url TEXT,
  twitter_handle TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /',
  sitemap_enabled BOOLEAN DEFAULT TRUE,
  canonical_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Helpful indexes ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sub_services_package ON sub_services(package_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sub_service ON pricing_tiers(sub_service_id);
CREATE INDEX IF NOT EXISTS idx_pricing_features_tier ON pricing_features(tier_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_stages_booking ON booking_stages(booking_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps(identifier);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_campaign ON newsletter_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_subscribed);
`

const ADMIN_USERS = [
  { email: 'admin@stayjazzymultimedia.com', password: 'admin@123', role: 'admin' },
  { email: 'super@stajazzymultimedia.com', password: '#6@7I[v3!6_ndj_s==', role: 'admin' },
]

// Seed the singleton/default rows the admin dashboard expects to find.
const seedDefaults = async () => {
  // Default admin user
  for (const admin of ADMIN_USERS) {
    const hash = await bcrypt.hash(admin.password, 10)
    await query(
      `INSERT INTO admins (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [admin.email, hash, admin.role]
    )
  }

  // Singleton settings rows (the admin pages edit a single existing row)
  await query(`INSERT INTO chat_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM chat_settings)`)
  await query(`INSERT INTO company_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM company_settings)`)
  await query(`INSERT INTO seo_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM seo_settings)`)
}

let schemaPromise = null

// Split the DDL into individual statements and strip comment-only lines.
const splitStatements = (sql) =>
  sql
    .split(';')
    .map((stmt) =>
      stmt
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((stmt) => stmt.length > 0)

// Run each DDL statement independently so a single failure (e.g. a missing
// CREATE EXTENSION privilege) cannot abort the whole batch — every statement
// is idempotent, so partial progress is safe and the rest still apply.
const runSchema = async () => {
  const statements = splitStatements(SCHEMA_SQL)
  let failures = 0
  for (const stmt of statements) {
    try {
      await query(stmt)
    } catch (err) {
      failures++
      console.error('Schema statement failed (continuing):', err.message, '\n  >', stmt.split('\n')[0])
    }
  }
  if (failures > 0) {
    console.warn(`Schema applied with ${failures} statement failure(s).`)
  }
}

// Always runs the DDL + default seed (bypasses the per-process cache).
// Used by the manual /api/migrate endpoint so it can be re-triggered on demand.
export const migrate = async () => {
  await runSchema()
  await seedDefaults()
  console.log('Database schema migrated (tables + defaults)')
}

// Idempotent. Runs the DDL + default seed exactly once per process.
export const ensureSchema = () => {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await runSchema()
      await seedDefaults()
      console.log('Database schema ensured (tables + defaults)')
    })().catch((err) => {
      // Reset so a later request can retry after a transient failure
      schemaPromise = null
      console.error('Schema bootstrap failed:', err.message)
      throw err
    })
  }
  return schemaPromise
}
