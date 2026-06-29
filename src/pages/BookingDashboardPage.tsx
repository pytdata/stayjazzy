import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { getBookingById, getBookingStages, getChatMessages, sendChatMessageObj as sendChatMessage, cancelBooking } from '@/db/api'
import { useBooking } from '@/contexts/BookingContext'
import { toast } from 'sonner'
import { Send, MessageCircle, CheckCircle, Clock, AlertCircle, Loader2, XCircle } from 'lucide-react'
import type { Booking, BookingStageRecord as BookingStage, BookingChatMessage, SelectedService } from '@/types/types'
import { format } from 'date-fns'

const STAGES = ['Initial Payment', 'In Progress', 'Review', 'Final Stage', 'Completed'] as const

function StageIndicator({ stages, currentStage }: { stages: BookingStage[]; currentStage: string }) {
  const currentIdx = STAGES.indexOf(currentStage as typeof STAGES[number])

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center min-w-max px-2 py-4">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={stage} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-muted text-muted-foreground border-2 border-border'}`}>
                  {done ? <CheckCircle className="h-4 w-4" /> : <span>{i + 1}</span>}
                </div>
                <p className={`text-xs mt-1 whitespace-nowrap text-center max-w-[80px] ${active ? 'font-bold text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{stage}</p>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
      {stages.filter(s => s.notes).map(s => (
        <p key={s.id} className="text-xs text-muted-foreground px-2 italic">{s.stage_name}: {s.notes}</p>
      ))}
    </div>
  )
}

export default function BookingDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBookingId, setCurrentBookingId, setBookingToken } = useBooking()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [stages, setStages] = useState<BookingStage[]>([])
  const [messages, setMessages] = useState<BookingChatMessage[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auth guard
  useEffect(() => {
    if (!currentBookingId && id && currentBookingId !== id) {
      navigate('/check-booking', { replace: true })
    }
  }, [currentBookingId, id, navigate])

  const loadData = async () => {
    if (!id) return
    try {
      const [bk, stgs, msgs] = await Promise.all([getBookingById(id), getBookingStages(id), getChatMessages(id)])
      setBooking(bk)
      setStages(stgs)
      setMessages(msgs)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadData()
    pollRef.current = setInterval(loadData, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  useEffect(() => {
    const chat = chatScrollRef.current
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !id) return
    setSending(true)
    try {
      await sendChatMessage({ booking_id: id, sender_type: 'user', message: newMsg.trim() })
      setNewMsg('')
      await loadData()
    } catch { toast.error('Failed to send message.') }
    finally { setSending(false) }
  }

  const handleCancel = async () => {
    if (!id) return
    setCancelling(true)
    try {
      await cancelBooking(id)
      toast.success('Booking cancelled successfully.')
      setCurrentBookingId(null)
      setBookingToken(null)
      navigate('/', { replace: true })
    } catch { toast.error('Failed to cancel booking.') }
    finally { setCancelling(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Booking not found.</p>
      <Button className="bg-primary text-primary-foreground" onClick={() => navigate('/')}>Go Home</Button>
    </div>
  )

  const isCancelled = booking.status === 'cancelled'
  const isCompleted = booking.status === 'completed'
  const canChat = !isCancelled && !isCompleted
  const currentStage = stages.find(s => s.status === 'in_progress')?.stage_name || stages[stages.length - 1]?.stage_name || 'Initial Payment'
  const services: SelectedService[] = Array.isArray(booking.selected_services) ? booking.selected_services : []

  const statusColor = isCancelled ? 'bg-red-100 text-red-700' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'

  return (
    <div className="min-h-screen bg-muted/30 pt-16 md:pt-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Booking Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={statusColor + ' capitalize'}>{booking.status}</Badge>
            {!isCancelled && !isCompleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                    <XCircle className="h-4 w-4 mr-1.5" /> Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently cancel your booking and close the live chat. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground">
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Status stages */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Booking Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <StageIndicator stages={stages} currentStage={currentStage} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking details */}
          <Card className="border-border h-full">
            <CardHeader><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{booking.user_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{booking.user_email}</p>
                <p className="text-sm text-muted-foreground">{booking.user_phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Selected Services</p>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services listed.</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((svc, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                        <span className="text-sm font-medium">{svc.tier_name || svc.sub_service_name}</span>
                        <span className="text-sm text-primary font-semibold">{svc.currency} {Number(svc.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{format(new Date(booking.created_at), 'PPP')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Live chat */}
          <Card className="border-border flex flex-col h-full min-h-[400px]">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Live Chat with Admin
                {!canChat && <Badge variant="outline" className="text-xs ml-auto">Closed</Badge>}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0">
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 min-h-[200px] max-h-[300px]">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    {canChat ? 'Start a conversation with our team!' : 'Chat is closed for this booking.'}
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${msg.sender_type === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'p')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canChat ? (
                <form onSubmit={handleSend} className="flex gap-2 shrink-0">
                  <Input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMsg.trim()} size="icon" className="bg-primary text-primary-foreground shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground text-center shrink-0">
                  {isCancelled ? 'Booking cancelled — chat closed.' : 'Booking completed — chat closed.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
