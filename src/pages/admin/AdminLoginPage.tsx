import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'
import { API_BASE } from '@/lib/apiBase'

export default function AdminLoginPage() {
  const { signIn, admin } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (admin) { navigate('/admin', { replace: true }); return null }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { toast.error(error); setLoading(false); return }
    toast.success('Welcome back!')
    navigate('/admin', { replace: true })
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error()
      toast.success('OTP sent to your email')
      setMode('verify')
    } catch (err) {
      toast.error('Failed to send OTP')
    }
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to verify')
      }
      toast.success('Password reset successfully')
      setMode('login')
      setPassword(newPassword)
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg"
            alt="Stay Jazzy Multimedia"
            className="h-14 w-auto object-contain mx-auto mb-4 brightness-0 invert"
          />
          <p className="text-white/60 text-sm">Admin Portal</p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-center text-white flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" /> 
              {mode === 'login' && 'Sign In'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'verify' && 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="al-email" className="text-white/70">Email Address</Label>
                  <Input id="al-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="admin@stayjazzymultimedia.com" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="al-pw" className="text-white/70">Password</Label>
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <Input id="al-pw" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="••••••••" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground mt-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Sign In
                </Button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="al-email" className="text-white/70">Email Address</Label>
                  <Input id="al-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="admin@stayjazzymultimedia.com" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="ghost" onClick={() => setMode('login')} className="flex-1 border border-white/60 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Send OTP
                  </Button>
                </div>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="al-otp" className="text-white/70">OTP from Email</Label>
                  <Input id="al-otp" type="text" required value={otp} onChange={e => setOtp(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="123456" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="al-npw" className="text-white/70">New Password</Label>
                  <Input id="al-npw" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="al-cpw" className="text-white/70">Confirm Password</Label>
                  <Input id="al-cpw" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="••••••••" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="ghost" onClick={() => setMode('login')} className="flex-1 border border-white/60 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Verify & Reset
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
