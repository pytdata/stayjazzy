
-- Admin accounts table (separate from profiles)
CREATE TABLE admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- OTP store
CREATE TABLE otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Booking stages (progress tracking)
CREATE TABLE booking_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read" ON admin_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "otp_all" ON otps FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "booking_stages_all" ON booking_stages FOR ALL TO anon USING (true) WITH CHECK (true);
