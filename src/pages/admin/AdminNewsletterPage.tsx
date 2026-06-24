import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getNewsletterSubscribers } from '@/db/api'
import type { NewsletterSubscriber } from '@/types/types'
import { format } from 'date-fns'
import { Mail, Download, Loader2 } from 'lucide-react'

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getNewsletterSubscribers().then(data => { setSubs(data); setLoading(false) }) }, [])

  const exportCSV = () => {
    const csv = ['Email,Subscribed At', ...subs.map(s => `${s.email},${s.subscribed_at}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'newsletter_subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground text-sm mt-1">{subs.length} subscriber{subs.length !== 1 ? 's' : ''}</p>
        </div>
        {subs.length > 0 && (
          <Button variant="outline" onClick={exportCSV} className="gap-1.5 shrink-0">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> :
        subs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No subscribers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead><tr className="border-b border-border"><th className="text-left py-3 px-4 font-semibold text-muted-foreground">#</th><th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th><th className="text-left py-3 px-4 font-semibold text-muted-foreground">Subscribed</th></tr></thead>
              <tbody>
                {subs.map((sub, i) => (
                  <tr key={sub.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{sub.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(sub.subscribed_at), 'PP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
