import { useEffect, useRef, useState } from 'react'
import { getPortfolioWorks, getPortfolioCategories } from '@/db/api'
import type { PortfolioWork } from '@/types/types'
import { trackPageView } from '@/db/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, X, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl, getVideoUrl, isEmbeddableVideoUrl } from '@/lib/mediaUrls'


// ─── Lightbox ────────────────────────────────────────────────────
interface LightboxProps {
  items: PortfolioWork[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function Lightbox({ items, index, onClose, onPrev, onNext }: LightboxProps) {
  const work = items[index]
  const videoRef = useRef<HTMLVideoElement>(null)

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  // Pause video when navigating
  useEffect(() => { videoRef.current?.pause() }, [index])

  const isVideo = !!work.video_url

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {items.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="relative max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
          {isVideo ? (
            isEmbeddableVideoUrl(work.video_url) ? (
              <iframe
                src={getVideoUrl(work.video_url)}
                className="w-full aspect-video max-h-[65vh]"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <video
                ref={videoRef}
                src={work.video_url!}
                controls
                autoPlay
                className="w-full max-h-[65vh] object-contain"
                onClick={e => e.stopPropagation()}
              />
            )
          ) : (
            <img
              src={getImageUrl(work.image_url)}
              alt={work.title}
              className="w-full max-h-[65vh] object-contain"
            />
          )}
        </div>

        {/* Caption */}
        <div className="mt-3 px-1">
          <div className="flex items-center gap-2">
            {work.category && (
              <span className="text-xs font-semibold uppercase tracking-wide text-[#f7b808]">
                {work.category}
              </span>
            )}
            {isVideo && (
              <span className="flex items-center gap-1 text-xs text-white/50">
                <Video className="h-3 w-3" /> Video
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-lg mt-0.5 text-balance">{work.title}</h3>
          {work.description && (
            <p className="text-white/60 text-sm mt-1 text-pretty">{work.description}</p>
          )}
          <p className="text-white/30 text-xs mt-2">{index + 1} / {items.length}</p>
        </div>
      </div>

      {/* Next */}
      {items.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

// ─── WorkCard ────────────────────────────────────────────────────
function WorkCard({ work, onClick }: { work: PortfolioWork; onClick: () => void }) {
  const isVideo = !!work.video_url
  const thumb = getImageUrl(work.image_url ?? 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0f631029-68b9-449f-9b3a-477672772737.jpg')

  return (
    <Card
      className="overflow-hidden group h-full border-border hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={thumb}
          alt={work.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Video play overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-[#f7b808] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-black fill-black ml-1" />
            </div>
          </div>
        )}
        {/* Hover overlay for images */}
        {!isVideo && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          {work.category && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">{work.category}</span>
          )}
          {isVideo && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Video className="h-3 w-3" /> Video
            </span>
          )}
        </div>
        <h3 className="font-bold text-base mb-1 text-balance">{work.title}</h3>
        {work.description && (
          <p className="text-muted-foreground text-sm text-pretty line-clamp-2">{work.description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function WorksPage() {
  const [works, setWorks] = useState<PortfolioWork[]>([])
  const [filter, setFilter] = useState('All')
  const [dbCategories, setDbCategories] = useState<import('@/types/types').PortfolioCategory[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video'>('all')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    trackPageView('/works')
    getPortfolioWorks().then(data => { if (data.length > 0) setWorks(data as PortfolioWork[]) })
    getPortfolioCategories().then(data => setDbCategories(data as import('@/types/types').PortfolioCategory[]))
  }, [])

  const categories = ['All', ...(dbCategories.length > 0 ? dbCategories.filter(c => c.is_active).sort((a,b) => a.display_order - b.display_order).map(c => c.name) : Array.from(new Set(works.map(w => w.category || 'Other').filter(Boolean))))]

  const filtered = works.filter(w => {
    const catMatch = filter === 'All' || w.category === filter
    const typeMatch = typeFilter === 'all'
      || (typeFilter === 'video' && !!w.video_url)
      || (typeFilter === 'photo' && !w.video_url)
    return catMatch && typeMatch
  })

  const videoWorks = works.filter(w => !!w.video_url)

  const openLightbox = (workId: string) => {
    const idx = filtered.findIndex(w => w.id === workId)
    if (idx !== -1) setLightboxIdx(idx)
  }

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section
        className="parallax-section py-20 relative text-white"
        style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1491cfa-3e23-4625-840d-c050a93c1d6c.jpg)` }}
      >
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f7b808] mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Our Works</h1>
          <p className="text-white/80 text-lg text-pretty">A showcase of creativity, professionalism, and results-driven multimedia production.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-12">

        {/* ── Video Gallery Section ─────────────────────────────── */}
        {videoWorks.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Video Portfolio</p>
                <h2 className="text-2xl font-bold text-balance">Video Gallery</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoWorks.map(work => {
                const globalIdx = filtered.findIndex(w => w.id === work.id)
                return (
                  <div key={work.id}>
                    <WorkCard
                      work={work}
                      onClick={() => {
                        // open in filtered list context, fall back to all works
                        const idx = filtered.findIndex(w => w.id === work.id)
                        setLightboxIdx(idx !== -1 ? idx : works.findIndex(w => w.id === work.id))
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── All Works (filtered grid) ─────────────────────────── */}
        <section>
          {videoWorks.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Portfolio</p>
                <h2 className="text-2xl font-bold text-balance">All Works</h2>
              </div>
            </div>
          )}

          {/* Category + type filters */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {/* Category buttons */}
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={filter === cat ? 'default' : 'outline'}
                onClick={() => setFilter(cat)}
                className={filter === cat ? 'bg-primary text-primary-foreground' : ''}
              >
                {cat}
              </Button>
            ))}

            {/* Type toggle (only show if there are videos) */}
            {videoWorks.length > 0 && (
              <div className="flex items-center gap-1 ml-auto border border-border rounded-lg p-0.5 bg-muted">
                {(['all', 'photo', 'video'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                      typeFilter === t
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t === 'all' ? 'All' : t === 'photo' ? 'Photos' : 'Videos'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No works found in this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((work, idx) => (
                <WorkCard key={work.id} work={work} onClick={() => setLightboxIdx(idx)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered.length > 0 && (
        <Lightbox
          items={filtered}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => i !== null ? (i - 1 + filtered.length) % filtered.length : 0)}
          onNext={() => setLightboxIdx(i => i !== null ? (i + 1) % filtered.length : 0)}
        />
      )}
    </div>
  )
}

