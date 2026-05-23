import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const { signIn, admin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (admin) { navigate('/admin', { replace: true }); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { toast.error(error); setLoading(false); return }
    toast.success('Welcome back!')
    navigate('/admin', { replace: true })
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
          <CardHeader><CardTitle className="text-center text-white flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Sign In</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="al-email" className="text-white/70">Email Address</Label>
                <Input id="al-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="admin@stayjazzy.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="al-pw" className="text-white/70">Password</Label>
                <Input id="al-pw" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
