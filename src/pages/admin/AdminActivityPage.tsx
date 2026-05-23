import { useEffect, useState } from 'react'
import { getPageViews } from '@/db/api'
import type { PageView } from '@/types/types'
import { format } from 'date-fns'
import { Activity, Loader2 } from 'lucide-react'

export default function AdminActivityPage() {
  const [views, setViews] = useState<PageView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPageViews().then(data => { setViews(data); setLoading(false) }) }, [])

  const pageStats = views.reduce<Record<string, number>>((acc, v) => { acc[v.page_path] = (acc[v.page_path] || 0) + 1; return acc }, {})
  const sorted = Object.entries(pageStats).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">Page views tracked across the website</p>
      </div>

      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> :
        views.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground"><Activity className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No activity recorded yet.</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                  <span className="text-sm font-medium truncate">{path}</span>
                  <span className="ml-3 text-primary font-bold shrink-0">{count}</span>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-semibold mb-3">Recent Activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Page</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Visitor</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Time</th>
                  </tr></thead>
                  <tbody>
                    {views.slice(0, 50).map(v => (
                      <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                        <td className="py-2 px-4">{v.page_path}</td>
                        <td className="py-2 px-4 text-muted-foreground">{v.user_identifier || 'Anonymous'}</td>
                        <td className="py-2 px-4 text-muted-foreground">{format(new Date(v.created_at), 'PP p')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      }
    </div>
  )
}
