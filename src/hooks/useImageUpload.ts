import { useState } from 'react'
import { toast } from 'sonner'

interface UseImageUploadOptions {
  bucket?: string
  folder?: string
}

interface UploadResult {
  url: string | null
  error: string | null
}

/** Stub image upload hook — stores images by URL reference (no storage backend) */
export function useImageUpload(_options: UseImageUploadOptions = {}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File): Promise<UploadResult> => {
    setUploading(true)
    setProgress(50)
    try {
      // Return object URL for local preview (admin can paste actual URL)
      const url = URL.createObjectURL(file)
      setProgress(100)
      toast.success('Image ready — paste a hosted URL for permanent storage.')
      return { url, error: null }
    } catch {
      toast.error('Upload failed')
      return { url: null, error: 'Upload failed' }
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  return { upload, uploading, progress }
}
