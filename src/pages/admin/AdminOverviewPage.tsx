import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MessageCircle, Users, TrendingUp, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'
import { getAllBookings, getAllContactMessages, getNewsletterSubscribers, getPageViews } from '@/db/api'

interface Stats { total: number; active: number; completed: number; cancelled: number }
interface OvCard { title: string; value: string | number; sub: string; icon: React.ElementType; color: string }

export default function AdminOverviewPage() {
  const [bookingStats, setBookingStats] = useState<Stats>({ total: 0, active: 0, completed: 0, cancelled: 0 })
  const [msgCount, setMsgCount] = useState(0)
  const [subCount, setSubCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllBookings(), getAllContactMessages(), getNewsletterSubscribers(), getPageViews()]).then(([bks, msgs, subs, views]) => {
      setBookingStats({
        total: bks.length,
        active: bks.filter(b => b.status === 'active').length,
        completed: bks.filter(b => b.status === 'completed').length,
        cancelled: bks.filter(b => b.status === 'cancelled').length,
      })
      setMsgCount(msgs.length)
      setSubCount(subs.length)
      setViewCount(views.length)
      setLoading(false)
    })
  }, [])

  const cards: OvCard[] = [
    { title: 'Total Bookings', value: bookingStats.total, sub: `${bookingStats.active} active`, icon: Calendar, color: 'text-blue-600' },
    { title: 'Completed', value: bookingStats.completed, sub: 'Successful deliveries', icon: CheckCircle, color: 'text-green-600' },
    { title: 'Cancelled', value: bookingStats.cancelled, sub: 'Booking cancellations', icon: XCircle, color: 'text-red-500' },
    { title: 'Messages', value: msgCount, sub: 'Contact inquiries', icon: MessageCircle, color: 'text-purple-600' },
    { title: 'Newsletter', value: subCount, sub: 'Email subscribers', icon: Users, color: 'text-yellow-600' },
    { title: 'Page Views', value: viewCount, sub: 'Total visits tracked', icon: TrendingUp, color: 'text-pink-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening with Stay Jazzy Multimedia.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ title, value, sub, icon: Icon, color }) => (
            <Card key={title} className="h-full border-border">
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Active Bookings Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" /><span className="text-sm">Active: {bookingStats.active}</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 shrink-0" /><span className="text-sm">Completed: {bookingStats.completed}</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 shrink-0" /><span className="text-sm">Cancelled: {bookingStats.cancelled}</span></div>
          </div>
          {bookingStats.total === 0 && <p className="text-muted-foreground text-sm mt-3">No bookings yet. They will appear here once clients book.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
