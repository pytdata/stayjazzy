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
import { getServicePackages, createServicePackage, getSubServices, createSubService, getPricingTiers, createPricingTier, getPricingFeatures, createPricingFeature, deletePricingFeature } from '@/db/api'
import type { ServicePackage, SubService, PricingTier, PricingFeature } from '@/types/types'
import { toast } from 'sonner'

const TIER_TYPES = ['gold', 'diamond', 'platinum'] as const

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
  const [addForm, setAddForm] = useState<{ type: string; price: string; currency: string; desc: string }>({ type: 'gold', price: '', currency: 'GHS', desc: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { getPricingTiers(subServiceId).then(setTiers) }, [subServiceId])

  const addTier = async () => {
    if (!addForm.price) return
    setAdding(true)
    try {
      await createPricingTier({ sub_service_id: subServiceId, tier_type: addForm.type as 'gold' | 'diamond' | 'platinum', price: parseFloat(addForm.price), currency: addForm.currency, description: addForm.desc || undefined })
      getPricingTiers(subServiceId).then(setTiers)
      setAddForm({ type: 'gold', price: '', currency: 'GHS', desc: '' })
    } catch { toast.error('Failed to add tier') } finally { setAdding(false) }
  }

  return (
    <div className="mt-3 space-y-2">
      {tiers.map(t => (
        <div key={t.id} className="border border-border rounded-lg overflow-hidden">
          <button onClick={() => setExpanded(e => e === t.id ? null : t.id)}
            className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/30">
            <span className="font-medium capitalize">{t.tier_type} — {t.currency} {Number(t.price).toLocaleString()}</span>
            {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded === t.id && <div className="px-3 pb-3"><FeatureList tierId={t.id} /></div>}
        </div>
      ))}
      <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Add Pricing Tier</p>
        <div className="flex flex-wrap gap-2">
          <Select value={addForm.type} onValueChange={v => setAddForm(f => ({ ...f, type: v }))}>
            <SelectTrigger className="w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" type="number" className="w-28 text-sm" />
          <Input value={addForm.currency} onChange={e => setAddForm(f => ({ ...f, currency: e.target.value }))} placeholder="GHS" className="w-20 text-sm" />
          <Input value={addForm.desc} onChange={e => setAddForm(f => ({ ...f, desc: e.target.value }))} placeholder="Description (optional)" className="flex-1 min-w-[140px] text-sm" />
          <Button size="sm" onClick={addTier} disabled={adding} className="bg-primary text-primary-foreground shrink-0">
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />} Add
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

  const load = () => getSubServices(pkg.id).then(setSubs)
  useEffect(() => { load() }, [pkg.id])

  const addSub = async () => {
    if (!addName.trim()) return
    setAdding(true)
    try { await createSubService({ package_id: pkg.id, name: addName.trim() }); setAddName(''); load() }
    catch { toast.error('Failed to add sub-service') } finally { setAdding(false) }
  }

  return (
    <div className="space-y-2">
      {subs.map(sub => (
        <div key={sub.id} className="border border-border rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(e => e === sub.id ? null : sub.id)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-sm font-medium text-left">
            {sub.name}
            {expanded === sub.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>
          {expanded === sub.id && <div className="px-3 pb-3 border-t border-border"><TierSection subServiceId={sub.id} /></div>}
        </div>
      ))}
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
  const [newPkg, setNewPkg] = useState({ name: '', description: '' })
  const [addingPkg, setAddingPkg] = useState(false)
  const [addPkgOpen, setAddPkgOpen] = useState(false)

  const load = () => getServicePackages().then(setPkgs)
  useEffect(() => { load() }, [])

  const addPkg = async () => {
    if (!newPkg.name.trim()) return
    setAddingPkg(true)
    try { await createServicePackage({ name: newPkg.name.trim(), description: newPkg.description }); setNewPkg({ name: '', description: '' }); setAddPkgOpen(false); load() }
    catch { toast.error('Failed to add package') } finally { setAddingPkg(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Services Management</h1>
        <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground gap-1.5 shrink-0"><Plus className="h-4 w-4" /> Add Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>New Service Package</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label htmlFor="pkg-name">Package Name</Label><Input id="pkg-name" value={newPkg.name} onChange={e => setNewPkg(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label htmlFor="pkg-desc">Description</Label><Textarea id="pkg-desc" value={newPkg.description} onChange={e => setNewPkg(p => ({ ...p, description: e.target.value }))} /></div>
              <Button onClick={addPkg} disabled={addingPkg} className="w-full bg-primary text-primary-foreground">
                {addingPkg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Package
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pkgs.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No service packages yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {pkgs.map(pkg => (
            <Card key={pkg.id} className="border-border">
              <button onClick={() => setExpanded(e => e === pkg.id ? null : pkg.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Badge variant={pkg.is_active ? 'default' : 'secondary'} className={pkg.is_active ? 'bg-primary' : ''}>{pkg.is_active ? 'Active' : 'Inactive'}</Badge>
                  <span className="font-semibold">{pkg.name}</span>
                </div>
                {expanded === pkg.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {expanded === pkg.id && (
                <CardContent className="pt-0 border-t border-border">
                  {pkg.description && <p className="text-muted-foreground text-sm mb-4">{pkg.description}</p>}
                  <h4 className="font-semibold text-sm mb-3">Sub-Services</h4>
                  <SubServiceCard pkg={pkg} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
