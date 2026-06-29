import React, { useState } from 'react'
import { Input } from './input'
import { Label } from './label'
import { Button } from './button'
import { Link, X } from 'lucide-react'
import { getGoogleDrivePreviewUrl, getImageUrl, getVideoUrl, isEmbeddableVideoUrl, isGoogleDriveUrl } from '@/lib/mediaUrls'

interface MediaUploadProps {
  label?: string
  value?: string | null
  onChange: (url: string) => void
  accept?: 'image' | 'video'
}

export default function MediaUpload({ label, value, onChange, accept = 'image' }: MediaUploadProps) {
  const [inputValue, setInputValue] = useState(value || '')

  const previewValue = value || ''
  const isDrive = isGoogleDriveUrl(previewValue)
  const imagePreviewUrl = getImageUrl(previewValue)
  const videoPreviewUrl = getVideoUrl(previewValue)
  const shouldEmbedVideo = accept === 'video' && isEmbeddableVideoUrl(previewValue)

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}
      
      {!value ? (
        <div className="flex gap-2">
          <Input 
            placeholder={accept === 'image' ? "Enter Google Drive Image URL..." : "Enter YouTube/Drive Video URL..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button type="button" onClick={() => onChange(inputValue)}>
            <Link className="h-4 w-4 mr-2" /> Apply URL
          </Button>
        </div>
      ) : (
        <div className="relative border rounded-lg p-2 overflow-hidden bg-card">
          <Button 
            type="button" 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 z-10 rounded-full h-6 w-6"
            onClick={() => { setInputValue(''); onChange(''); }}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {accept === 'image' ? (
            <div className="aspect-video w-full flex items-center justify-center bg-muted overflow-hidden">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : shouldEmbedVideo ? (
             <div className="aspect-video w-full">
               <iframe 
                 className="w-full h-full"
                 src={videoPreviewUrl}
                 allowFullScreen 
               />
             </div>
          ) : isDrive ? (
             <div className="aspect-video w-full bg-muted flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                <iframe className="w-full h-full" src={getGoogleDrivePreviewUrl(value)} allow="autoplay" />
             </div>
          ) : (
            <div className="aspect-video w-full flex items-center justify-center bg-muted overflow-hidden">
              <video src={previewValue} className="w-full h-full object-cover" controls />
            </div>
          )}
          <a href={value} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-primary hover:underline break-all">
            {value}
          </a>
        </div>
      )}
    </div>
  )
}
