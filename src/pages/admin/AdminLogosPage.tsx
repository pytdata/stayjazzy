import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getAllClientLogos, createClientLogo, deleteClientLogo } from '@/db/api'
import type { ClientLogo } from '@/types/types'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import MediaUpload from '@/components/ui/MediaUpload'

export default function AdminLogosPage() {
  const [logos, setLogos] = useState<ClientLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ client_name: '', bw_logo_url: '', colored_logo_url: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  const load = () => getAllClientLogos().then(data => { setLogos(data); setLoading(false) })
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.client_name.trim()) { toast.error('Client name is required'); return }
    setAdding(true)
    try { await createClientLogo({ client_name: form.client_name, bw_logo_url: form.bw_logo_url, colored_logo_url: form.colored_logo_url }); setForm({ client_name: '', bw_logo_url: '', colored_logo_url: '' }); setOpen(false); load() }
    catch { toast.error('Failed to add logo') } finally { setAdding(false) }
  }

  const remove = async (id: string) => { await deleteClientLogo(id); load(); toast.success('Deleted') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Client Logos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Add Logo</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>Add Client Logo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Client Name</Label><Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="ABC Company" /></div>
              <MediaUpload label="B&W Logo" value={form.bw_logo_url} onChange={url => setForm(f => ({ ...f, bw_logo_url: url }))} accept="image" />
              <MediaUpload label="Colored Logo" value={form.colored_logo_url} onChange={url => setForm(f => ({ ...f, colored_logo_url: url }))} accept="image" />
              <Button onClick={add} disabled={adding} className="w-full bg-primary text-primary-foreground">
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Logo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> :
        logos.length === 0 ? <p className="text-center text-muted-foreground py-10">No client logos added yet.</p> :
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {logos.map(logo => (
              <Card key={logo.id} className="border-border h-full">
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <div className="w-full aspect-[3/2] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    {logo.colored_logo_url
                      ? <img src={logo.colored_logo_url} alt={logo.client_name} className="w-full h-full object-contain p-2" />
                      : <span className="text-sm font-medium text-muted-foreground text-center px-2">{logo.client_name}</span>
                    }
                  </div>
                  <p className="text-sm font-medium text-center text-balance">{logo.client_name}</p>
                  <Button size="sm" variant="outline" onClick={() => remove(logo.id)} className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
      }
    </div>
  )
}
