import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, GripVertical, Edit } from 'lucide-react'
import MediaUpload from '@/components/ui/MediaUpload'
import {
  getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getAllSiteContent, upsertSiteContent,
  getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember,
  getPortfolioWorks, createPortfolioWork, updatePortfolioWork, deletePortfolioWork,
  getPortfolioCategories, createPortfolioCategory, updatePortfolioCategory, deletePortfolioCategory,
  getFAQs, createFAQ, deleteFAQ
} from '@/db/api'
import type { HeroSlide, TeamMember, PortfolioWork, FAQ } from '@/types/types'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/mediaUrls'

function SlideManager() {
  const [slides, setSlides] = useState<Partial<HeroSlide>[]>([])
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = () => getHeroSlides().then(setSlides)
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ title: '', subtitle: '', image_url: '' })
    setEditId(null)
  }

  const save = async () => {
    if (!form.image_url.trim()) { toast.error('Image URL is required'); return }
    setAdding(true)
    try {
      const wasEditing = Boolean(editId)
      const payload = { title: form.title, subtitle: form.subtitle, image_url: form.image_url }
      if (editId) await updateHeroSlide(editId, payload)
      else await createHeroSlide(payload)
      resetForm()
      setOpen(false)
      load()
      toast.success(wasEditing ? 'Slide updated' : 'Slide added')
    }
    catch { toast.error(editId ? 'Failed to update slide' : 'Failed to add slide') } finally { setAdding(false) }
  }
  const remove = async (id: string) => { if (!id) return; await deleteHeroSlide(id); load(); toast.success('Deleted') }
  const handleEdit = (slide: Partial<HeroSlide>) => {
    if (!slide.id) return
    setEditId(slide.id)
    setForm({ title: slide.title || '', subtitle: slide.subtitle || '', image_url: slide.image_url || '' })
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Hero Slides</h3>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground gap-1"><Plus className="h-3.5 w-3.5" /> Add Slide</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Edit Hero Slide' : 'New Hero Slide'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Slide title" /></div>
              <div className="space-y-1"><Label>Subtitle</Label><Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Slide subtitle" rows={2} /></div>
              <MediaUpload label="Slide Image *" value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} accept="image" />
              <Button onClick={save} disabled={adding} className="w-full bg-primary text-primary-foreground">{adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {editId ? 'Save Changes' : 'Add Slide'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {slides.map(s => (
          <div key={s.id} className="border border-border rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-video"><img src={getImageUrl(s.image_url)} alt={s.title ?? undefined} className="w-full h-full object-cover" /></div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0"><p className="font-medium text-sm truncate">{s.title || 'Untitled'}</p></div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => s.id && remove(s.id)} className="text-destructive border-destructive/30"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentEditor() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { getAllSiteContent().then(setContent) }, [])

  const save = async (key: string) => {
    setSaving(true)
    try { await upsertSiteContent(key, content[key] || ''); toast.success('Saved!') }
    catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const fields = [
    { key: 'about_description', label: 'About Company Text', multiline: true },
    { key: 'mission', label: 'Mission Statement', multiline: true },
    { key: 'vision', label: 'Vision Statement', multiline: true },
    { key: 'why_choose_us', label: 'Why Choose Us Text', multiline: true },
  ]

  return (
    <div className="space-y-4">
      {fields.map(({ key, label, multiline }) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          {multiline ? (
            <Textarea value={content[key] || ''} onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))} rows={3} />
          ) : (
            <Input value={content[key] || ''} onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))} />
          )}
          <Button size="sm" onClick={() => save(key)} disabled={saving} className="bg-primary text-primary-foreground">Save</Button>
        </div>
      ))}
    </div>
  )
}

function TeamManager() {
  const [team, setTeam] = useState<Partial<TeamMember>[]>([])
  const [form, setForm] = useState({ name: '', role: '', bio: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = () => getTeamMembers().then(setTeam)
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', role: '', bio: '', image_url: '' })
    setEditId(null)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setAdding(true)
    try {
      const wasEditing = Boolean(editId)
      const payload = { name: form.name, role: form.role, bio: form.bio, image_url: form.image_url }
      if (editId) await updateTeamMember(editId, payload)
      else await createTeamMember(payload)
      resetForm()
      setOpen(false)
      load()
      toast.success(wasEditing ? 'Member updated' : 'Member added')
    }
    catch { toast.error(editId ? 'Failed to update member' : 'Failed to add member') } finally { setAdding(false) }
  }
  const remove = async (id: string) => { if (!id) return; await deleteTeamMember(id); load() }
  const handleEdit = (member: Partial<TeamMember>) => {
    if (!member.id) return
    setEditId(member.id)
    setForm({ name: member.name || '', role: member.role || '', bio: member.bio || '', image_url: member.image_url || '' })
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Team Members</h3>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground gap-1"><Plus className="h-3.5 w-3.5" /> Add Member</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Edit Team Member' : 'New Team Member'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Role/Title</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2} /></div>
              <MediaUpload label="Photo" value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} accept="image" />
              <Button onClick={save} disabled={adding} className="w-full bg-primary text-primary-foreground">{adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {editId ? 'Save Changes' : 'Add Member'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map(m => (
          <div key={m.id} className="border border-border rounded-xl p-3 flex items-start gap-3">
            {m.image_url ? <img src={getImageUrl(m.image_url)} alt={m.name} className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 bg-muted rounded-full shrink-0 flex items-center justify-center font-bold text-muted-foreground">{(m.name || '?')[0]}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{m.name}</p>
              <p className="text-xs text-primary">{m.role}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => handleEdit(m)}><Edit className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => m.id && remove(m.id)} className="text-destructive border-destructive/30"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

  function CategoryManager() {
  const [categories, setCategories] = useState<Partial<import('@/types/types').PortfolioCategory>[]>([])
  const [form, setForm] = useState({ name: '', display_order: 0, is_active: true })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = () => getPortfolioCategories().then(setCategories)
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setAdding(true)
    try {
      if (editId) {
        await updatePortfolioCategory(editId, form)
      } else {
        await createPortfolioCategory(form)
      }
      setForm({ name: '', display_order: 0, is_active: true })
      setOpen(false)
      setEditId(null)
      load()
    } catch { toast.error('Failed to save category') } finally { setAdding(false) }
  }

  const remove = async (id: string) => { if (!id) return; await deletePortfolioCategory(id); load() }

  const handleEdit = (c: any) => {
    setEditId(c.id)
    setForm({ name: c.name, display_order: c.display_order, is_active: c.is_active })
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Event Categories</h3>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm({ name: '', display_order: 0, is_active: true }) } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Category</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="E.g. Weddings" /></div>
              <div className="space-y-1"><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: +e.target.value }))} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="is_active" checked={form.is_active} onCheckedChange={(c: boolean) => setForm(f => ({ ...f, is_active: c }))} /><Label htmlFor="is_active">Active</Label></div>
              <Button onClick={save} disabled={adding} className="w-full">{adding ? 'Saving...' : 'Save Category'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Order: {c.display_order} • {c.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => c.id && remove(c.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg text-center col-span-full">No categories added yet.</p>}
      </div>
    </div>
  )
}


function WorksManager() {
  const [works, setWorks] = useState<Partial<PortfolioWork>[]>([])
  const [categories, setCategories] = useState<Partial<import('@/types/types').PortfolioCategory>[]>([])
  const [form, setForm] = useState({ title: '', category: '', description: '', image_url: '', video_url: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = () => { getPortfolioWorks().then(setWorks); getPortfolioCategories().then(setCategories); }
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ title: '', category: '', description: '', image_url: '', video_url: '' })
    setEditId(null)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setAdding(true)
    try {
      const wasEditing = Boolean(editId)
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
      }
      if (editId) await updatePortfolioWork(editId, payload)
      else await createPortfolioWork(payload)
      resetForm()
      setOpen(false)
      load()
      toast.success(wasEditing ? 'Work updated' : 'Work added')
    }
    catch { toast.error(editId ? 'Failed to update work' : 'Failed to add work') } finally { setAdding(false) }
  }
  const remove = async (id: string) => { if (!id) return; await deletePortfolioWork(id); load() }
  const handleEdit = (work: Partial<PortfolioWork>) => {
    if (!work.id) return
    setEditId(work.id)
    setForm({
      title: work.title || '',
      category: work.category || '',
      description: work.description || '',
      image_url: work.image_url || '',
      video_url: work.video_url || '',
    })
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Portfolio Works</h3>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground gap-1"><Plus className="h-3.5 w-3.5" /> Add Work</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Edit Portfolio Work' : 'Add Portfolio Work'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.is_active).map(c => <SelectItem key={c.id!} value={c.name!}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <MediaUpload label="Cover Image" value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} accept="image" />
              <MediaUpload label="Video (optional)" value={form.video_url} onChange={url => setForm(f => ({ ...f, video_url: url }))} accept="video" />
              <Button onClick={save} disabled={adding} className="w-full bg-primary text-primary-foreground">{adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {editId ? 'Save Changes' : 'Add Work'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {works.map(w => (
          <div key={w.id} className="border border-border rounded-xl overflow-hidden">
            {w.image_url && <div className="aspect-video"><img src={getImageUrl(w.image_url)} alt={w.title} className="w-full h-full object-cover" /></div>}
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{w.title}</p>
                <p className="text-xs text-muted-foreground">{w.category}</p>
                {w.video_url && <p className="text-xs text-primary mt-0.5">▶ Video attached</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleEdit(w)}><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => w.id && remove(w.id)} className="text-destructive border-destructive/30"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQManager() {
  const [faqs, setFAQs] = useState<Partial<FAQ>[]>([])
  const [form, setForm] = useState({ question: '', answer: '' })
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  const load = () => getFAQs().then(setFAQs)
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.question.trim() || !form.answer.trim()) { toast.error('Both fields required'); return }
    setAdding(true)
    try { await createFAQ({ question: form.question, answer: form.answer }); setForm({ question: '', answer: '' }); setOpen(false); load() }
    catch { toast.error('Failed to add FAQ') } finally { setAdding(false) }
  }
  const remove = async (id: string) => { if (!id) return; await deleteFAQ(id); load() }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">FAQs</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground gap-1"><Plus className="h-3.5 w-3.5" /> Add FAQ</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>New FAQ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Question *</Label><Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Answer *</Label><Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={3} /></div>
              <Button onClick={add} disabled={adding} className="w-full bg-primary text-primary-foreground">{adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add FAQ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {faqs.map(f => (
          <div key={f.id} className="border border-border rounded-xl p-3 flex items-start gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{f.question}</p>
              <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{f.answer}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => f.id && remove(f.id)} className="text-destructive border-destructive/30 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content Management</h1>
      <Tabs defaultValue="slides">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
          {['slides', 'content', 'team', 'works', 'categories', 'faqs'].map(t => (
            <TabsTrigger key={t} value={t} className="flex-1 min-w-[80px] capitalize text-sm">{t === 'slides' ? 'Hero Slides' : t === 'content' ? 'Site Text' : t === 'team' ? 'Team' : t === 'works' ? 'Portfolio' : t === 'categories' ? 'Categories' : 'FAQs'}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="slides" className="mt-4"><SlideManager /></TabsContent>
        <TabsContent value="content" className="mt-4"><ContentEditor /></TabsContent>
        <TabsContent value="team" className="mt-4"><TeamManager /></TabsContent>
        <TabsContent value="works" className="mt-4"><WorksManager /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoryManager /></TabsContent>
        <TabsContent value="faqs" className="mt-4"><FAQManager /></TabsContent>
      </Tabs>
    </div>
  )
}
