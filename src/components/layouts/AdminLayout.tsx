import newLogo from "@/assets/new-logo.png";
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Settings, Image, MessageSquare, Star,
  Mail, Activity, LogOut, Menu, X, MessageCircle, CreditCard, Building2, Globe, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
  { label: 'Services', path: '/admin/services', icon: Settings },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Live Chat', path: '/admin/chat', icon: MessageCircle },
  { label: 'Content', path: '/admin/content', icon: Image },
  { label: 'Messages', path: '/admin/messages', icon: MessageSquare },
  { label: 'Client Logos', path: '/admin/logos', icon: Star },
  { label: 'Newsletter', path: '/admin/newsletter', icon: Mail },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Company', path: '/admin/company', icon: Building2 },
  { label: 'SEO', path: '/admin/seo', icon: Globe },
  { label: 'Activity', path: '/admin/activity', icon: Activity },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { admin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/admin')
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <img
          src="https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg"
          alt="Stay Jazzy"
          className="h-10 w-auto object-contain brightness-0 invert mb-2"
        />
        <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 mb-3">
          <p className="text-xs text-sidebar-foreground/60">Logged in as</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">{admin?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-10">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Admin Dashboard</span>
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto p-2 rounded-md hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
