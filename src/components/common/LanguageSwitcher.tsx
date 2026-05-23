import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

type Lang = 'en' | 'fr' | 'es' | 'de' | 'nl' | 'pl' | 'zh'

export default function LanguageSwitcher() {
  const { lang, setLang, flags } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium"
      >
        <Globe className="h-4 w-4" />
        <span className="text-lg leading-none">{flags[lang].flag}</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden">
            {(Object.entries(flags) as [Lang, { flag: string; label: string }][]).map(([key, { flag, label }]) => (
              <button
                key={key}
                onClick={() => { setLang(key); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                  lang === key ? 'bg-primary/5 font-semibold text-primary' : 'text-foreground'
                }`}
              >
                <span className="text-lg leading-none">{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
