import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { getAllBookings, getBookingStages, getChatMessages, sendChatMessageObj as sendChatMessage, updateBookingStage, createBookingStage, createPaymentRequest, createInvoice, getCompanySettings, sendPaymentRequestEmail } from '@/db/api'
import type { Booking, BookingChatMessage, BookingStageRecord as BookingStage, CompanySettings, PaymentRequest } from '@/types/types'
import { toast } from 'sonner'
import { MessageCircle, Send, ChevronDown, ChevronUp, Loader2, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

const STAGE_OPTIONS = ['Initial Payment', 'In Progress', 'Review', 'Final Stage', 'Completed']
const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentRequest['payment_method']; label: string }> = [
  { value: 'paystack', label: 'Paystack (Online)' },
  { value: 'cash', label: 'In-Person Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'momo_merchant', label: 'Merchant MoMo' },
]
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700'
}

// ─── Payment Request Dialog ──────────────────────────────────
function PaymentRequestDialog({
  booking,
  open,
  onClose,
}: { booking: Booking; open: boolean; onClose: () => void }) {
  const [percentage, setPercentage] = useState('')
  const [stageName, setStageName] = useState('')
  const [extraCost, setExtraCost] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentRequest['payment_method']>('paystack')
  const [offlineInstructions, setOfflineInstructions] = useState('')
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(false)

  const baseAmount = (booking.selected_services || []).reduce((sum, service) => sum + Number(service.price || 0), 0)
  const extraAmount = Number(extraCost || 0)
  const totalAmount = baseAmount + (Number.isFinite(extraAmount) ? extraAmount : 0)
  const percentageAmount = Number(percentage)
  const computedAmount = totalAmount > 0 && Number.isFinite(percentageAmount) && percentageAmount > 0
    ? ((totalAmount * percentageAmount) / 100).toFixed(2)
    : ''

  useEffect(() => {
    if (!open) return
    setPercentage('')
    setStageName('')
    setExtraCost('')
    setPaymentMethod('paystack')
    setOfflineInstructions('')
    getCompanySettings().then(setCompanySettings).catch(() => setCompanySettings(null))
  }, [open, booking.id])

  const handleSubmit = async () => {
    const percent = Number(percentage)
    const extras = Number(extraCost || 0)
    if (!percentage || !stageName) {
      toast.error('Please select a stage and percentage')
      return
    }
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      toast.error('Percentage must be between 1 and 100')
      return
    }
    if (!Number.isFinite(extras) || extras < 0) {
      toast.error('Extra costs cannot be negative')
      return
    }
    if (totalAmount <= 0) {
      toast.error('This booking has no project value yet')
      return
    }
    if (paymentMethod === 'bank_transfer' && !companySettings?.bank_account_number) {
      toast.error('Add bank details in Company Settings before requesting bank payment')
      return
    }
    if (paymentMethod === 'momo_merchant' && !companySettings?.merchant_momo_number) {
      toast.error('Add Merchant MoMo details in Company Settings before requesting MoMo payment')
      return
    }
    setLoading(true)
    try {
      const amount = Number(computedAmount)
      const paymentDetails = {
        method: paymentMethod,
        bank_name: companySettings?.bank_name || '',
        bank_account_name: companySettings?.bank_account_name || '',
        bank_account_number: companySettings?.bank_account_number || '',
        merchant_momo_name: companySettings?.merchant_momo_name || '',
        merchant_momo_number: companySettings?.merchant_momo_number || '',
        offline_instructions: offlineInstructions.trim(),
      }
      // 1. Create payment request record
      const paymentRequest = await createPaymentRequest({
        booking_id: booking.id,
        stage_name: stageName,
        percentage: Number(percentage),
        amount,
        currency: 'GHS',
        payment_method: paymentMethod,
        offline_instructions: offlineInstructions.trim() || null,
        status: 'pending',
      })

      // 2. Create invoice
      const invoice = await createInvoice({
        invoice_number: `INV-${Date.now()}`,
        booking_id: booking.id,
        customer_name: booking.user_name || booking.user_email,
        customer_email: booking.user_email,
        customer_phone: booking.user_phone || undefined,
        subtotal: amount,
        tax_amount: 0,
        discount_amount: 0,
        total: amount,
        currency: 'GHS',
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'sent',
        notes: `Payment request for stage: ${stageName} (${percentage}% of GHS ${totalAmount.toFixed(2)}; base: GHS ${baseAmount.toFixed(2)}, extra costs: GHS ${extras.toFixed(2)}; method: ${paymentMethod})`,
      })

      try {
        await sendPaymentRequestEmail({
          booking,
          paymentRequest,
          invoice,
          dashboardUrl: `${window.location.origin}/check-booking`,
        })
        toast.success(`Payment request of GHS ${amount.toLocaleString()} sent to client`)
      } catch (emailError: any) {
        toast.warning(`Payment request created, but email was not sent. ${emailError.message || ''}`)
      }
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create payment request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Request Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Project Stage</Label>
            <Select value={stageName} onValueChange={setStageName}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Initial Project Value (GHS)</Label>
            <Input
              value={baseAmount.toLocaleString()}
              readOnly
              className="bg-muted/60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Calculated from the services selected by the customer.</p>
          </div>
          <div className="space-y-1">
            <Label>Extra Costs (GHS)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              value={extraCost}
              onChange={e => setExtraCost(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Total Project Value (GHS)</Label>
            <Input
              value={totalAmount.toLocaleString()}
              readOnly
              className="bg-muted/60 cursor-not-allowed font-semibold"
            />
          </div>
          <div className="space-y-1">
            <Label>Percentage to Request (%)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 50"
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Payment Mode</Label>
            <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as PaymentRequest['payment_method'])}>
              <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {paymentMethod !== 'paystack' && (
            <div className="space-y-1">
              <Label>Offline Payment Instructions</Label>
              <Input
                placeholder="e.g. Include booking reference in payment narration"
                value={offlineInstructions}
                onChange={e => setOfflineInstructions(e.target.value)}
              />
            </div>
          )}
          {computedAmount && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <p className="font-semibold text-primary">Amount to charge: GHS {Number(computedAmount).toLocaleString()}</p>
              <p className="text-muted-foreground text-xs mt-0.5">An invoice will be generated automatically with the selected payment details.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !computedAmount}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Send Request & Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<BookingChatMessage[]>([])
  const [stages, setStages] = useState<BookingStage[]>([])
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [stageVal, setStageVal] = useState('')
  const [stageNotes, setStageNotes] = useState('')
  const [updatingStage, setUpdatingStage] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadDetail = async () => {
    const [msgs, stgs] = await Promise.all([getChatMessages(booking.id), getBookingStages(booking.id)])
    setMessages(msgs); setStages(stgs)
    const cur = stgs.find(s => s.status === 'in_progress')?.stage_name || stgs[stgs.length - 1]?.stage_name || ''
    setStageVal(cur)
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!expanded) { if (pollRef.current) clearInterval(pollRef.current); return }
    loadDetail()
    pollRef.current = setInterval(loadDetail, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [expanded, booking.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    setSending(true)
    try {
      await sendChatMessage({ booking_id: booking.id, sender_type: 'admin', message: msg.trim() })
      setMsg(''); await loadDetail()
    } catch { toast.error('Failed to send.') }
    finally { setSending(false) }
  }

  const handleStageUpdate = async () => {
    if (!stageVal) return
    setUpdatingStage(true)
    try {
      const existing = stages.find(s => s.stage_name === stageVal)
      if (existing) { await updateBookingStage(existing.id, { status: 'in_progress', notes: stageNotes }) }
      else { await createBookingStage({ booking_id: booking.id, stage_name: stageVal, status: 'in_progress', notes: stageNotes }) }
      toast.success('Stage updated!')
      setStageNotes('')
      await loadDetail()
    } catch { toast.error('Failed to update stage.') }
    finally { setUpdatingStage(false) }
  }

  const canChat = booking.status !== 'cancelled' && booking.status !== 'completed'

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <Badge className={STATUS_COLORS[booking.status] || ''}>{booking.status}</Badge>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{booking.user_name || booking.user_email}</p>
            <p className="text-xs text-muted-foreground">{booking.user_email} · {format(new Date(booking.created_at), 'PP')}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-4 bg-muted/20">
          {/* Stage update */}
          {canChat && (
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={stageVal} onValueChange={setStageVal}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Update Stage" /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Stage notes (optional)" value={stageNotes} onChange={e => setStageNotes(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={handleStageUpdate} disabled={updatingStage} className="bg-primary text-primary-foreground shrink-0">
                {updatingStage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Update Stage'}
              </Button>
            </div>
          )}

          {/* Payment request */}
          {canChat && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => setPayDialogOpen(true)}
              >
                <CreditCard className="h-3.5 w-3.5" /> Request Payment
              </Button>
            </div>
          )}

          <PaymentRequestDialog
            booking={booking}
            open={payDialogOpen}
            onClose={() => setPayDialogOpen(false)}
          />

          {/* Chat */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Live Chat</p>
            <div className="bg-background rounded-lg border border-border p-3 max-h-48 overflow-y-auto space-y-2 mb-2">
              {messages.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No messages yet.</p> :
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-xl px-3 py-1.5 text-sm ${m.sender_type === 'admin' ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                      <span className="text-xs font-semibold block mb-0.5 opacity-70">{m.sender_type === 'admin' ? 'Admin' : 'Client'}</span>
                      {m.message}
                    </div>
                  </div>
                ))
              }
              <div ref={chatEndRef} />
            </div>
            {canChat && (
              <form onSubmit={handleSend} className="flex gap-2">
                <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Reply to client…" />
                <Button type="submit" size="icon" disabled={sending || !msg.trim()} className="bg-primary text-primary-foreground shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAllBookings().then(data => { setBookings(data); setLoading(false) }) }, [])

  const visible = bookings.filter(b => {
    const sf = filter === 'all' || b.status === filter
    const ss = !search || b.user_email.includes(search) || (b.user_name || '').toLowerCase().includes(search.toLowerCase()) || (b.user_phone || '').includes(search)
    return sf && ss
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings Management</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by email, name, or phone…" value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> :
        visible.length === 0 ? <p className="text-center text-muted-foreground py-10">No bookings found.</p> :
          <div className="space-y-3">
            {visible.map(b => <BookingRow key={b.id} booking={b} />)}
          </div>
      }
    </div>
  )
}
