-- ── chat_conversations ──────────────────────────────────────
CREATE POLICY "anon_insert_conversations" ON chat_conversations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select_own_conversation" ON chat_conversations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_update_own_conversation" ON chat_conversations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ── chat_settings (read-only for visitors) ──────────────────
CREATE POLICY "anon_select_chat_settings" ON chat_settings
  FOR SELECT TO anon, authenticated USING (true);

-- ── chat_default_responses (read-only for visitors) ─────────
CREATE POLICY "anon_select_defaults" ON chat_default_responses
  FOR SELECT TO anon, authenticated USING (true);

-- ── chat_leads (visitors can insert offline form) ───────────
CREATE POLICY "anon_insert_leads" ON chat_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select_own_leads" ON chat_leads
  FOR SELECT TO anon, authenticated USING (true);