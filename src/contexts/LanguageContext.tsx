import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Lang = 'en' | 'fr' | 'es' | 'de' | 'nl' | 'pl' | 'zh'

const FLAGS: Record<Lang, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },
  fr: { flag: '🇫🇷', label: 'French' },
  es: { flag: '🇪🇸', label: 'Spanish' },
  de: { flag: '🇩🇪', label: 'German' },
  nl: { flag: '🇳🇱', label: 'Dutch' },
  pl: { flag: '🇵🇱', label: 'Polish' },
  zh: { flag: '🇨🇳', label: 'Chinese' },
}

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  flags: typeof FLAGS
}

const STORAGE_KEY = 'sj_lang'

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k: string) => k,
  flags: FLAGS,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    return saved && FLAGS[saved] ? saved : 'en'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : l
  }

  const t = (key: string) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, flags: FLAGS }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

// Simple translation dictionary
const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    home: 'Home', whoWeAre: 'Who We Are', offers: 'Offers', works: 'Works',
    contact: 'Contact Us', checkBooking: 'Check Booking', admin: 'Admin',
    bookAppointment: 'Book Appointment', selectPackage: 'Select Package',
    selected: 'Selected', enquiryNow: 'Enquire Now',
    pricingComingSoon: 'Pricing for {name} coming soon.',
    servicePackages: 'Service Packages & Pricing',
    ourServices: 'Our Services',
    customizeService: 'Customize Your Service',
    customizeServiceDesc: 'Describe the service you need and our team will tailor a package for you.',
    typeServiceRequest: 'Describe the kind of service you want...',
    submitRequest: 'Submit Custom Request',
    requestSubmitted: 'Your request has been submitted! We will contact you soon.',
  },
  fr: {
    home: 'Accueil', whoWeAre: 'Qui Sommes-Nous', offers: 'Offres', works: 'Réalisations',
    contact: 'Contactez-Nous', checkBooking: 'Vérifier Réservation', admin: 'Admin',
    bookAppointment: 'Prendre Rendez-Vous', selectPackage: 'Choisir Forfait',
    selected: 'Sélectionné', enquiryNow: 'Demander Maintenant',
    pricingComingSoon: 'Les tarifs pour {name} arrivent bientôt.',
    servicePackages: 'Forfaits & Tarifs',
    ourServices: 'Nos Services',
    customizeService: 'Personnalisez Votre Service',
    customizeServiceDesc: 'Décrivez le service dont vous avez besoin et notre équipe créera un forfait sur mesure.',
    typeServiceRequest: 'Décrivez le service souhaité...',
    submitRequest: 'Envoyer la Demande',
    requestSubmitted: 'Votre demande a été envoyée ! Nous vous contacterons bientôt.',
  },
  es: {
    home: 'Inicio', whoWeAre: 'Quiénes Somos', offers: 'Ofertas', works: 'Trabajos',
    contact: 'Contáctenos', checkBooking: 'Verificar Reserva', admin: 'Admin',
    bookAppointment: 'Reservar Cita', selectPackage: 'Seleccionar Paquete',
    selected: 'Seleccionado', enquiryNow: 'Consultar Ahora',
    pricingComingSoon: 'Los precios para {name} próximamente.',
    servicePackages: 'Paquetes y Precios',
    ourServices: 'Nuestros Servicios',
    customizeService: 'Personalice Su Servicio',
    customizeServiceDesc: 'Describa el servicio que necesita y nuestro equipo le preparará un paquete a medida.',
    typeServiceRequest: 'Describa el servicio que desea...',
    submitRequest: 'Enviar Solicitud',
    requestSubmitted: '¡Su solicitud ha sido enviada! Nos pondremos en contacto pronto.',
  },
  de: {
    home: 'Startseite', whoWeAre: 'Über Uns', offers: 'Angebote', works: 'Projekte',
    contact: 'Kontakt', checkBooking: 'Buchung Prüfen', admin: 'Admin',
    bookAppointment: 'Termin Buchen', selectPackage: 'Paket Wählen',
    selected: 'Ausgewählt', enquiryNow: 'Jetzt Anfragen',
    pricingComingSoon: 'Preise für {name} demnächst verfügbar.',
    servicePackages: 'Pakete & Preise',
    ourServices: 'Unsere Leistungen',
    customizeService: 'Service Anpassen',
    customizeServiceDesc: 'Beschreiben Sie den gewünschten Service und unser Team erstellt ein maßgeschneidertes Paket.',
    typeServiceRequest: 'Beschreiben Sie die gewünschte Leistung...',
    submitRequest: 'Anfrage Senden',
    requestSubmitted: 'Ihre Anfrage wurde gesendet! Wir werden uns bald bei Ihnen melden.',
  },
  nl: {
    home: 'Home', whoWeAre: 'Over Ons', offers: 'Aanbiedingen', works: 'Werken',
    contact: 'Contact', checkBooking: 'Boeking Controleren', admin: 'Admin',
    bookAppointment: 'Afspraak Maken', selectPackage: 'Pakket Kiezen',
    selected: 'Geselecteerd', enquiryNow: 'Nu Vragen',
    pricingComingSoon: 'Prijzen voor {name} binnenkort beschikbaar.',
    servicePackages: 'Pakketten & Prijzen',
    ourServices: 'Onze Diensten',
    customizeService: 'Service Aanpassen',
    customizeServiceDesc: 'Beschrijf de service die u nodig heeft en ons team maakt een op maat gemaakt pakket.',
    typeServiceRequest: 'Beschrijf het soort service dat u wilt...',
    submitRequest: 'Verzoek Indienen',
    requestSubmitted: 'Uw verzoek is ingediend! We nemen binnenkort contact met u op.',
  },
  pl: {
    home: 'Strona Główna', whoWeAre: 'O Nas', offers: 'Oferty', works: 'Realizacje',
    contact: 'Kontakt', checkBooking: 'Sprawdź Rezerwację', admin: 'Admin',
    bookAppointment: 'Zarezerwuj Wizytę', selectPackage: 'Wybierz Pakiet',
    selected: 'Wybrano', enquiryNow: 'Zapytaj Teraz',
    pricingComingSoon: 'Ceny dla {name} wkrótce dostępne.',
    servicePackages: 'Pakiety i Ceny',
    ourServices: 'Nasze Usługi',
    customizeService: 'Dostosuj Usługę',
    customizeServiceDesc: 'Opisz potrzebną usługę, a nasz zespół przygotuje dla Ciebie spersonalizowany pakiet.',
    typeServiceRequest: 'Opisz rodzaj usługi, której potrzebujesz...',
    submitRequest: 'Wyślij Zapytanie',
    requestSubmitted: 'Twoje zapytanie zostało wysłane! Skontaktujemy się z Tobą wkrótce.',
  },
  zh: {
    home: '首页', whoWeAre: '关于我们', offers: '服务报价', works: '作品展示',
    contact: '联系我们', checkBooking: '查询预约', admin: '管理后台',
    bookAppointment: '预约服务', selectPackage: '选择套餐',
    selected: '已选择', enquiryNow: '立即咨询',
    pricingComingSoon: '{name} 的定价即将推出。',
    servicePackages: '服务套餐与定价',
    ourServices: '我们的服务',
    customizeService: '定制您的服务',
    customizeServiceDesc: '描述您需要的服务，我们的团队将为您量身定制套餐。',
    typeServiceRequest: '描述您想要的服务类型...',
    submitRequest: '提交定制请求',
    requestSubmitted: '您的请求已提交！我们将尽快与您联系。',
  },
}
