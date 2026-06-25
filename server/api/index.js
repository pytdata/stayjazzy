// Vercel serverless function entry.
//
// An Express app is itself a valid (req, res) handler, so Vercel's Node
// runtime can invoke it directly. All routes are rewritten to this function
// by vercel.json, and Express does the internal routing.
import 'dotenv/config'
import app, { ensureSchema } from '../src/app.js'

// Warm the schema on cold start (best-effort; the DB routes also ensure it
// lazily, so a failure here never blocks request handling).
ensureSchema().catch(() => {})

export default app
