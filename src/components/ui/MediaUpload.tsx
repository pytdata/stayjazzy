/**
 * MediaUpload — reusable click-to-upload component with optional image crop
 *
 * Uploads to the Express backend at VITE_API_BASE_URL/api/upload
 * Files are stored in server/uploads/ and served as static assets.
 *
 * Props:
 *   value       – current public URL (shown as preview)
 *   onChange    – called with the new public URL after upload
 *   accept      – 'image' | 'video' | 'both'  (default 'image')
 *   label       – field label shown above the dropzone
 *   aspect      – optional crop aspect ratio for images (e.g. 16/9, 1)
 *   className   – extra classes on the root wrapper
 *
 * Limits (client-side guard; server also validates):
 *   images → 10 MB  (server compresses to WEBP/1080p via sharp)
 *   videos → 50 MB  (stored as-is)
 */

import { useRef, useState } from 'react'
import { Upload, X, ImageIcon, Video, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ImageCrop from '@/components/ui/ImageCrop'

const IMAGE_LIMIT = 10 * 1024 * 1024   // 10 MB
const VIDEO_LIMIT = 50 * 1024 * 1024   // 50 MB

// When empty or not set, use relative paths so Vite dev-server proxy handles /api and /uploads
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string)?.trim() || ''

type Accept = 'image' | 'video' | 'both'

interface MediaUploadProps {
  value?: string | null
  onChange: (url: string) => void
  accept?: Accept
  label?: string
  aspect?: number
  className?: string
}

export default function MediaUpload({ value, onChange, accept = 'image', label, aspect, className }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const pendingFileRef = useRef<File | null>(null)

  const mimeTypes = accept === 'image'
    ? 'image/jpeg,image/png,image/gif,image/webp,image/avif'
    : accept === 'video'
    ? 'video/mp4,video/webm,video/ogg,video/quicktime'
    : 'image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/ogg,video/quicktime'

  // ── POST multipart to Express /api/upload ─────────────────────
  const uploadToServer = async (file: File) => {
    setUploading(true)
    setProgress(0)

    const tick = setInterval(() => setProgress(p => Math.min(p + 10, 88)), 200)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(tick)
      setProgress(100)

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error || 'Upload failed')
      }

      const { url } = await res.json()
      // url is relative e.g. /uploads/abc.webp — prepend API_BASE for full URL
      onChange(`${API_BASE}${url}`)
      toast.success('File uploaded successfully')
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  // ── File selected from input or drop ─────────────────────────
  const handleFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isImage && !isVideo) { toast.error('Unsupported file type'); return }
    if (accept === 'image' && !isImage) { toast.error('Please select an image file'); return }
    if (accept === 'video' && !isVideo) { toast.error('Please select a video file'); return }

    if (isVideo) {
      if (file.size > VIDEO_LIMIT) {
        toast.error(`Video exceeds 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB). Please compress it first.`)
        return
      }
      await uploadToServer(file)
      return
    }

    // Images — open crop tool first
    if (file.size > IMAGE_LIMIT) {
      toast.error(`Image exceeds 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB). Please use a smaller file.`)
      return
    }
    pendingFileRef.current = file
    setCropSrc(URL.createObjectURL(file))
  }

  // ── Crop confirmed ────────────────────────────────────────────
  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    pendingFileRef.current = null
    await uploadToServer(croppedFile)
  }

  // ── Crop skipped — upload original ────────────────────────────
  const handleCropSkip = async () => {
    const file = pendingFileRef.current
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    pendingFileRef.current = null
    if (file) await uploadToServer(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isVideoPreview = value?.match(/\.(mp4|webm|ogg|mov)$/i)

  // ── Crop mode ─────────────────────────────────────────────────
  if (cropSrc) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <p className="text-sm font-normal text-foreground">{label}</p>}
        <ImageCrop
          src={cropSrc}
          aspect={aspect}
          fileName={pendingFileRef.current?.name}
          onConfirm={handleCropConfirm}
          onCancel={handleCropSkip}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-sm font-normal text-foreground">{label}</p>}

      {/* Preview */}
      {value && !uploading && (
        <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted">
          {isVideoPreview
            ? <video src={value} controls className="w-full max-h-48 object-contain bg-black" />
            : <img src={value} alt="Preview" className="w-full max-h-48 object-cover" />
          }
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone */}
      {!value && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-border',
            'py-8 px-4 cursor-pointer transition-colors hover:border-primary hover:bg-muted/50',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          {uploading
            ? <Loader2 className="h-7 w-7 text-primary animate-spin" />
            : accept === 'video'
            ? <Video className="h-7 w-7 text-muted-foreground" />
            : <ImageIcon className="h-7 w-7 text-muted-foreground" />
          }
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {uploading ? 'Uploading…' : 'Click or drag & drop to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accept === 'image' && 'JPEG · PNG · WEBP · GIF — max 10 MB'}
              {accept === 'video' && 'MP4 · WEBM · MOV — max 50 MB'}
              {accept === 'both' && 'Images (max 10 MB) · Videos (max 50 MB)'}
            </p>
            {accept !== 'video' && (
              <p className="text-xs text-primary mt-0.5 font-medium">✂ Crop tool opens automatically for images</p>
            )}
          </div>
        </div>
      )}

      {/* Replace button */}
      {value && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
        >
          <Upload className="h-3.5 w-3.5" /> Replace file
        </button>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={mimeTypes}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = '' } }}
      />
    </div>
  )
}
