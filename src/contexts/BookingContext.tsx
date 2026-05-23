import { createContext, useContext, useState, type ReactNode } from 'react'
import type { SelectedService } from '@/types/types'

interface BookingContextValue {
  selectedServices: SelectedService[]
  addService: (service: SelectedService) => void
  removeService: (subServiceId: string, tierType: string) => void
  clearServices: () => void
  bookingToken: string | null
  setBookingToken: (token: string | null) => void
  currentBookingId: string | null
  setCurrentBookingId: (id: string | null) => void
}

const BookingContext = createContext<BookingContextValue>({
  selectedServices: [], addService: () => {}, removeService: () => {}, clearServices: () => {},
  bookingToken: null, setBookingToken: () => {},
  currentBookingId: null, setCurrentBookingId: () => {},
})

const BK_SESSION_KEY = 'sj_booking_session'

interface SessionData { bookingId: string; token: string }

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [bookingToken, setBookingTokenState] = useState<string | null>(() => {
    const d = sessionStorage.getItem(BK_SESSION_KEY)
    return d ? (JSON.parse(d) as SessionData).token : null
  })
  const [currentBookingId, setCurrentBookingIdState] = useState<string | null>(() => {
    const d = sessionStorage.getItem(BK_SESSION_KEY)
    return d ? (JSON.parse(d) as SessionData).bookingId : null
  })

  const addService = (service: SelectedService) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.sub_service_id === service.sub_service_id && s.tier_type === service.tier_type)
      return exists ? prev : [...prev, service]
    })
  }

  const removeService = (subServiceId: string, tierType: string) => {
    setSelectedServices(prev => prev.filter(s => !(s.sub_service_id === subServiceId && s.tier_type === tierType)))
  }

  const clearServices = () => setSelectedServices([])

  const setBookingToken = (token: string | null) => {
    setBookingTokenState(token)
    if (token && currentBookingId) sessionStorage.setItem(BK_SESSION_KEY, JSON.stringify({ bookingId: currentBookingId, token }))
    else sessionStorage.removeItem(BK_SESSION_KEY)
  }

  const setCurrentBookingId = (id: string | null) => {
    setCurrentBookingIdState(id)
    if (id && bookingToken) sessionStorage.setItem(BK_SESSION_KEY, JSON.stringify({ bookingId: id, token: bookingToken }))
    else sessionStorage.removeItem(BK_SESSION_KEY)
  }

  return (
    <BookingContext.Provider value={{ selectedServices, addService, removeService, clearServices, bookingToken, setBookingToken, currentBookingId, setCurrentBookingId }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => useContext(BookingContext)
