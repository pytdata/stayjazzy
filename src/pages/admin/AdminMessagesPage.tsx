import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getAllContactMessages, updateContactMessage } from '@/db/api'
import type { ContactMessage } from '@/types/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'

function MessageRow({ msg, onUpdate }: { msg: ContactMessage; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [response, setResponse] = useState(msg.admin_response || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try { await updateContactMessage(msg.id, { status: 'responded', admin_response: response }); toast.success('Response saved'); onUpdate() }
    catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <Card className="border-border">
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-start justify-between p-4 text-left hover:bg-muted/30 rounded-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={msg.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{msg.status}</Badge>
            <span className="font-medium text-sm">{msg.name}</span>
            <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'PP')}</span>
          </div>
          <p className="text-sm font-medium text-balance">{msg.subject || 'No subject'}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 mt-1 ml-3" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1 ml-3" />}
      </button>
      {expanded && (
        <CardContent className="pt-0 border-t border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Email: </span>{msg.email}</div>
            {msg.phone && <div><span className="text-muted-foreground">Phone: </span>{msg.phone}</div>}
          </div>
          <div className="bg-muted rounded-lg p-3"><p className="text-sm whitespace-pre-wrap text-pretty">{msg.message}</p></div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Admin Response</label>
            <Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Write your response…" rows={3} />
            <Button size="sm" onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Save Response
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => getAllContactMessages().then(data => { setMessages(data); setLoading(false) })
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contact Messages</h1>
      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> :
        messages.length === 0 ? <p className="text-center text-muted-foreground py-10">No messages yet.</p> :
          <div className="space-y-3">{messages.map(m => <MessageRow key={m.id} msg={m} onUpdate={load} />)}</div>
      }
    </div>
  )
}
