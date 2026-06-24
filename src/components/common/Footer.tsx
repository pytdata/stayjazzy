import newLogo from "@/assets/new-logo.png";
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeNewsletter } from '@/db/api'
import { toast } from 'sonner'

const PAGE_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Who We Are', path: '/who-we-are' },
  { label: 'Offers', path: '/offers' },
  { label: 'Works', path: '/works' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Check Booking', path: '/check-booking' },
  { label: 'FAQs', path: '/faqs' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      const result = await subscribeNewsletter(email.trim())
      if (result.alreadyExists) toast.info('You are already subscribed!')
      else { toast.success('Subscribed successfully!'); setEmail('') }
    } catch { toast.error('Failed to subscribe. Please try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <footer className="relative text-white overflow-hidden" style={{ backgroundColor: 'hsl(337 92% 15%)' }}>
      {/* Background image with faded overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1491cfa-3e23-4625-840d-c050a93c1d6c.jpg)` }}
        aria-hidden="true"
      />
      {/* Gradient overlay: left edge darker, right slightly lighter */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#470126]/90 via-[#470126]/80 to-[#6b0238]/70 pointer-events-none" aria-hidden="true" />

      {/* Top section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Logo + description */}
        <div>
          <img
            src="https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg"
            alt="Stay Jazzy Multimedia"
            className="h-12 w-auto object-contain mb-4 brightness-0 invert"
          />
          <p className="text-sm text-white/70 leading-relaxed text-pretty">
            Stay Jazzy Multimedia — a multimedia firm established in 2012, specializing in business promotion, photography, videography, branding, and digital marketing.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-[#f7b808] hover:text-black transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-[#f7b808] hover:text-black transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-[#f7b808] hover:text-black transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
            </a>
          </div>
        </div>

        {/* Column 2: Pages */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest text-[#f7b808] mb-4">Quick Links</h4>
          <ul className="space-y-2">
            {PAGE_LINKS.map(link => (
              <li key={link.path}>
                <Link to={link.path} className="text-sm text-white/70 hover:text-[#f7b808] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest text-[#f7b808] mb-4">Contact Us</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-white/70">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#f7b808]" />
              <span>Accra, Ghana</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-white/70">
              <Phone className="h-4 w-4 shrink-0 text-[#f7b808]" />
              <a href="tel:+233000000000" className="hover:text-white transition-colors">+233 000 000 000</a>
            </li>
            <li className="flex items-center gap-2 text-sm text-white/70">
              <Mail className="h-4 w-4 shrink-0 text-[#f7b808]" />
              <a href="mailto:info@stayjazzy.com" className="hover:text-white transition-colors">info@stayjazzy.com</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest text-[#f7b808] mb-4">Newsletter</h4>
          <p className="text-sm text-white/70 mb-4 text-pretty">Subscribe for updates, offers, and news from Stay Jazzy Multimedia.</p>
          <form onSubmit={handleNewsletter} className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 flex-1 focus:border-[#f7b808]"
            />
            <Button type="submit" disabled={submitting} size="icon" className="bg-[#f7b808] hover:bg-[#f7d409] text-black shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Stay Jazzy Multimedia. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white/80 transition-colors">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
