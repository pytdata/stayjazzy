import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBooking } from '@/contexts/BookingContext'
import { createBooking, generateOTP, getBookingByEmailPhone, saveOTP, sendOTPEmail, verifyOTP } from '@/db/api'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

type Step = 'info' | 'otp' | 'done'

interface BookingModalProps { open: boolean; onClose: () => void }

export default function BookingModal({ open, onClose }: BookingModalProps) {
  const { selectedServices, clearServices, setCurrentBookingId, setBookingToken } = useBooking()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('info')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedServices.length === 0) { toast.error('Please select at least one service first'); return }
    setLoading(true)
    try {
      let bid: string
      const existing = await getBookingByEmailPhone(email.trim(), phone.trim())
      if (existing && existing.status !== 'cancelled') {
        bid = existing.id
      } else {
        const newBk = await createBooking({ user_email: email.trim(), user_phone: phone.trim(), user_name: name.trim() || undefined, selected_services: selectedServices })
        bid = newBk.id
      }
      setBookingId(bid)
      const code = generateOTP()
      await saveOTP(email.trim(), code)
      await sendOTPEmail(email.trim(), code, 'booking verification')
      toast.success('OTP sent to your email.')
      setStep('otp')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId) return
    setLoading(true)
    try {
      const valid = await verifyOTP(email.trim(), otp.trim())
      if (!valid) { toast.error('Invalid or expired OTP. Please try again.'); setLoading(false); return }
      setCurrentBookingId(bookingId)
      setBookingToken(`bk_${bookingId}`)
      clearServices()
      setStep('done')
      setTimeout(() => { navigate(`/booking/${bookingId}`); onClose(); resetState() }, 1200)
    } catch { toast.error('Verification failed. Please try again.') }
    finally { setLoading(false) }
  }

  const resetState = () => { setStep('info'); setEmail(''); setPhone(''); setName(''); setOtp(''); setBookingId(null) }
  const handleClose = () => { resetState(); onClose() }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'info' && 'Book Appointment'}
            {step === 'otp' && 'Verify Your Email'}
            {step === 'done' && 'Booking Confirmed!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            {selectedServices.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Selected Services ({selectedServices.length})</p>
                {selectedServices.map((s, i) => (
                  <p key={i} className="text-sm font-medium">{s.tier_name} — {s.currency} {s.price}</p>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="bk-name">Your Name</Label>
              <Input id="bk-name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bk-email">Email Address *</Label>
              <Input id="bk-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bk-phone">Phone Number *</Label>
              <Input id="bk-phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 XXX XXX XXXX" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send OTP & Book
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An OTP has been sent to <strong>{email}</strong>.
            </p>
            <div className="space-y-1">
              <Label htmlFor="bk-otp">Enter 6-digit OTP</Label>
              <Input id="bk-otp" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-xl tracking-widest" required />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Continue
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold">Booking Confirmed!</p>
            <p className="text-muted-foreground text-sm">Redirecting to your dashboard…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
