import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { generateOTP, getBookingByEmailOrPhone, saveOTP, sendOTPEmail, verifyOTP } from '@/db/api'
import { useBooking } from '@/contexts/BookingContext'
import { toast } from 'sonner'
import { trackPageView } from '@/db/api'

type Step = 'lookup' | 'otp' | 'found_cancelled'

export default function CheckBookingPage() {
  const navigate = useNavigate()
  const { setCurrentBookingId, setBookingToken } = useBooking()
  const [step, setStep] = useState<Step>('lookup')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState('')

  useEffect(() => { trackPageView('/check-booking') }, [])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const booking = await getBookingByEmailOrPhone(identifier.trim())
      if (!booking) { toast.info('No booking found. Redirecting to Offers…'); setTimeout(() => navigate('/offers'), 1500); return }
      if (booking.status === 'cancelled') { setStep('found_cancelled'); return }
      setBookingId(booking.id)
      const code = generateOTP()
      await saveOTP(booking.user_email, code)
      await sendOTPEmail(booking.user_email, code, 'booking dashboard access')
      setOtpEmail(booking.user_email)
      toast.success('OTP sent to your email.')
      setStep('otp')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Error checking booking. Please try again.') }
    finally { setLoading(false) }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId) return
    setLoading(true)
    try {
      const valid = await verifyOTP(otpEmail, otp.trim())
      if (!valid) { toast.error('Invalid or expired OTP.'); setLoading(false); return }
      setCurrentBookingId(bookingId)
      setBookingToken(`bk_${bookingId}`)
      navigate(`/booking/${bookingId}`)
    } catch { toast.error('Verification failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="pt-16 md:pt-20 min-h-screen bg-muted/30 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-balance">Check Your Booking</h1>
          <p className="text-muted-foreground mt-2">Enter your email or phone number to find your booking</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            {step === 'lookup' && (
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="ck-id">Email or Phone Number</Label>
                  <Input
                    id="ck-id"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="you@example.com or +233 XXX XXX XXXX"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Find My Booking
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-3 text-sm text-primary">
                  Booking found! An OTP has been sent to <strong>{otpEmail}</strong>.
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ck-otp">Enter 6-digit OTP</Label>
                  <Input
                    id="ck-otp"
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-xl tracking-widest"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Verify & Access Dashboard
                </Button>
                <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('lookup')}>
                  Try a different email/phone
                </Button>
              </form>
            )}

            {step === 'found_cancelled' && (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Booking Closed</h3>
                <p className="text-muted-foreground text-sm mb-4">This booking has been cancelled. Please create a new booking to access the portal.</p>
                <div className="space-y-2">
                  <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate('/offers')}>Browse Our Services</Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep('lookup')}>Try Another</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
