/**
 * ImageCrop — lightweight canvas-based image cropper, zero extra deps.
 *
 * Props:
 *   src        – object URL or data URL of the image to crop
 *   aspect     – optional forced aspect ratio (e.g. 16/9, 1, 4/3). Default: free
 *   onConfirm  – called with the cropped File (WEBP)
 *   onCancel   – called when the user dismisses without cropping
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Crop, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react'

interface Rect { x: number; y: number; w: number; h: number }

interface ImageCropProps {
  src: string
  aspect?: number        // e.g. 16/9, 1 (square), 4/3. undefined = free
  onConfirm: (file: File) => void
  onCancel: () => void
  fileName?: string
}

const MIN_CROP = 40   // minimum crop side in canvas pixels

export default function ImageCrop({ src, aspect, onConfirm, onCancel, fileName = 'cropped.webp' }: ImageCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const dragging = useRef<{ mode: 'move' | 'resize-br' | 'new'; startX: number; startY: number; origCrop: Rect } | null>(null)

  // Load image
  useEffect(() => {
    const image = new Image()
    image.onload = () => setImg(image)
    image.src = src
  }, [src])

  // Calculate display scale and initial crop when image loads
  useEffect(() => {
    if (!img || !containerRef.current) return
    const maxW = containerRef.current.clientWidth || 640
    const maxH = Math.min(window.innerHeight * 0.55, 500)
    const s = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    setScale(s)

    const cw = img.naturalWidth * s
    const ch = img.naturalHeight * s
    // Default crop = centred 80% of canvas
    const margin = 0.1
    const initW = aspect
      ? Math.min(cw * 0.8, (ch * 0.8) * aspect)
      : cw * 0.8
    const initH = aspect ? initW / aspect : ch * 0.8
    setCrop({
      x: (cw - initW) / 2,
      y: (ch - initH) / 2,
      w: initW,
      h: initH,
    })
    // suppress unused warning
    void margin
  }, [img, aspect])

  // Draw canvas
  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current
    const cw = img.naturalWidth * scale
    const ch = img.naturalHeight * scale
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, 0, 0, cw, ch)
    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.50)'
    ctx.fillRect(0, 0, cw, ch)
    // Cut out crop area
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h)
    ctx.drawImage(img, 0, 0, cw, ch)
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h)
    ctx.drawImage(
      img,
      crop.x / scale, crop.y / scale,
      crop.w / scale, crop.h / scale,
      crop.x, crop.y,
      crop.w, crop.h
    )
    // Crop border
    ctx.strokeStyle = '#f7b808'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)
    // Corner handles
    const hs = 8
    ctx.fillStyle = '#f7b808'
    ;[[crop.x, crop.y], [crop.x + crop.w - hs, crop.y], [crop.x, crop.y + crop.h - hs], [crop.x + crop.w - hs, crop.y + crop.h - hs]].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, hs, hs)
    })
    // Grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 0.5
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(crop.x + (crop.w * i) / 3, crop.y); ctx.lineTo(crop.x + (crop.w * i) / 3, crop.y + crop.h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(crop.x, crop.y + (crop.h * i) / 3); ctx.lineTo(crop.x + crop.w, crop.y + (crop.h * i) / 3); ctx.stroke()
    }
  }, [img, scale, crop])

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const client = 'touches' in e ? e.touches[0] : e
    return {
      x: (client.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (client.clientY - rect.top) * (canvasRef.current.height / rect.height),
    }
  }, [])

  const hitTest = useCallback((px: number, py: number): 'move' | 'resize-br' | 'new' => {
    const hs = 16
    if (px >= crop.x + crop.w - hs && py >= crop.y + crop.h - hs) return 'resize-br'
    if (px >= crop.x && px <= crop.x + crop.w && py >= crop.y && py <= crop.y + crop.h) return 'move'
    return 'new'
  }, [crop])

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const { x, y } = getCanvasPoint(e)
    dragging.current = { mode: hitTest(x, y), startX: x, startY: y, origCrop: { ...crop } }
  }, [getCanvasPoint, hitTest, crop])

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current || !img || !canvasRef.current) return
    e.preventDefault()
    const { x, y } = getCanvasPoint(e)
    const dx = x - dragging.current.startX
    const dy = y - dragging.current.startY
    const { origCrop, mode } = dragging.current
    const cw = img.naturalWidth * scale
    const ch = img.naturalHeight * scale

    if (mode === 'move') {
      setCrop({
        ...origCrop,
        x: Math.max(0, Math.min(cw - origCrop.w, origCrop.x + dx)),
        y: Math.max(0, Math.min(ch - origCrop.h, origCrop.y + dy)),
      })
    } else if (mode === 'resize-br') {
      let nw = Math.max(MIN_CROP, origCrop.w + dx)
      let nh = aspect ? nw / aspect : Math.max(MIN_CROP, origCrop.h + dy)
      nw = Math.min(nw, cw - origCrop.x)
      nh = Math.min(nh, ch - origCrop.y)
      if (aspect) { nw = Math.min(nw, nh * aspect); nh = nw / aspect }
      setCrop({ ...origCrop, w: nw, h: nh })
    } else {
      // New selection
      let nx = Math.min(dragging.current.startX, x)
      let ny = Math.min(dragging.current.startY, y)
      let nw = Math.abs(x - dragging.current.startX)
      let nh = aspect ? nw / aspect : Math.abs(y - dragging.current.startY)
      nx = Math.max(0, Math.min(cw - nw, nx))
      ny = Math.max(0, Math.min(ch - nh, ny))
      nw = Math.min(nw, cw - nx)
      nh = Math.min(nh, ch - ny)
      if (nw > MIN_CROP && nh > MIN_CROP) setCrop({ x: nx, y: ny, w: nw, h: nh })
    }
  }, [getCanvasPoint, img, scale, aspect])

  const onPointerUp = useCallback(() => { dragging.current = null }, [])

  const zoom = (factor: number) => {
    if (!img) return
    const ns = Math.max(0.2, Math.min(3, scale * factor))
    setScale(ns)
  }

  const resetCrop = () => {
    if (!img) return
    const cw = img.naturalWidth * scale
    const ch = img.naturalHeight * scale
    const initW = aspect ? Math.min(cw * 0.8, (ch * 0.8) * aspect) : cw * 0.8
    const initH = aspect ? initW / aspect : ch * 0.8
    setCrop({ x: (cw - initW) / 2, y: (ch - initH) / 2, w: initW, h: initH })
  }

  const confirm = () => {
    if (!img) return
    const out = document.createElement('canvas')
    out.width = Math.round(crop.w / scale)
    out.height = Math.round(crop.h / scale)
    const ctx = out.getContext('2d')!
    ctx.drawImage(img, crop.x / scale, crop.y / scale, out.width, out.height, 0, 0, out.width, out.height)
    out.toBlob(blob => {
      if (!blob) return
      const baseName = fileName.replace(/\.[^.]+$/, '')
      onConfirm(new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
    }, 'image/webp', 0.9)
  }

  const cw = img ? img.naturalWidth * scale : 300
  const ch = img ? img.naturalHeight * scale : 200

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Crop className="h-4 w-4" /> Crop &amp; Resize
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Button type="button" size="icon" variant="outline" onClick={() => zoom(0.85)} className="h-8 w-8" title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button type="button" size="icon" variant="outline" onClick={() => zoom(1.18)} className="h-8 w-8" title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={resetCrop} className="h-8 w-8 ml-1" title="Reset crop">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full overflow-auto rounded-lg border border-border bg-black/90 select-none touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={cw}
          height={ch}
          style={{ display: 'block', maxWidth: '100%' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Drag to create a new crop area · drag inside to move · drag bottom-right corner to resize
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 gap-1.5">
          <X className="h-4 w-4" /> Skip cropping
        </Button>
        <Button type="button" onClick={confirm} className="flex-1 gap-1.5 bg-primary text-primary-foreground">
          <Check className="h-4 w-4" /> Apply crop
        </Button>
      </div>
    </div>
  )
}
