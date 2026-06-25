/**
 * Resolves the backend base URL from VITE_API_BASE_URL.
 *
 * Callers build request URLs as `${API_BASE}/api/...`, so the base must NOT
 * already end in `/api`. This normalizes the env value — stripping trailing
 * slashes and a redundant trailing `/api` segment — so the app works whether
 * VITE_API_BASE_URL is configured as the bare origin
 * (e.g. https://stayjazzy-backend.vercel.app) or with the `/api` suffix
 * (e.g. https://stayjazzy-backend.vercel.app/api). Without this, a base ending
 * in `/api` produces broken `/api/api/...` URLs.
 */
export function normalizeApiBase(raw: string | undefined | null): string {
  return (raw ?? '').trim().replace(/\/+$/, '').replace(/\/api$/i, '')
}

const RAW = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Normalized backend origin (no trailing `/api`). Falls back to the local dev server. */
export const API_BASE = normalizeApiBase(RAW) || 'http://localhost:4000'

/** Origin used for the Socket.IO connection (never carries an `/api` suffix). */
export const SOCKET_BASE =
  normalizeApiBase((import.meta.env.VITE_SOCKET_URL as string) || RAW) || 'http://localhost:4000'
