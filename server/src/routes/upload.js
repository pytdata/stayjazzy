/**
 * POST /api/upload/file
 *
 * Media is URL-only in this application. Admin screens save Google Drive or
 * YouTube URLs directly to the relevant database rows, so binary uploads are
 * intentionally disabled.
 */

import { Router } from 'express'

export const uploadRouter = Router()

uploadRouter.post('/', (_req, res) => {
  return res.status(410).json({
    error: 'File uploads are disabled. Add a Google Drive or YouTube URL in the admin form instead.',
  })
})
