/**
 * MediaUpload — reusable click-to-upload component with optional image crop
 *
 * Props:
 *   value       – current public URL (shown as preview)
 *   onChange    – called with the new public URL after upload
 *   accept      – 'image' | 'video' | 'both'  (default 'image')
 *   label       – field label shown above the dropzone
 *   aspect      – optional crop aspect ratio (e.g. 16/9, 1). Image mode only.
 *   className   – extra classes on the root wrapper
 *
 * Limits enforced client-side:
 *   images  → 2 MB (compressed to WEBP/1080p/0.8q if over limit)
 *   videos  → 5 MB (no auto-compression — user must trim first)
 *
 * Files are stored in the Supabase `uploads` bucket under:
 *   uploads/<type>/<uuid>.<ext>
 */

import { useRef, useState } from 'react'
import { Upload, X, ImageIcon, Video, Loader2 } from 'lucide-react'
import { supabase } from '@/db/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ImageCrop from '@/components/ui/ImageCrop'

const IMAGE_LIMIT = 2 * 1024 * 1024   // 2 MB
const VIDEO_LIMIT = 5 * 1024 * 1024   // 5 MB

type Accept = 'image' | 'video' | 'both'

interface MediaUploadProps {
  value?: string | null
  onChange: (url: string) => void
  accept?: Accept
  label?: string
  aspect?: number        // e.g. 16/9, 1 (square). Only applies for images.
  className?: string
}

// ─── Image compression helper ────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_SIDE = 1080
      let { width, height } = img
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) { height = Math.round((height / width) * MAX_SIDE); width = MAX_SIDE }
        else { width = Math.round((width / height) * MAX_SIDE); height = MAX_SIDE }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      let quality = 0.8
      const tryCompress = () => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Canvas to blob failed')); return }
          if (blob.size <= IMAGE_LIMIT || quality <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          } else { quality -= 0.1; tryCompress() }
        }, 'image/webp', quality)
      }
      tryCompress()
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

// ─── Sanitise filename (letters + numbers only) ──────────────────
function sanitiseName(name: string) {
  return name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()
}

export default function MediaUpload({ value, onChange, accept = 'image', label, aspect, className }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  // Crop state: null = no crop pending, string = object URL of file awaiting crop
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const pendingFileRef = useRef<File | null>(null)

  const mimeTypes = accept === 'image'
    ? 'image/jpeg,image/png,image/gif,image/webp,image/avif'
    : accept === 'video'
    ? 'video/mp4,video/webm,video/ogg,video/quicktime'
    : 'image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/ogg,video/quicktime'

  // ── Core upload logic (runs after optional crop) ──────────────
  const uploadFile = async (file: File) => {
    setUploading(true); setProgress(0)

    const ext = file.name.split('.').pop() || 'bin'
    const folder = file.type.startsWith('video/') ? 'videos' : 'images'
    const uuid = crypto.randomUUID().replace(/-/g, '')
    const path = `${folder}/${uuid}_${sanitiseName(file.name.replace(/\.[^.]+$/, ''))}.${ext}`

    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 12, 88)), 150)
    const { error } = await supabase.storage.from('uploads').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    })
    clearInterval(progressInterval); setProgress(100)

    if (error) {
      toast.error(`Upload failed: ${error.message}`)
      setUploading(false); setProgress(0); return
    }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
    onChange(urlData.publicUrl)
    toast.success('File uploaded successfully')
    setUploading(false); setProgress(0)
  }

  // ── File selected (from input or drop) ───────────────────────
  const handleFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isImage && !isVideo) { toast.error('Unsupported file type'); return }
    if (accept === 'image' && !isImage) { toast.error('Please select an image file'); return }
    if (accept === 'video' && !isVideo) { toast.error('Please select a video file'); return }

    if (isVideo) {
      if (file.size > VIDEO_LIMIT) {
        toast.error(`Video exceeds 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB). Please trim or compress first.`)
        return
      }
      await uploadFile(file)
      return
    }

    // Images: show crop first, then compress + upload on confirm
    const objUrl = URL.createObjectURL(file)
    pendingFileRef.current = file
    setCropSrc(objUrl)
  }

  // ── Crop confirmed ────────────────────────────────────────────
  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null); pendingFileRef.current = null

    let toUpload = croppedFile
    if (toUpload.size > IMAGE_LIMIT) {
      toast.info('Compressing image…')
      try {
        toUpload = await compressImage(toUpload)
        toast.success(`Compressed to ${(toUpload.size / 1024).toFixed(0)} KB`)
      } catch {
        toast.error('Compression failed — try a smaller image')
        return
      }
    }
    await uploadFile(toUpload)
  }

  // ── Crop skipped (upload original with optional compression) ──
  const handleCropSkip = async () => {
    const file = pendingFileRef.current
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null); pendingFileRef.current = null
    if (!file) return

    let toUpload = file
    if (toUpload.size > IMAGE_LIMIT) {
      toast.info('Image is too large — compressing…')
      try {
        toUpload = await compressImage(toUpload)
        toast.success(`Compressed to ${(toUpload.size / 1024).toFixed(0)} KB`)
      } catch {
        toast.error('Compression failed — try a smaller image')
        return
      }
    }
    await uploadFile(toUpload)
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
              {accept === 'image' && 'JPEG · PNG · WEBP · GIF — max 2 MB'}
              {accept === 'video' && 'MP4 · WEBM · MOV — max 5 MB'}
              {accept === 'both' && 'Images (max 2 MB) · Videos (max 5 MB)'}
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


