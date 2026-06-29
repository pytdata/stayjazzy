const GOOGLE_DRIVE_HOSTS = ['drive.google.com', 'docs.google.com']

function safeUrl(raw?: string | null): URL | null {
  if (!raw) return null
  try {
    return new URL(raw.trim())
  } catch {
    return null
  }
}

export function getGoogleDriveFileId(raw?: string | null): string | null {
  const url = safeUrl(raw)
  if (!url || !GOOGLE_DRIVE_HOSTS.includes(url.hostname)) return null

  const byId = url.searchParams.get('id')
  if (byId) return byId

  const match = url.pathname.match(/\/(?:file\/d|document\/d|presentation\/d|spreadsheets\/d)\/([^/]+)/)
  return match?.[1] ?? null
}

export function isGoogleDriveUrl(raw?: string | null): boolean {
  return !!getGoogleDriveFileId(raw)
}

export function getGoogleDrivePreviewUrl(raw?: string | null): string {
  const id = getGoogleDriveFileId(raw)
  return id ? `https://drive.google.com/file/d/${id}/preview` : (raw ?? '')
}

export function getImageUrl(raw?: string | null): string {
  const id = getGoogleDriveFileId(raw)
  if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`
  return raw ?? ''
}

export function getVideoUrl(raw?: string | null): string {
  if (!raw) return ''
  const driveId = getGoogleDriveFileId(raw)
  if (driveId) return getGoogleDrivePreviewUrl(raw)

  const url = safeUrl(raw)
  if (!url) return raw

  if (url.hostname === 'youtu.be') {
    const id = url.pathname.replace(/^\/+/, '')
    return id ? `https://www.youtube.com/embed/${id}` : raw
  }

  if (url.hostname.includes('youtube.com')) {
    const id = url.searchParams.get('v')
    if (id) return `https://www.youtube.com/embed/${id}`
    if (url.pathname.startsWith('/shorts/')) {
      return `https://www.youtube.com/embed/${url.pathname.split('/')[2]}`
    }
    if (url.pathname.startsWith('/embed/')) return raw
  }

  return raw
}

export function isEmbeddableVideoUrl(raw?: string | null): boolean {
  if (!raw) return false
  return isGoogleDriveUrl(raw) || raw.includes('youtube.com') || raw.includes('youtu.be')
}
