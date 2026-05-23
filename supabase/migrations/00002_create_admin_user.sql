
-- Create admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@stayjazzy.com',
  crypt('StayJazzy@2024!', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Stay Jazzy Admin","role":"admin"}'::jsonb
);

-- Create admin profile
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@stayjazzy.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
