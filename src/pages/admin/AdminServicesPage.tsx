import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Check, X } from 'lucide-react'
import { getAllServicePackages, createServicePackage, updateServicePackage, deleteServicePackage, getAllSubServices, createSubService, updateSubService, deleteSubService, getPricingTiers, createPricingTier, updatePricingTier, deletePricingTier, getPricingFeatures, createPricingFeature, deletePricingFeature } from '@/db/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit } from 'lucide-react'
import type { ServicePackage, SubService, PricingTier, PricingFeature } from '@/types/types'
import { toast } from 'sonner'


function FeatureList({ tierId }: { tierId: string }) {
  const [features, setFeatures] = useState<PricingFeature[]>([])
  const [newFeat, setNewFeat] = useState('')
  const [included, setIncluded] = useState(true)
  const [loading, setLoading] = useState(false)

  const load = () => getPricingFeatures(tierId).then(setFeatures)
  useEffect(() => { load() }, [tierId])

  const add = async () => {
    if (!newFeat.trim()) return
    setLoading(true)
    try { await createPricingFeature({ tier_id: tierId, feature_text: newFeat.trim(), is_included: included }); setNewFeat(''); load() }
    catch { toast.error('Failed to add feature') } finally { setLoading(false) }
  }
  const remove = async (id: string) => { await deletePricingFeature(id); load() }

  return (
    <div className="mt-3 space-y-2">
      {features.map(f => (
        <div key={f.id} className="flex items-center gap-2 text-sm">
          {f.is_included ? <Check className="h-4 w-4 text-green-600 shrink-0" /> : <X className="h-4 w-4 text-red-400 shrink-0" />}
          <span className="flex-1">{f.feature_text}</span>
          <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input value={newFeat} onChange={e => setNewFeat(e.target.value)} placeholder="Feature text" className="flex-1 text-sm" />
        <Select value={included ? 'yes' : 'no'} onValueChange={v => setIncluded(v === 'yes')}>
          <SelectTrigger className="w-24 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Included</SelectItem>
            <SelectItem value="no">Excluded</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={add} disabled={loading} className="bg-primary text-primary-foreground shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

function TierSection({ subServiceId }: { subServiceId: string }) {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<{ type: string; price: string; currency: string; desc: string }>({ type: '', price: '', currency: 'GHS', desc: '' })
  const [adding, setAdding] = useState(false)
  
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ type: string; price: string; currency: string; desc: string }>({ type: '', price: '', currency: 'GHS', desc: '' })

  const load = () => getPricingTiers(subServiceId).then(setTiers)
  useEffect(() => { load() }, [subServiceId])

  const addTier = async () => {
    if (!addForm.price || !addForm.type.trim()) return
    setAdding(true)
    try {
      await createPricingTier({ sub_service_id: subServiceId, tier_type: addForm.type.trim(), price: parseFloat(addForm.price), currency: addForm.currency, description: addForm.desc || undefined })
      load()
      setAddForm({ type: '', price: '', currency: 'GHS', desc: '' })
    } catch { toast.error('Failed to add tier') } finally { setAdding(false) }
  }
  
  const handleEdit = (t: PricingTier) => {
    setEditId(t.id)
    setEditForm({ type: t.tier_type, price: t.price.toString(), currency: t.currency, desc: t.description || '' })
  }

  const saveEdit = async () => {
    if (!editId || !editForm.type.trim()) return
    try {
      await updatePricingTier(editId, { tier_type: editForm.type.trim(), price: parseFloat(editForm.price), currency: editForm.currency, description: editForm.desc || undefined })
      setEditId(null)
      load()
    } catch { toast.error('Failed to update tier') }
  }

  const removeTier = async (id: string) => {
    if (!confirm('Delete this pricing tier?')) return
    try { await deletePricingTier(id); load() } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="mt-3 space-y-2">
      {tiers.map(t => (
        <div key={t.id} className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 text-sm hover:bg-muted/30">
            <button onClick={() => setExpanded(e => e === t.id ? null : t.id)} className="flex-1 flex items-center text-left gap-2 font-medium capitalize">
              {t.tier_type} — {t.currency} {Number(t.price).toLocaleString()}
            </button>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
               <Button variant="ghost" size="sm" onClick={() => removeTier(t.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
               <button onClick={() => setExpanded(e => e === t.id ? null : t.id)} className="p-1">
                 {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </button>
            </div>
          </div>
          {expanded === t.id && <div className="px-3 pb-3 border-t border-border pt-2"><FeatureList tierId={t.id} /></div>}
        </div>
      ))}
      
      <Dialog open={!!editId} onOpenChange={o => !o && setEditId(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>Edit Pricing Tier</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>Tier Name</Label><Input value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Gold, Silver, Custom" /></div>
            <div className="flex gap-2">
              <div className="space-y-1 flex-1"><Label>Price</Label><Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-1 w-24"><Label>Currency</Label><Input value={editForm.currency} onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input value={editForm.desc} onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))} /></div>
            <Button onClick={saveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Add Pricing Tier</p>
        <div className="flex flex-wrap gap-2">
          <Input value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} placeholder="Tier Name (e.g. Silver)" className="w-32 text-sm" />
          <Input value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" className="w-28 text-sm" />
          <Input value={addForm.currency} onChange={e => setAddForm(f => ({ ...f, currency: e.target.value }))} placeholder="GHS" className="w-20 text-sm" />
          <Input value={addForm.desc} onChange={e => setAddForm(f => ({ ...f, desc: e.target.value }))} placeholder="Description (optional)" className="flex-1 min-w-[150px] text-sm" />
          <Button size="sm" onClick={addTier} disabled={adding} className="bg-primary text-primary-foreground">
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
function SubServiceCard({ pkg }: { pkg: ServicePackage }) {
  const [subs, setSubs] = useState<SubService[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addName, setAddName] = useState('')
  const [adding, setAdding] = useState(false)
  
  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', display_order: 0, is_active: true })

  const load = () => getAllSubServices(pkg.id).then(setSubs)
  useEffect(() => { load() }, [pkg.id])

  const addSub = async () => {
    if (!addName.trim()) return
    setAdding(true)
    try { await createSubService({ package_id: pkg.id, name: addName.trim() }); setAddName(''); load() }
    catch { toast.error('Failed to add sub-service') } finally { setAdding(false) }
  }

  const handleEdit = (sub: SubService) => {
    setEditId(sub.id)
    setEditForm({ name: sub.name, display_order: sub.display_order, is_active: sub.is_active })
  }

  const saveEdit = async () => {
    if (!editId) return
    try {
      await updateSubService(editId, editForm)
      setEditId(null)
      load()
    } catch { toast.error('Failed to update') }
  }
  
  const removeSub = async (id: string) => {
    if (!confirm('Delete this sub-service?')) return
    try { await deleteSubService(id); load() } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-2">
      {subs.map(sub => (
        <div key={sub.id} className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
            <button onClick={() => setExpanded(e => e === sub.id ? null : sub.id)} className="flex-1 text-left font-medium flex items-center gap-2">
              {sub.name} {!sub.is_active && <span className="text-xs text-muted-foreground font-normal">(Inactive)</span>}
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(sub)} className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => removeSub(sub.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              <button onClick={() => setExpanded(e => e === sub.id ? null : sub.id)} className="p-1">
                {expanded === sub.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
            </div>
          </div>
          {expanded === sub.id && <div className="px-3 pb-3 border-t border-border"><TierSection subServiceId={sub.id} /></div>}
        </div>
      ))}
      
      <Dialog open={!!editId} onOpenChange={o => !o && setEditId(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>Edit Sub-Service</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1"><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Display Order</Label><Input type="number" value={editForm.display_order} onChange={e => setEditForm(f => ({ ...f, display_order: +e.target.value }))} /></div>
            <div className="flex items-center space-x-2"><Checkbox id={`active-${editId}`} checked={editForm.is_active} onCheckedChange={(c: boolean) => setEditForm(f => ({ ...f, is_active: c }))} /><Label htmlFor={`active-${editId}`}>Active</Label></div>
            <Button onClick={saveEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 mt-3">
        <Input value={addName} onChange={e => setAddName(e.target.value)} placeholder="New sub-service name" />
        <Button size="sm" onClick={addSub} disabled={adding} className="bg-primary text-primary-foreground shrink-0">
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />} Add
        </Button>
      </div>
    </div>
  )
}
export default function AdminServicesPage() {
  const [pkgs, setPkgs] = useState<ServicePackage[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newPkg, setNewPkg] = useState({ name: '', description: '', display_order: 0, is_active: true })
  const [addingPkg, setAddingPkg] = useState(false)
  const [addPkgOpen, setAddPkgOpen] = useState(false)
  
  const [editPkg, setEditPkg] = useState<ServicePackage | null>(null)

  const load = () => getAllServicePackages().then(setPkgs)
  useEffect(() => { load() }, [])

  const addPkg = async () => {
    if (!newPkg.name.trim()) return
    setAddingPkg(true)
    try { await createServicePackage({ name: newPkg.name.trim(), description: newPkg.description, display_order: newPkg.display_order, is_active: newPkg.is_active }); setNewPkg({ name: '', description: '', display_order: 0, is_active: true }); setAddPkgOpen(false); load() }
    catch { toast.error('Failed to add package') } finally { setAddingPkg(false) }
  }

  const saveEditPkg = async () => {
    if (!editPkg) return
    try {
      await updateServicePackage(editPkg.id, { name: editPkg.name, description: editPkg.description, display_order: editPkg.display_order, is_active: editPkg.is_active })
      setEditPkg(null)
      load()
    } catch { toast.error('Failed to update package') }
  }

  const removePkg = async (id: string) => {
    if (!confirm('Delete this service package?')) return
    try { await deleteServicePackage(id); load() } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Services Management</h1>
        <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Add Package</Button></DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>New Service Package</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label>Package Name</Label><Input value={newPkg.name} onChange={e => setNewPkg({ ...newPkg, name: e.target.value })} placeholder="e.g. Wedding Photography" /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={newPkg.description} onChange={e => setNewPkg({ ...newPkg, description: e.target.value })} rows={2} /></div>
              <div className="space-y-1"><Label>Display Order</Label><Input type="number" value={newPkg.display_order} onChange={e => setNewPkg({ ...newPkg, display_order: +e.target.value })} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="new-pkg-active" checked={newPkg.is_active} onCheckedChange={(c: boolean) => setNewPkg({ ...newPkg, is_active: c })} /><Label htmlFor="new-pkg-active">Active</Label></div>
              <Button onClick={addPkg} disabled={addingPkg} className="w-full bg-primary text-primary-foreground">{addingPkg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Package</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editPkg} onOpenChange={o => !o && setEditPkg(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>Edit Service Package</DialogTitle></DialogHeader>
          {editPkg && (
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label>Package Name</Label><Input value={editPkg.name} onChange={e => setEditPkg({ ...editPkg, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={editPkg.description || ''} onChange={e => setEditPkg({ ...editPkg, description: e.target.value })} rows={2} /></div>
              <div className="space-y-1"><Label>Display Order</Label><Input type="number" value={editPkg.display_order} onChange={e => setEditPkg({ ...editPkg, display_order: +e.target.value })} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="edit-pkg-active" checked={editPkg.is_active} onCheckedChange={(c: boolean) => setEditPkg({ ...editPkg, is_active: c })} /><Label htmlFor="edit-pkg-active">Active</Label></div>
              <Button onClick={saveEditPkg} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {pkgs.map(pkg => (
          <Card key={pkg.id} className="overflow-hidden">
            <CardHeader className="p-4 bg-muted/20 border-b border-border flex flex-row items-start justify-between cursor-pointer" onClick={() => setExpanded(e => e === pkg.id ? null : pkg.id)}>
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {pkg.name} {!pkg.is_active && <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">Inactive</span>}
                </CardTitle>
                {pkg.description && <p className="text-sm text-muted-foreground line-clamp-2 pr-4">{pkg.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditPkg(pkg) }}>Edit</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); removePkg(pkg.id) }}><Trash2 className="h-4 w-4" /></Button>
                <div className="ml-2">
                  {expanded === pkg.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>
            </CardHeader>
            {expanded === pkg.id && (
              <CardContent className="p-4 bg-background">
                <div className="pl-2 border-l-2 border-primary/20">
                  <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Sub-Services</h4>
                  <SubServiceCard pkg={pkg} />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {pkgs.length === 0 && (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
            No service packages found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}