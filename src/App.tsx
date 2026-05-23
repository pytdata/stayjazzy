import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { BookingProvider } from '@/contexts/BookingContext'
import { AdminGuard } from '@/components/common/RouteGuard'

// Layouts
import PublicLayout from '@/components/layouts/PublicLayout'
import AdminLayout from '@/components/layouts/AdminLayout'

// Public pages
import HomePage from '@/pages/HomePage'
import WhoWeArePage from '@/pages/WhoWeArePage'
import OffersPage from '@/pages/OffersPage'
import WorksPage from '@/pages/WorksPage'
import ContactPage from '@/pages/ContactPage'
import CheckBookingPage from '@/pages/CheckBookingPage'
import BookingDashboardPage from '@/pages/BookingDashboardPage'
import FAQsPage from '@/pages/FAQsPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'

// Admin pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage'
import AdminServicesPage from '@/pages/admin/AdminServicesPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import AdminMessagesPage from '@/pages/admin/AdminMessagesPage'
import AdminLogosPage from '@/pages/admin/AdminLogosPage'
import AdminNewsletterPage from '@/pages/admin/AdminNewsletterPage'
import AdminActivityPage from '@/pages/admin/AdminActivityPage'
import AdminChatPage from '@/pages/admin/AdminChatPage'
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage'
import AdminCompanyPage from '@/pages/admin/AdminCompanyPage'
import AdminSEOPage from '@/pages/admin/AdminSEOPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'

// Helper to wrap a page in PublicLayout
const P = (el: React.ReactNode) => <PublicLayout>{el}</PublicLayout>

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <BookingProvider>
          <Routes>
            {/* ── Public pages ───────────────────────────── */}            <Route path="/" element={P(<HomePage />)} />
            <Route path="/who-we-are" element={P(<WhoWeArePage />)} />
            <Route path="/offers" element={P(<OffersPage />)} />
            <Route path="/works" element={P(<WorksPage />)} />
            <Route path="/contact" element={P(<ContactPage />)} />
            <Route path="/check-booking" element={P(<CheckBookingPage />)} />
            <Route path="/booking/:id" element={P(<BookingDashboardPage />)} />
            <Route path="/faqs" element={P(<FAQsPage />)} />
            <Route path="/terms" element={P(<TermsPage />)} />
            <Route path="/privacy" element={P(<PrivacyPage />)} />

            {/* ── Admin login (standalone, no public layout) */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* ── Admin dashboard routes (inside AdminLayout) */}
            <Route path="/admin/*" element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }>
              <Route index element={<AdminOverviewPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="chat" element={<AdminChatPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="logos" element={<AdminLogosPage />} />
              <Route path="newsletter" element={<AdminNewsletterPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="company" element={<AdminCompanyPage />} />
              <Route path="seo" element={<AdminSEOPage />} />
              <Route path="activity" element={<AdminActivityPage />} />
            </Route>

            {/* ── Fallback ─────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </BookingProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
