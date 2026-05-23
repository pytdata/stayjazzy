import { useRef } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useImageUpload } from '@/hooks/useImageUpload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  bucket: string
  folder?: string
  currentUrl?: string | null
  onUpload: (url: string) => void
  label?: string
  className?: string
}

export default function ImageUpload({ bucket, folder, currentUrl, onUpload, label = 'Upload Image', className }: ImageUploadProps) {
  const { upload, uploading, progress } = useImageUpload({ bucket, folder })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { url } = await upload(file)
    if (url) onUpload(url)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-2', className)}>
      {currentUrl && (
        <div className="relative rounded-md overflow-hidden border border-[hsl(var(--border))] aspect-video max-w-xs bg-[hsl(var(--muted))]">
          <img src={currentUrl} alt="Current" className="w-full h-full object-cover" />
        </div>
      )}
      {!currentUrl && (
        <div
          className="border-2 border-dashed border-[hsl(var(--border))] rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--primary))] transition-colors max-w-xs"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Click to upload</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">JPEG, PNG, WEBP • Max 10MB</span>
        </div>
      )}
      {uploading && (
        <div className="max-w-xs space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Uploading... {progress}%</p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading...' : currentUrl ? 'Change Image' : label}
      </Button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" className="hidden" onChange={handleFile} />
    </div>
  )
}
