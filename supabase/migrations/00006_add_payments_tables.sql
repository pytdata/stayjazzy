
-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed','cancelled')),
  gateway TEXT DEFAULT 'paystack',
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment requests (admin requests % from customer)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  payment_method TEXT,
  paid_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company settings (for invoices/receipts/website)
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
  logo_url TEXT,
  signature_urls TEXT[] DEFAULT '{}',
  primary_color TEXT DEFAULT '#166534',
  secondary_color TEXT DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SEO settings
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT DEFAULT 'Stay Jazzy Multimedia',
  site_description TEXT,
  keywords TEXT[],
  og_image_url TEXT,
  twitter_handle TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  robots_txt TEXT DEFAULT 'User-agent: *\nDisallow: /admin\nAllow: /',
  sitemap_enabled BOOLEAN DEFAULT true,
  canonical_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert defaults
INSERT INTO company_settings (id, name)
SELECT gen_random_uuid(), 'Stay Jazzy Multimedia'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

INSERT INTO seo_settings (id, site_title)
SELECT gen_random_uuid(), 'Stay Jazzy Multimedia'
WHERE NOT EXISTS (SELECT 1 FROM seo_settings);
