// ============================================================
// API layer — all data access via Supabase
// ============================================================
import { supabase } from './supabase'
import type {
  HeroSlide, ServicePackage, SubService, PricingTier, PricingFeature,
  PortfolioWork, TeamMember, FAQ, ClientLogo, SiteContent,
  NewsletterSubscriber, ContactMessage, Booking, BookingStageRecord,
  ChatMessage, PageView,
} from '@/types/types'

// ─── HERO SLIDES ─────────────────────────────────────────────
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('display_order')
  return (data ?? []) as HeroSlide[]
}
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const { data } = await supabase.from('hero_slides').select('*').order('display_order')
  return (data ?? []) as HeroSlide[]
}
export async function createHeroSlide(slide: Partial<HeroSlide>) {
  return supabase.from('hero_slides').insert(slide)
}
export async function updateHeroSlide(id: string, slide: Partial<HeroSlide>) {
  return supabase.from('hero_slides').update(slide).eq('id', id)
}
export async function deleteHeroSlide(id: string) {
  return supabase.from('hero_slides').delete().eq('id', id)
}

// ─── SERVICE PACKAGES ─────────────────────────────────────────
export async function getServicePackages(): Promise<ServicePackage[]> {
  const { data } = await supabase.from('service_packages').select('*').eq('is_active', true).order('display_order')
  return (data ?? []) as ServicePackage[]
}
export async function getAllServicePackages(): Promise<ServicePackage[]> {
  const { data } = await supabase.from('service_packages').select('*').order('display_order')
  return (data ?? []) as ServicePackage[]
}
export async function createServicePackage(pkg: Partial<ServicePackage>) {
  return supabase.from('service_packages').insert(pkg)
}
export async function updateServicePackage(id: string, pkg: Partial<ServicePackage>) {
  return supabase.from('service_packages').update(pkg).eq('id', id)
}
export async function deleteServicePackage(id: string) {
  return supabase.from('service_packages').delete().eq('id', id)
}

// ─── SUB SERVICES ─────────────────────────────────────────────
export async function getSubServices(packageId: string): Promise<SubService[]> {
  const { data } = await supabase.from('sub_services').select('*').eq('package_id', packageId).eq('is_active', true).order('display_order')
  return (data ?? []) as SubService[]
}
export async function getAllSubServices(packageId: string): Promise<SubService[]> {
  const { data } = await supabase.from('sub_services').select('*').eq('package_id', packageId).order('display_order')
  return (data ?? []) as SubService[]
}
export async function createSubService(sub: Partial<SubService>) {
  return supabase.from('sub_services').insert(sub)
}
export async function updateSubService(id: string, sub: Partial<SubService>) {
  return supabase.from('sub_services').update(sub).eq('id', id)
}
export async function deleteSubService(id: string) {
  return supabase.from('sub_services').delete().eq('id', id)
}

// ─── PRICING TIERS ─────────────────────────────────────────────
export async function getPricingTiers(subServiceId: string): Promise<PricingTier[]> {
  const { data } = await supabase.from('pricing_tiers').select('*').eq('sub_service_id', subServiceId).order('tier_type')
  return (data ?? []) as PricingTier[]
}
export async function createPricingTier(tier: Partial<PricingTier>) {
  return supabase.from('pricing_tiers').insert(tier)
}
export async function updatePricingTier(id: string, tier: Partial<PricingTier>) {
  return supabase.from('pricing_tiers').update(tier).eq('id', id)
}
export async function deletePricingTier(id: string) {
  return supabase.from('pricing_tiers').delete().eq('id', id)
}

// ─── PRICING FEATURES ─────────────────────────────────────────
export async function getPricingFeatures(tierId: string): Promise<PricingFeature[]> {
  const { data } = await supabase.from('pricing_features').select('*').eq('tier_id', tierId).order('display_order')
  return (data ?? []) as PricingFeature[]
}
export async function createPricingFeature(feat: Partial<PricingFeature>) {
  return supabase.from('pricing_features').insert(feat)
}
export async function updatePricingFeature(id: string, feat: Partial<PricingFeature>) {
  return supabase.from('pricing_features').update(feat).eq('id', id)
}
export async function deletePricingFeature(id: string) {
  return supabase.from('pricing_features').delete().eq('id', id)
}

// ─── PORTFOLIO WORKS ─────────────────────────────────────────
export async function getPortfolioWorks(): Promise<PortfolioWork[]> {
  const { data } = await supabase.from('portfolio_works').select('*').eq('is_active', true).order('display_order')
  return (data ?? []) as PortfolioWork[]
}
export async function getAllPortfolioWorks(): Promise<PortfolioWork[]> {
  const { data } = await supabase.from('portfolio_works').select('*').order('display_order')
  return (data ?? []) as PortfolioWork[]
}
export async function createPortfolioWork(work: Partial<PortfolioWork>) {
  return supabase.from('portfolio_works').insert(work)
}
export async function updatePortfolioWork(id: string, work: Partial<PortfolioWork>) {
  return supabase.from('portfolio_works').update(work).eq('id', id)
}
export async function deletePortfolioWork(id: string) {
  return supabase.from('portfolio_works').delete().eq('id', id)
}

// ─── TEAM MEMBERS ─────────────────────────────────────────────
export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data } = await supabase.from('team_members').select('*').order('display_order')
  return (data ?? []) as TeamMember[]
}
export async function createTeamMember(member: Partial<TeamMember>) {
  return supabase.from('team_members').insert(member)
}
export async function updateTeamMember(id: string, member: Partial<TeamMember>) {
  return supabase.from('team_members').update(member).eq('id', id)
}
export async function deleteTeamMember(id: string) {
  return supabase.from('team_members').delete().eq('id', id)
}

// ─── FAQs ──────────────────────────────────────────────────────
export async function getFAQs(): Promise<FAQ[]> {
  const { data } = await supabase.from('faqs').select('*').eq('is_active', true).order('display_order')
  return (data ?? []) as FAQ[]
}
export async function getAllFAQs(): Promise<FAQ[]> {
  const { data } = await supabase.from('faqs').select('*').order('display_order')
  return (data ?? []) as FAQ[]
}
export async function createFAQ(faq: Partial<FAQ>) {
  return supabase.from('faqs').insert(faq)
}
export async function updateFAQ(id: string, faq: Partial<FAQ>) {
  return supabase.from('faqs').update(faq).eq('id', id)
}
export async function deleteFAQ(id: string) {
  return supabase.from('faqs').delete().eq('id', id)
}

// ─── CLIENT LOGOS ─────────────────────────────────────────────
export async function getClientLogos(): Promise<ClientLogo[]> {
  const { data } = await supabase.from('client_logos').select('*').eq('is_active', true).order('display_order')
  return (data ?? []) as ClientLogo[]
}
export async function getAllClientLogos(): Promise<ClientLogo[]> {
  const { data } = await supabase.from('client_logos').select('*').order('display_order')
  return (data ?? []) as ClientLogo[]
}
export async function createClientLogo(logo: Partial<ClientLogo>) {
  return supabase.from('client_logos').insert(logo)
}
export async function updateClientLogo(id: string, logo: Partial<ClientLogo>) {
  return supabase.from('client_logos').update(logo).eq('id', id)
}
export async function deleteClientLogo(id: string) {
  return supabase.from('client_logos').delete().eq('id', id)
}
export async function upsertClientLogo(logo: Partial<ClientLogo>) {
  if (logo.id) return supabase.from('client_logos').update(logo).eq('id', logo.id)
  return supabase.from('client_logos').insert(logo)
}

// ─── SITE CONTENT ─────────────────────────────────────────────
export async function getSiteContent(key: string): Promise<string> {
  const { data } = await supabase.from('site_content').select('content_value').eq('section_key', key).maybeSingle()
  return (data as SiteContent | null)?.content_value ?? ''
}
export async function getAllSiteContent(): Promise<Record<string, string>> {
  const { data } = await supabase.from('site_content').select('section_key, content_value')
  const result: Record<string, string> = {}
  for (const row of (data ?? []) as SiteContent[]) {
    result[row.section_key] = row.content_value ?? ''
  }
  return result
}
export async function upsertSiteContent(key: string, value: string) {
  return supabase.from('site_content').upsert({ section_key: key, content_value: value, updated_at: new Date().toISOString() }, { onConflict: 'section_key' })
}

// ─── NEWSLETTER ────────────────────────────────────────────────
export async function subscribeNewsletter(email: string): Promise<{ alreadyExists: boolean }> {
  const { data: existing } = await supabase.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle()
  if (existing) return { alreadyExists: true }
  await supabase.from('newsletter_subscribers').insert({ email })
  return { alreadyExists: false }
}
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
  return (data ?? []) as NewsletterSubscriber[]
}

// ─── CONTACT MESSAGES ─────────────────────────────────────────
export async function submitContactMessage(msg: Partial<ContactMessage>) {
  return supabase.from('contact_messages').insert(msg)
}
export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  return (data ?? []) as ContactMessage[]
}
export async function getAllContactMessages(): Promise<ContactMessage[]> {
  return getContactMessages()
}
export async function updateContactMessage(id: string, update: Partial<ContactMessage>) {
  return supabase.from('contact_messages').update(update).eq('id', id)
}
export async function deleteContactMessage(id: string) {
  return supabase.from('contact_messages').delete().eq('id', id)
}

// ─── BOOKINGS ─────────────────────────────────────────────────
export async function getBookingByEmailPhone(email: string, phone: string): Promise<Booking | null> {
  const { data } = await supabase.from('bookings').select('*').eq('user_email', email).eq('user_phone', phone).order('created_at', { ascending: false }).limit(1)
  return ((data ?? []) as Booking[])[0] ?? null
}
export async function getBookingByEmailOrPhone(identifier: string): Promise<Booking | null> {
  const { data } = await supabase.from('bookings').select('*').or(`user_email.eq.${identifier},user_phone.eq.${identifier}`).order('created_at', { ascending: false }).limit(1)
  return ((data ?? []) as Booking[])[0] ?? null
}
export async function getBookingById(id: string): Promise<Booking | null> {
  const { data } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  return (data as Booking | null)
}
export async function createBooking(booking: Partial<Booking>): Promise<Booking> {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single()
  if (error) throw error
  return data as Booking
}
export async function updateBooking(id: string, update: Partial<Booking>) {
  return supabase.from('bookings').update({ ...update, updated_at: new Date().toISOString() }).eq('id', id)
}
export async function cancelBooking(id: string) {
  return supabase.from('bookings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id)
}
export async function getAllBookings(): Promise<Booking[]> {
  const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  return (data ?? []) as Booking[]
}

// ─── OTP ──────────────────────────────────────────────────────
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
export async function saveOTP(identifier: string, code: string) {
  await supabase.from('otps').delete().eq('identifier', identifier)
  return supabase.from('otps').insert({ identifier, otp_code: code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
}
export async function verifyOTP(identifier: string, code: string): Promise<boolean> {
  const { data } = await supabase.from('otps').select('otp_code, expires_at').eq('identifier', identifier).maybeSingle()
  if (!data) return false
  const row = data as { otp_code: string; expires_at: string }
  if (row.otp_code !== code) return false
  if (new Date(row.expires_at) < new Date()) return false
  await supabase.from('otps').delete().eq('identifier', identifier)
  return true
}

// ─── CHAT MESSAGES ────────────────────────────────────────────
export async function getChatMessages(bookingId: string): Promise<ChatMessage[]> {
  const { data } = await supabase.from('chat_messages').select('*').eq('booking_id', bookingId).order('created_at')
  return (data ?? []) as ChatMessage[]
}
export async function sendChatMessage(bookingId: string, senderType: 'admin' | 'user', message: string) {
  return supabase.from('chat_messages').insert({ booking_id: bookingId, sender_type: senderType, message })
}
export async function sendChatMessageObj(msg: Partial<ChatMessage>) {
  return supabase.from('chat_messages').insert(msg)
}

// ─── PAGE VIEWS ────────────────────────────────────────────────
export async function trackPageView(path: string, identifier?: string) {
  const id = identifier ?? sessionStorage.getItem('visitor_id') ?? (() => {
    const v = crypto.randomUUID(); sessionStorage.setItem('visitor_id', v); return v
  })()
  return supabase.from('page_views').insert({ page_path: path, user_identifier: id })
}
export async function getPageViews(): Promise<PageView[]> {
  const { data } = await supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(500)
  return (data ?? []) as PageView[]
}

// ─── ADMIN AUTH ────────────────────────────────────────────────
export async function getAdminByEmail(email: string): Promise<{ id: string; email: string; password_hash: string; role: string } | null> {
  const { data } = await supabase.from('admin_accounts').select('id, email, password_hash, role').eq('email', email).maybeSingle()
  return data as { id: string; email: string; password_hash: string; role: string } | null
}

// ─── BOOKING STAGES ───────────────────────────────────────────
export async function getBookingStages(bookingId: string): Promise<BookingStageRecord[]> {
  const { data } = await supabase.from('booking_stages').select('*').eq('booking_id', bookingId).order('updated_at')
  return (data ?? []) as BookingStageRecord[]
}
export async function createBookingStage(stage: Partial<BookingStageRecord>) {
  return supabase.from('booking_stages').insert(stage)
}
export async function updateBookingStage(id: string, stage: Partial<BookingStageRecord>) {
  return supabase.from('booking_stages').update({ ...stage, updated_at: new Date().toISOString() }).eq('id', id)
}

// ─── OVERVIEW STATS ────────────────────────────────────────────
export async function getOverviewStats() {
  const [bookingsRes, messagesRes, newsletterRes, pageViewsRes] = await Promise.all([
    supabase.from('bookings').select('status'),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
    supabase.from('page_views').select('id', { count: 'exact', head: true }),
  ])
  const bookings = (bookingsRes.data ?? []) as Array<{ status: string }>
  return {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    messages: messagesRes.count ?? 0,
    subscribers: newsletterRes.count ?? 0,
    pageViews: pageViewsRes.count ?? 0,
  }
}

// ─── CHAT API ────────────────────────────────────────────────
export async function getChatSettings() {
  const { data } = await supabase.from('chat_settings').select('*').maybeSingle()
  return data
}

export async function getDefaultResponses() {
  const { data } = await supabase.from('chat_default_responses').select('*').eq('is_active', true).order('sort_order')
  return (data ?? []) as import('@/types/types').ChatDefaultResponse[]
}

export async function createConversation(payload: Partial<import('@/types/types').ChatConversation>) {
  const { data, error } = await supabase.from('chat_conversations').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').ChatConversation
}

export async function updateConversation(id: string, payload: Partial<import('@/types/types').ChatConversation>) {
  const { data, error } = await supabase.from('chat_conversations').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').ChatConversation
}

export async function createMessage(payload: Partial<import('@/types/types').ChatMessage>) {
  const { data, error } = await supabase.from('chat_messages').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').ChatMessage
}

export async function getConversations() {
  const { data } = await supabase.from('chat_conversations').select('*').order('last_message_at', { ascending: false })
  return (data ?? []) as import('@/types/types').ChatConversation[]
}

export async function getConversationMessages(conversationId: string) {
  const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
  return (data ?? []) as import('@/types/types').ChatMessage[]
}

export async function getChatLeads() {
  const { data } = await supabase.from('chat_leads').select('*').order('created_at', { ascending: false })
  return (data ?? []) as import('@/types/types').ChatLead[]
}

export async function updateChatLead(id: string, payload: Partial<import('@/types/types').ChatLead>) {
  const { data, error } = await supabase.from('chat_leads').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').ChatLead
}

export async function createDefaultResponse(payload: Partial<import('@/types/types').ChatDefaultResponse>) {
  return supabase.from('chat_default_responses').insert(payload)
}

export async function updateDefaultResponse(id: string, payload: Partial<import('@/types/types').ChatDefaultResponse>) {
  return supabase.from('chat_default_responses').update(payload).eq('id', id)
}

export async function deleteDefaultResponse(id: string) {
  return supabase.from('chat_default_responses').delete().eq('id', id)
}

// ─── PAYMENTS API ────────────────────────────────────────────
export async function createPaymentTransaction(payload: Partial<import('@/types/types').PaymentTransaction>) {
  const { data, error } = await supabase.from('payment_transactions').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').PaymentTransaction
}

export async function getPaymentTransactions() {
  const { data } = await supabase.from('payment_transactions').select('*').order('created_at', { ascending: false })
  return (data ?? []) as import('@/types/types').PaymentTransaction[]
}

export async function createPaymentRequest(payload: Partial<import('@/types/types').PaymentRequest>) {
  const { data, error } = await supabase.from('payment_requests').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').PaymentRequest
}

export async function getPaymentRequests() {
  const { data } = await supabase.from('payment_requests').select('*').order('created_at', { ascending: false })
  return (data ?? []) as import('@/types/types').PaymentRequest[]
}

export async function updatePaymentRequest(id: string, payload: Partial<import('@/types/types').PaymentRequest>) {
  const { data, error } = await supabase.from('payment_requests').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').PaymentRequest
}

// ─── INVOICES & RECEIPTS ─────────────────────────────────────
export async function createInvoice(payload: Partial<import('@/types/types').Invoice>) {
  const { data, error } = await supabase.from('invoices').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').Invoice
}

export async function getInvoices() {
  const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
  return (data ?? []) as import('@/types/types').Invoice[]
}

export async function updateInvoice(id: string, payload: Partial<import('@/types/types').Invoice>) {
  const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').Invoice
}

export async function createReceipt(payload: Partial<import('@/types/types').Receipt>) {
  const { data, error } = await supabase.from('receipts').insert(payload).select().single()
  if (error) throw error
  return data as import('@/types/types').Receipt
}

export async function getReceipts() {
  const { data } = await supabase.from('receipts').select('*').order('created_at', { ascending: false })
  return (data ?? []) as import('@/types/types').Receipt[]
}

// ─── COMPANY & SEO SETTINGS ──────────────────────────────────
export async function getCompanySettings() {
  const { data } = await supabase.from('company_settings').select('*').maybeSingle()
  return data as import('@/types/types').CompanySettings | null
}

export async function updateCompanySettings(id: string, payload: Partial<import('@/types/types').CompanySettings>) {
  const { data, error } = await supabase.from('company_settings').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').CompanySettings
}

export async function getSEOSettings() {
  const { data } = await supabase.from('seo_settings').select('*').maybeSingle()
  return data as import('@/types/types').SEOSettings | null
}

export async function updateSEOSettings(id: string, payload: Partial<import('@/types/types').SEOSettings>) {
  const { data, error } = await supabase.from('seo_settings').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as import('@/types/types').SEOSettings
}

// ─── CHAT ANALYTICS ────────────────────────────────────────
export async function getChatAnalytics() {
  const convs = await getConversations()
  const leads = await getChatLeads()
  const countries: Record<string, number> = {}
  for (const c of convs) {
    const key = c.country || 'Unknown'
    countries[key] = (countries[key] || 0) + 1
  }
  for (const l of leads) {
    const key = l.country || 'Unknown'
    countries[key] = (countries[key] || 0) + 1
  }
  return {
    totalConversations: convs.length,
    activeConversations: convs.filter(c => c.status === 'active').length,
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    countries,
  }
}

// ─── DASHBOARD ANALYTICS ───────────────────────────────────
export async function getAnalytics() {
  const [bookingsRes, messagesRes, newsletterRes, pageViewsRes] = await Promise.all([
    supabase.from('bookings').select('status', { count: 'exact' }),
    supabase.from('contact_messages').select('*', { count: 'exact' }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact' }),
    supabase.from('page_views').select('*', { count: 'exact' }),
  ])
  const { data: bookings } = await supabase.from('bookings').select('status')
  return {
    total: bookings?.length ?? 0,
    active: bookings?.filter(b => b.status === 'active').length ?? 0,
    completed: bookings?.filter(b => b.status === 'completed').length ?? 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled').length ?? 0,
    messages: messagesRes.count ?? 0,
    subscribers: newsletterRes.count ?? 0,
    pageViews: pageViewsRes.count ?? 0,
  }
}

// ─── IMAGE UPLOAD ──────────────────────────────────────────
export async function uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
  const path = `${folder}/${name}`
  const { error } = await supabase.storage.from('public').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('public').getPublicUrl(path)
  return data.publicUrl
}
