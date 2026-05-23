
-- Chat conversations for visitors
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL, -- unique browser fingerprint/session
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','closed','offline_form')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  assigned_admin_id UUID REFERENCES admin_accounts(id) ON DELETE SET NULL
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor','admin','bot')),
  sender_name TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offline form submissions (chat off-hours)
CREATE TABLE IF NOT EXISTS chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','resolved')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Default Q&A (auto-responses)
CREATE TABLE IF NOT EXISTS chat_default_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_pattern TEXT NOT NULL,
  response TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat settings (hours, alert config)
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_start TIME DEFAULT '06:00',
  active_end TIME DEFAULT '22:00',
  timezone TEXT DEFAULT 'Africa/Accra',
  sms_enabled BOOLEAN DEFAULT true,
  alert_phone TEXT DEFAULT '+233557071141',
  alert_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default chat settings
INSERT INTO chat_settings (id, active_start, active_end, timezone, sms_enabled, alert_phone)
VALUES (gen_random_uuid(), '06:00', '22:00', 'Africa/Accra', true, '+233557071141')
ON CONFLICT DO NOTHING;
