import re

with open('/workspace/app-bu4kziuqa9dt/src/pages/admin/AdminServicesPage.tsx', 'r') as f:
    content = f.read()

# Replace TIER_TYPES constant
content = re.sub(r"const TIER_TYPES = \['gold', 'diamond', 'platinum'\] as const\n", "", content)

# Need to make sure import { updatePricingTier, deletePricingTier } is present
if 'updatePricingTier' not in content:
    content = content.replace('createPricingTier, getPricingFeatures', 'createPricingTier, updatePricingTier, deletePricingTier, getPricingFeatures')

tier_section_code = """function TierSection({ subServiceId }: { subServiceId: string }) {
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
}"""

content = re.sub(
    r'function TierSection\(\{ subServiceId \}: \{ subServiceId: string \}\) \{.*?\n\}\n(?=\nfunction SubServiceCard)',
    tier_section_code,
    content,
    flags=re.DOTALL
)

with open('/workspace/app-bu4kziuqa9dt/src/pages/admin/AdminServicesPage.tsx', 'w') as f:
    f.write(content)
