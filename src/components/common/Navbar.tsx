import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/contexts/BookingContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import { cn } from '@/lib/utils'

const NAV_KEYS = [
  { key: 'home', path: '/' },
  { key: 'whoWeAre', path: '/who-we-are' },
  { key: 'offers', path: '/offers' },
  { key: 'works', path: '/works' },
  { key: 'contact', path: '/contact' },
  { key: 'checkBooking', path: '/check-booking' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { selectedServices } = useBooking()
  const { t } = useLanguage()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  const isTransparent = isHome && !scrolled

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm shadow-md'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg"
              alt="Stay Jazzy Multimedia"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_KEYS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isTransparent
                    ? 'text-white hover:text-white/80'
                    : 'text-foreground hover:text-primary',
                  location.pathname === link.path && (isTransparent ? 'text-white underline underline-offset-4' : 'text-primary font-semibold')
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* CTA + Language */}
          <div className="flex items-center gap-2">
            <div className={cn('hidden sm:block', isTransparent ? 'text-white' : 'text-foreground')}>
              <LanguageSwitcher />
            </div>
            <Link to="/offers">
              <Button
                size="sm"
                className={cn(
                  'text-sm font-semibold transition-all hidden sm:flex items-center gap-1.5',
                  isTransparent
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                {t('bookAppointment')}
                {selectedServices.length > 0 && (
                  <span className="ml-1 bg-[#f7b808] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {selectedServices.length}
                  </span>
                )}
              </Button>
            </Link>
            {/* Mobile book button */}
            <Link to="/offers" className="sm:hidden">
              <Button size="sm" className="bg-primary text-primary-foreground px-3 py-2 relative">
                <ShoppingBag className="h-4 w-4" />
                {selectedServices.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#f7b808] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {selectedServices.length}
                  </span>
                )}
              </Button>
            </Link>
            {/* Hamburger */}
            <button
              className={cn('lg:hidden p-2 rounded-md', isTransparent ? 'text-white' : 'text-foreground')}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col pt-20 pb-6 px-6"
            onClick={e => e.stopPropagation()}
          >
            {NAV_KEYS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'py-3 border-b border-border text-base font-medium text-foreground hover:text-primary transition-colors',
                  location.pathname === link.path && 'text-primary font-semibold'
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="py-3 border-b border-border">
              <LanguageSwitcher />
            </div>
            <Link to="/offers" className="mt-6">
              <Button className="w-full bg-primary text-primary-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                {t('bookAppointment')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
