// ============================================================
// Traditional Node server entry (long-running host / local dev)
// ------------------------------------------------------------
// Wraps the shared Express app with an HTTP server + Socket.IO and
// binds a port. On serverless (Vercel) the app is served via
// api/index.js instead, where Socket.IO is not used.
// ============================================================
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'

import app, { ensureSchema } from './app.js'

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 4000

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join', (topic) => {
    socket.join(topic)
  })
  socket.on('send_message', (data) => {
    if (data.topic) {
      io.to(data.topic).emit('new_message', data.payload)
    }
  })
  socket.on('update_conversation', (data) => {
    if (data.topic) {
      io.to(data.topic).emit('conversation_updated', data.payload)
    }
  })
  socket.on('disconnect', () => {})
})

httpServer.listen(PORT, async () => {
  try {
    await ensureSchema()
  } catch {
    console.error('Schema bootstrap failed on startup. Ensure DATABASE_URL is correct.')
  }
  console.log(`Stay Jazzy API & Socket.IO server running on port ${PORT}`)
})

export default app
