import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Users, MessageCircle, DollarSign, Eye,
  Calendar, CheckCircle, XCircle, Clock, Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalytics, getChatAnalytics } from '@/db/api'
import { db as supabase } from '@/db/dbClient'

interface DashboardStats {
  total: number; active: number; completed: number; cancelled: number;
  messages: number; subscribers: number; pageViews: number;
}

interface ChatStats {
  totalConversations: number; activeConversations: number;
  totalLeads: number; newLeads: number;
  countries: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chatStats, setChatStats] = useState<ChatStats | null>(null)
  const [txnStats, setTxnStats] = useState({ total: 0, success: 0, failed: 0, revenue: 0 })

  useEffect(() => {
    getAnalytics().then(setStats)
    getChatAnalytics().then(setChatStats)
    supabase.from('payment_transactions').select('*').then(({ data }) => {
      if (!data) return
      const success = data.filter((t: any) => t.status === 'success')
      setTxnStats({
        total: data.length,
        success: success.length,
        failed: data.filter((t: any) => t.status === 'failed').length,
        revenue: success.reduce((s: number, t: any) => s + Number(t.amount), 0),
      })
    })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Analytics Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Total Bookings</p><p className="text-2xl font-bold">{stats?.total ?? 0}</p></div>
          <Calendar className="h-8 w-8 text-blue-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</p></div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Cancelled</p><p className="text-2xl font-bold text-red-600">{stats?.cancelled ?? 0}</p></div>
          <XCircle className="h-8 w-8 text-red-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Page Views</p><p className="text-2xl font-bold">{stats?.pageViews ?? 0}</p></div>
          <Eye className="h-8 w-8 text-purple-600" />
        </CardContent></Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Contact Messages</p><p className="text-2xl font-bold">{stats?.messages ?? 0}</p></div>
          <MessageCircle className="h-8 w-8 text-amber-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Subscribers</p><p className="text-2xl font-bold">{stats?.subscribers ?? 0}</p></div>
          <Users className="h-8 w-8 text-teal-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">GHS {txnStats.revenue.toLocaleString()}</p></div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{txnStats.total}</p></div>
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </CardContent></Card>
      </div>

      {/* Chat Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Chat Overview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Total Conversations</span><span className="font-bold">{chatStats?.totalConversations ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Active</span><span className="font-bold text-green-600">{chatStats?.activeConversations ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Offline Leads</span><span className="font-bold">{chatStats?.totalLeads ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">New Leads</span><span className="font-bold text-amber-600">{chatStats?.newLeads ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Visitors by Country</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {chatStats && Object.entries(chatStats.countries).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
              <div key={country} className="flex items-center justify-between p-2 border-b last:border-0">
                <span className="text-sm">{country}</span>
                <span className="font-bold text-primary">{count}</span>
              </div>
            ))}
            {(!chatStats || Object.keys(chatStats.countries).length === 0) && (
              <p className="text-muted-foreground text-center py-4">No visitor data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
