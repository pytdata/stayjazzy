import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { getAdminByEmail } from '@/db/api'
import { toast } from 'sonner'
import { API_BASE } from '@/lib/apiBase'

// ── Simple SHA-256 for password verification ──────────────────
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── JWT decode (no verify — admin credentials stored locally) ─
function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

const ADMIN_KEY = 'sj_admin_token'

interface AdminUser { id: string; email: string; role: string }
interface AuthContextValue {
  admin: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  admin: null, loading: true,
  signIn: async () => ({ error: null }),
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFromStorage = useCallback(() => {
    const token = sessionStorage.getItem(ADMIN_KEY)
    if (!token) { setLoading(false); return }
    const payload = decodeJwt(token)
    if (!payload || payload.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(ADMIN_KEY)
      setLoading(false)
      return
    }
    setAdmin({ id: payload.sub, email: payload.email, role: payload.role })
    setLoading(false)
  }, [])

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const err = await res.json()
        return { error: err.error || 'Login failed' }
      }
      const data = await res.json()
      sessionStorage.setItem(ADMIN_KEY, data.token)
      setAdmin({ id: data.user.id, email: data.user.email, role: 'admin' })
      return { error: null }
    } catch (e) {
      return { error: 'Network error' }
    }
  }

  const signOut = () => {
    sessionStorage.removeItem(ADMIN_KEY)
    setAdmin(null)
    toast.success('Logged out successfully')
  }

  return <AuthContext.Provider value={{ admin, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
