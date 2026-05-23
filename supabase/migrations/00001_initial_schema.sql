
-- Enums
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'active', 'in_progress', 'review', 'final_stage', 'completed', 'cancelled');
CREATE TYPE public.booking_stage AS ENUM ('initial_payment', 'in_progress', 'review', 'final_stage', 'completed');
CREATE TYPE public.tier_type AS ENUM ('gold', 'diamond', 'platinum');
CREATE TYPE public.contact_status AS ENUM ('new', 'read', 'responded');
CREATE TYPE public.sender_type AS ENUM ('admin', 'user');

-- Profiles (synced with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (NEW.id, NEW.email, NEW.phone, 'user'::public.user_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- public view for profiles
CREATE VIEW public.public_profiles AS
  SELECT id, role FROM public.profiles;

-- Service Packages
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active service packages" ON public.service_packages FOR SELECT USING (true);
CREATE POLICY "Admin can manage service packages" ON public.service_packages FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Sub Services
CREATE TABLE public.sub_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sub_services" ON public.sub_services FOR SELECT USING (true);
CREATE POLICY "Admin can manage sub_services" ON public.sub_services FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Pricing Tiers
CREATE TABLE public.pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_service_id uuid NOT NULL REFERENCES public.sub_services(id) ON DELETE CASCADE,
  tier_type tier_type NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing_tiers" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Admin can manage pricing_tiers" ON public.pricing_tiers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Pricing Features
CREATE TABLE public.pricing_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL REFERENCES public.pricing_tiers(id) ON DELETE CASCADE,
  feature_text text NOT NULL,
  is_included boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing_features" ON public.pricing_features FOR SELECT USING (true);
CREATE POLICY "Admin can manage pricing_features" ON public.pricing_features FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_phone text NOT NULL,
  user_name text,
  selected_services jsonb NOT NULL DEFAULT '[]',
  status booking_status NOT NULL DEFAULT 'pending',
  current_stage booking_stage,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage all bookings" ON public.bookings FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Anon can read booking by phone or email" ON public.bookings FOR SELECT USING (true);

-- Booking Stage History
CREATE TABLE public.booking_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stage booking_stage NOT NULL,
  notes text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read booking_stage_history" ON public.booking_stage_history FOR SELECT USING (true);
CREATE POLICY "Admin can manage booking_stage_history" ON public.booking_stage_history FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Anon can read stage history" ON public.booking_stage_history FOR SELECT USING (true);

-- Chat Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage chat messages" ON public.chat_messages FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Contact Messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status contact_status NOT NULL DEFAULT 'new',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Portfolio Works
CREATE TABLE public.portfolio_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  description text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read portfolio_works" ON public.portfolio_works FOR SELECT USING (true);
CREATE POLICY "Admin can manage portfolio_works" ON public.portfolio_works FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Client Logos
CREATE TABLE public.client_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  bw_logo_url text,
  colored_logo_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read client_logos" ON public.client_logos FOR SELECT USING (true);
CREATE POLICY "Admin can manage client_logos" ON public.client_logos FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Newsletter Subscribers
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Subscribers can view own sub" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (true);

-- Site Content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content_value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin can manage site_content" ON public.site_content FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Hero Slides
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hero_slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Admin can manage hero_slides" ON public.hero_slides FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Team Members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  bio text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admin can manage team_members" ON public.team_members FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Page Views
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  user_identifier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page_views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view page_views" ON public.page_views FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- FAQs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admin can manage faqs" ON public.faqs FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Enable Realtime for chat_messages and bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('media', 'media', true, 10485760);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('client-logos', 'client-logos', true, 5242880);

CREATE POLICY "Public can read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admin can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Admin can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Public can read client-logos" ON storage.objects FOR SELECT USING (bucket_id = 'client-logos');
CREATE POLICY "Admin can upload client-logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-logos' AND get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Admin can delete client-logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-logos' AND get_user_role(auth.uid()) = 'admin'::user_role);
