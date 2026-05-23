
-- Enable RLS + open anon policies for all public-read and app-write tables
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Public read-only tables
CREATE POLICY "anon_read_hero" ON hero_slides FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_content" ON site_content FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_team" ON team_members FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_packages" ON service_packages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_subservices" ON sub_services FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_tiers" ON pricing_tiers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_features" ON pricing_features FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_works" ON portfolio_works FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_logos" ON client_logos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_faqs" ON faqs FOR SELECT TO anon USING (true);

-- Admin full-access via anon key (app manages auth in-app)
CREATE POLICY "anon_all_hero" ON hero_slides FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_content" ON site_content FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_team" ON team_members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_packages" ON service_packages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_subservices" ON sub_services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tiers" ON pricing_tiers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_features" ON pricing_features FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_works" ON portfolio_works FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_logos" ON client_logos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_faqs" ON faqs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_bookings" ON bookings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_chat" ON chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contact" ON contact_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_newsletter" ON newsletter_subscribers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_pageviews" ON page_views FOR ALL TO anon USING (true) WITH CHECK (true);
