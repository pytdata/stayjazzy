// Standalone migration runner: `npm run migrate`
// Creates all tables and seeds default rows against DATABASE_URL, then exits.
import 'dotenv/config'
import { ensureSchema } from './schema.js'

ensureSchema()
  .then(() => {
    console.log('Migration complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
