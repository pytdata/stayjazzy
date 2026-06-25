import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  // Redirect to the dedicated login path. Redirecting to "/admin" would be
  // re-captured by this same guard route, causing a silent redirect loop that
  // renders a blank page.
  if (!admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
