import type { ReactNode } from 'react'

export interface RouteConfig {
  name: string
  path: string
  element: ReactNode
  public?: boolean
}

// Routes are defined directly in App.tsx
export const routes: RouteConfig[] = []
