import { useState, useEffect } from 'react'
import {
  CreditCard, FileText, Receipt, DollarSign, TrendingUp, CheckCircle, XCircle, Clock,
  Download, Plus, Eye, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getPaymentTransactions, getPaymentRequests, getInvoices, getReceipts,
} from '@/db/api'
import type { PaymentTransaction, PaymentRequest, Invoice, Receipt } from '@/types/types'

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])

  const loadAll = async () => {
    const [t, r, i, rc] = await Promise.all([
      getPaymentTransactions(), getPaymentRequests(), getInvoices(), getReceipts()
    ])
    setTransactions(t); setRequests(r); setInvoices(i); setReceipts(rc)
  }

  useEffect(() => { loadAll() }, [])

  const totalRevenue = transactions.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount), 0)
  const pendingAmount = requests.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Payments & Finance
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">GHS {totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">GHS {pendingAmount.toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Invoices</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receipts</p>
              <p className="text-2xl font-bold">{receipts.length}</p>
            </div>
            <Receipt className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="requests">Payment Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead className="border-b"><tr className="text-left"><th>Reference</th><th>Amount</th><th>Status</th><th>Gateway</th><th>Date</th></tr></thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="py-2 font-mono">{t.reference}</td>
                      <td className="py-2">GHS {Number(t.amount).toLocaleString()}</td>
                      <td className="py-2"><Badge variant={t.status === 'success' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>{t.status}</Badge></td>
                      <td className="py-2 capitalize">{t.gateway}</td>
                      <td className="py-2 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="text-muted-foreground text-center py-8">No transactions yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead className="border-b"><tr className="text-left"><th>Booking</th><th>Stage</th><th>Percentage</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
                <tbody className="divide-y">
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td className="py-2">{r.booking_id.slice(0, 8)}...</td>
                      <td className="py-2">{r.stage_name}</td>
                      <td className="py-2">{r.percentage}%</td>
                      <td className="py-2 font-semibold">GHS {Number(r.amount).toLocaleString()}</td>
                      <td className="py-2"><Badge variant={r.status === 'paid' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'}>{r.status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{r.due_date ? new Date(r.due_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && <p className="text-muted-foreground text-center py-8">No payment requests yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead className="border-b"><tr className="text-left"><th>Invoice #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody className="divide-y">
                  {invoices.map(i => (
                    <tr key={i.id}>
                      <td className="py-2 font-mono">{i.invoice_number}</td>
                      <td className="py-2">{i.customer_name}</td>
                      <td className="py-2 font-semibold">GHS {Number(i.total).toLocaleString()}</td>
                      <td className="py-2"><Badge variant={i.status === 'paid' ? 'default' : i.status === 'sent' ? 'secondary' : 'outline'}>{i.status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && <p className="text-muted-foreground text-center py-8">No invoices yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead className="border-b"><tr className="text-left"><th>Receipt #</th><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                <tbody className="divide-y">
                  {receipts.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 font-mono">{r.receipt_number}</td>
                      <td className="py-2">{r.customer_name}</td>
                      <td className="py-2 font-semibold">GHS {Number(r.amount).toLocaleString()}</td>
                      <td className="py-2">{r.payment_method || '-'}</td>
                      <td className="py-2 text-muted-foreground">{new Date(r.paid_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {receipts.length === 0 && <p className="text-muted-foreground text-center py-8">No receipts yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
