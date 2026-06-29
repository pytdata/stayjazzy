import { useEffect, useState, useRef } from 'react'
import { getClientLogos } from '@/db/api'
import type { ClientLogo } from '@/types/types'
import { getImageUrl } from '@/lib/mediaUrls'

// Fallback logos when no DB data

function LogoItem({ logo }: { logo: Partial<ClientLogo> }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="mx-8 flex flex-col items-center justify-center shrink-0">
      {logo.colored_logo_url || logo.bw_logo_url ? (
        <div className="relative w-24 h-16">
          <img
            src={getImageUrl(logo.bw_logo_url ?? logo.colored_logo_url)}
            alt={logo.client_name}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-600 ${inView ? 'opacity-0' : 'opacity-100'}`}
            style={{ filter: 'grayscale(100%)' }}
          />
          <img
            src={getImageUrl(logo.colored_logo_url ?? logo.bw_logo_url)}
            alt={logo.client_name}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-600 ${inView ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      ) : (
        <div className={`w-24 h-16 flex items-center justify-center rounded-lg border-2 transition-all duration-600 ${inView ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
          <span className="text-xs font-semibold text-center px-1 leading-tight">{logo.client_name}</span>
        </div>
      )}
    </div>
  )
}

export default function ClientLogosMarquee() {
  const [logos, setLogos] = useState<Partial<ClientLogo>[]>([])

  useEffect(() => {
    getClientLogos().then(data => { if (data.length > 0) setLogos(data) })
  }, [])

  const doubled = [...logos, ...logos]

  return (
    <section className="py-8 bg-muted/30 border-y border-border overflow-hidden">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Trusted by</p>
      <div className="overflow-hidden">
        <div className="marquee-track flex" style={{ width: `${doubled.length * 176}px` }}>
          {doubled.map((logo, i) => (
            <LogoItem key={`${logo.id}-${i}`} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  )
}
