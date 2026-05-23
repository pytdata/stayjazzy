import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/db/api'

export function usePageTracking() {
  const location = useLocation()
  useEffect(() => {
    const id = sessionStorage.getItem('visitor_id') || (() => {
      const v = crypto.randomUUID()
      sessionStorage.setItem('visitor_id', v)
      return v
    })()
    trackPageView(location.pathname, id)
  }, [location.pathname])
}
