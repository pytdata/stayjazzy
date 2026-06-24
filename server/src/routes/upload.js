/**
 * POST /api/upload
 *
 * Accepts a single file under the field name "file".
 * Images  → max 10 MB raw (auto-compressed to WEBP by sharp)
 * Videos  → max 50 MB, stored as-is
 *
 * Returns: { url: "/uploads/<filename>" }
 * The caller prepends VITE_API_BASE_URL to get the full public URL.
 */

import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES]

const IMAGE_MAX = 10 * 1024 * 1024   // 10 MB raw (will be compressed)
const VIDEO_MAX = 50 * 1024 * 1024   // 50 MB

// Use memory storage so we can pass images through sharp before writing to disk
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: VIDEO_MAX },   // hard cap — sharp handles image compression
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  const { mimetype, buffer, originalname } = req.file
  const uuid = crypto.randomUUID().replace(/-/g, '')
  const safeName = originalname.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()

  try {
    let filename
    let outputBuffer

    if (IMAGE_TYPES.includes(mimetype)) {
      // Compress to WEBP, max 1080px on longest side
      filename = `${uuid}_${safeName.replace(/\.[^.]+$/, '')}.webp`
      outputBuffer = await sharp(buffer)
        .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
    } else {
      // Video — write directly
      const ext = path.extname(originalname) || '.mp4'
      filename = `${uuid}_${safeName}`
      outputBuffer = buffer
    }

    const dest = path.join(UPLOADS_DIR, filename)
    fs.writeFileSync(dest, outputBuffer)

    // Return relative URL — frontend prepends VITE_API_BASE_URL
    return res.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('Upload processing error:', err)
    return res.status(500).json({ error: 'File processing failed' })
  }
})
