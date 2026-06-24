export interface Profile {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  role: 'user' | 'admin'
  created_at: string
}

export interface ServicePackage {
  id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  sub_services?: SubService[]
}

export interface SubService {
  id: string
  package_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  pricing_tiers?: PricingTier[]
}

export type TierType = string

export interface PricingTier {
  id: string
  sub_service_id: string
  tier_type: TierType
  price: number
  currency: string
  description: string | null
  created_at: string
  pricing_features?: PricingFeature[]
}

export interface PricingFeature {
  id: string
  tier_id: string
  feature_text: string
  is_included: boolean
  display_order: number
}

export type BookingStatus = 'pending' | 'active' | 'in_progress' | 'review' | 'final_stage' | 'completed' | 'cancelled'
export type BookingStage = 'initial_payment' | 'in_progress' | 'review' | 'final_stage' | 'completed'

export interface SelectedService {
  sub_service_id: string
  sub_service_name: string
  package_name: string
  tier_type: TierType
  tier_name: string
  price: number
  currency: string
}

export interface Booking {
  id: string
  user_email: string
  user_phone: string
  user_name: string | null
  selected_services: SelectedService[]
  status: BookingStatus
  current_stage: BookingStage | null
  notes: string | null
  created_at: string
  updated_at: string
  booking_stage_history?: BookingStageHistory[]
}

export interface BookingStageHistory {
  id: string
  booking_id: string
  stage: BookingStage
  notes: string | null
  updated_by: string | null
  created_at: string
}

export type SenderType = 'admin' | 'user'

export interface BookingChatMessage {
  id: string
  booking_id: string
  sender_type: SenderType
  message: string
  created_at: string
}

export type ContactStatus = 'new' | 'read' | 'responded'

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: ContactStatus
  admin_response: string | null
  created_at: string
}

export interface PortfolioCategory {
  id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface PortfolioWork {
  id: string
  title: string
  category: string | null
  description: string | null
  image_url: string | null
  video_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ClientLogo {
  id: string
  client_name: string
  bw_logo_url: string | null
  colored_logo_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface HeroSlide {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface TeamMember {
  id: string
  name: string
  role: string | null
  bio: string | null
  image_url: string | null
  display_order: number
  created_at: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribed_at: string
}

export interface SiteContent {
  id: string
  section_key: string
  content_value: string | null
  updated_at: string
}

export interface PageView {
  id: string
  page_path: string
  user_identifier: string | null
  created_at: string
}

export interface BookingStageRecord {
  id: string
  booking_id: string
  stage_name: string
  status: string
  notes: string | null
  updated_at: string
}

// ── Chat Types ────────────────────────────────────────────────
export interface ChatConversation {
  id: string
  visitor_id: string
  visitor_name: string | null
  visitor_email: string | null
  visitor_phone: string | null
  ip_address: string | null
  user_agent: string | null
  country: string | null
  country_code: string | null
  city: string | null
  status: 'active' | 'closed' | 'offline_form'
  last_message_at: string | null
  created_at: string
  assigned_admin_id: string | null
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: 'visitor' | 'admin' | 'bot'
  sender_name: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface ChatLead {
  id: string
  full_name: string
  email: string
  phone: string | null
  message: string
  ip_address: string | null
  user_agent: string | null
  country: string | null
  status: 'new' | 'contacted' | 'resolved'
  created_at: string
}

export interface ChatDefaultResponse {
  id: string
  question_pattern: string
  response: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatSettings {
  id: string
  active_start: string
  active_end: string
  timezone: string
  sms_enabled: boolean
  alert_phone: string | null
  alert_email: string | null
  created_at: string
  updated_at: string
}

// ── Payment Types ─────────────────────────────────────────────
export interface PaymentTransaction {
  id: string
  booking_id: string | null
  reference: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'
  gateway: string
  gateway_response: Record<string, unknown> | null
  paid_at: string | null
  created_at: string
}

export interface PaymentRequest {
  id: string
  booking_id: string
  stage_name: string
  percentage: number
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  booking_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  receipt_number: string
  transaction_id: string | null
  invoice_id: string | null
  customer_name: string
  customer_email: string
  amount: number
  currency: string
  payment_method: string | null
  paid_at: string
  created_at: string
}

// ── Company & SEO Settings ────────────────────────────────────
export interface CompanySettings {
  id: string
  name: string
  tagline: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  registration_number: string | null
  tax_number: string | null
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  logo_url: string | null
  signature_urls: string[]
  primary_color: string
  secondary_color: string
  created_at: string
  updated_at: string
}

export interface SEOSettings {
  id: string
  site_title: string
  site_description: string | null
  keywords: string[] | null
  og_image_url: string | null
  twitter_handle: string | null
  google_analytics_id: string | null
  facebook_pixel_id: string | null
  robots_txt: string
  sitemap_enabled: boolean
  canonical_url: string | null
  created_at: string
  updated_at: string
}
