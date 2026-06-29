import express from 'express'
import { query } from '../db.js'
import { ensureSchema } from '../schema.js'

const router = express.Router()

const TABLE_COLUMNS = {
  admins: ['id', 'email', 'password_hash', 'role', 'reset_otp', 'reset_otp_expires_at', 'created_at'],
  service_packages: ['id', 'name', 'description', 'display_order', 'is_active', 'created_at'],
  sub_services: ['id', 'package_id', 'name', 'description', 'display_order', 'is_active', 'created_at'],
  pricing_tiers: ['id', 'sub_service_id', 'tier_type', 'price', 'currency', 'description', 'created_at'],
  pricing_features: ['id', 'tier_id', 'feature_text', 'is_included', 'display_order'],
  portfolio_categories: ['id', 'name', 'display_order', 'is_active', 'created_at'],
  portfolio_works: ['id', 'title', 'category', 'description', 'image_url', 'video_url', 'display_order', 'is_active', 'created_at'],
  hero_slides: ['id', 'title', 'subtitle', 'image_url', 'display_order', 'is_active', 'created_at'],
  team_members: ['id', 'name', 'role', 'bio', 'image_url', 'display_order', 'created_at'],
  faqs: ['id', 'question', 'answer', 'display_order', 'is_active', 'created_at'],
  client_logos: ['id', 'client_name', 'bw_logo_url', 'colored_logo_url', 'display_order', 'is_active', 'created_at'],
  site_content: ['id', 'section_key', 'content_value', 'updated_at'],
  newsletter_subscribers: ['id', 'email', 'subscribed_at', 'is_subscribed', 'unsubscribed_at'],
  newsletter_campaigns: ['id', 'subject', 'html', 'text', 'recipient_count', 'sent_count', 'failed_count', 'status', 'created_at', 'sent_at'],
  newsletter_sends: ['id', 'campaign_id', 'recipient_email', 'recipient_source', 'status', 'message_id', 'error', 'sent_at'],
  contact_messages: ['id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'admin_response', 'created_at'],
  page_views: ['id', 'page_path', 'user_identifier', 'created_at'],
  bookings: ['id', 'user_email', 'user_phone', 'user_name', 'selected_services', 'status', 'current_stage', 'notes', 'created_at', 'updated_at'],
  booking_stages: ['id', 'booking_id', 'stage_name', 'status', 'notes', 'updated_at'],
  otps: ['id', 'identifier', 'otp_code', 'expires_at', 'created_at'],
  chat_conversations: ['id', 'visitor_id', 'visitor_name', 'visitor_email', 'visitor_phone', 'ip_address', 'user_agent', 'country', 'country_code', 'city', 'status', 'last_message_at', 'created_at', 'assigned_admin_id'],
  chat_messages: ['id', 'conversation_id', 'booking_id', 'sender_type', 'sender_name', 'message', 'is_read', 'created_at'],
  chat_leads: ['id', 'full_name', 'email', 'phone', 'message', 'ip_address', 'user_agent', 'country', 'status', 'created_at'],
  chat_default_responses: ['id', 'question_pattern', 'response', 'sort_order', 'is_active', 'created_at', 'updated_at'],
  chat_settings: ['id', 'active_start', 'active_end', 'timezone', 'sms_enabled', 'alert_phone', 'alert_email', 'created_at', 'updated_at'],
  payment_transactions: ['id', 'booking_id', 'reference', 'amount', 'currency', 'status', 'gateway', 'gateway_response', 'paid_at', 'created_at'],
  payment_requests: ['id', 'booking_id', 'stage_name', 'percentage', 'amount', 'currency', 'status', 'due_date', 'created_at', 'updated_at'],
  invoices: ['id', 'invoice_number', 'booking_id', 'customer_name', 'customer_email', 'customer_phone', 'subtotal', 'tax_amount', 'discount_amount', 'total', 'currency', 'status', 'notes', 'created_at', 'updated_at'],
  receipts: ['id', 'receipt_number', 'transaction_id', 'invoice_id', 'customer_name', 'customer_email', 'amount', 'currency', 'payment_method', 'paid_at', 'created_at'],
  company_settings: ['id', 'name', 'tagline', 'address', 'city', 'country', 'phone', 'email', 'website', 'registration_number', 'tax_number', 'bank_name', 'bank_account_name', 'bank_account_number', 'logo_url', 'header_logo_height', 'menu_logo_height', 'footer_logo_height', 'admin_logo_height', 'signature_urls', 'primary_color', 'secondary_color', 'created_at', 'updated_at'],
  seo_settings: ['id', 'site_title', 'site_description', 'keywords', 'og_image_url', 'twitter_handle', 'google_analytics_id', 'facebook_pixel_id', 'robots_txt', 'sitemap_enabled', 'canonical_url', 'created_at', 'updated_at'],
}

const tableColumnSets = new Map(
  Object.entries(TABLE_COLUMNS).map(([table, columns]) => [table, new Set(columns)])
)

const INTERNAL_MATCH_KEYS = new Set(['_count', '_head', '_onConflict'])
const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/

class RequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

// Encode JS objects/arrays for jsonb columns; pass scalars through untouched.
const prepValue = (value) =>
  value !== null && typeof value === 'object' && !(value instanceof Date) ? JSON.stringify(value) : value

const quoteIdent = (identifier) => `"${identifier}"`

const assertTable = (table) => {
  if (!tableColumnSets.has(table)) {
    throw new RequestError('Table not allowed', 403)
  }
  return table
}

const assertColumn = (table, column) => {
  if (typeof column !== 'string' || !IDENTIFIER_RE.test(column) || !tableColumnSets.get(table)?.has(column)) {
    throw new RequestError(`Column not allowed: ${column}`)
  }
  return column
}

const parseSelect = (table, select) => {
  if (!select || select === '*') return '*'

  const columns = String(select)
    .split(',')
    .map(column => column.trim())
    .filter(Boolean)

  if (columns.length === 0) return '*'
  return columns.map(column => quoteIdent(assertColumn(table, column))).join(', ')
}

const parseConflictTarget = (table, target = 'id') => {
  const columns = String(target)
    .split(',')
    .map(column => column.trim())
    .filter(Boolean)

  if (columns.length === 0) throw new RequestError('Conflict target is required')
  return columns.map(column => assertColumn(table, column))
}

const assertPlainObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(`${label} must be an object`)
  }
  return value
}

const parseLimit = (limit) => {
  if (limit === undefined || limit === null) return null
  const parsed = Number(limit)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10000) {
    throw new RequestError('Limit must be an integer from 1 to 10000')
  }
  return parsed
}

router.post('/:table', async (req, res, next) => {
  const { action, match, data, order, limit, select } = req.body

  try {
    const table = assertTable(req.params.table)

    // Make sure the schema exists before touching any table (covers fresh /
    // serverless deployments where the startup hook may not have run).
    await ensureSchema()

    let sql = ''
    const params = []
    let paramIdx = 1

    const buildWhere = (matchObj) => {
      if (!matchObj || Object.keys(matchObj).length === 0) return ''
      assertPlainObject(matchObj, 'match')

      const clauses = []
      for (const [key, value] of Object.entries(matchObj)) {
        if (INTERNAL_MATCH_KEYS.has(key)) continue

        if (key === '_or') {
          if (typeof value !== 'string') throw new RequestError('_or must be a string')
          const orClauses = value.split(',').map(condition => {
            const separator = condition.indexOf('.eq.')
            if (separator === -1) throw new RequestError('Only eq conditions are supported in _or')
            const column = condition.slice(0, separator).trim()
            const conditionValue = condition.slice(separator + 4)
            params.push(conditionValue)
            return `${quoteIdent(assertColumn(table, column))} = $${paramIdx++}`
          })
          if (orClauses.length > 0) clauses.push(`(${orClauses.join(' OR ')})`)
        } else {
          params.push(value)
          clauses.push(`${quoteIdent(assertColumn(table, key))} = $${paramIdx++}`)
        }
      }
      return clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    }

    if (action === 'select') {
      sql = `SELECT ${parseSelect(table, select)} FROM ${quoteIdent(table)} ${buildWhere(match)}`
      if (order) {
        assertPlainObject(order, 'order')
        sql += ` ORDER BY ${quoteIdent(assertColumn(table, order.column))} ${order.ascending ? 'ASC' : 'DESC'}`
      }
      const safeLimit = parseLimit(limit)
      if (safeLimit) {
        sql += ` LIMIT $${paramIdx++}`
        params.push(safeLimit)
      }
    } else if (action === 'insert') {
      const items = Array.isArray(data) ? data : [data]
      if (items.length === 0) return res.json([])

      const keys = Object.keys(assertPlainObject(items[0], 'data'))
      if (keys.length === 0) throw new RequestError('Insert requires at least one column')
      keys.forEach(key => assertColumn(table, key))

      const placeholders = items.map(item => {
        assertPlainObject(item, 'data item')
        const itemPlaceholders = keys.map(key => {
          params.push(prepValue(item[key]))
          return `$${paramIdx++}`
        })
        return `(${itemPlaceholders.join(', ')})`
      })

      sql = `INSERT INTO ${quoteIdent(table)} (${keys.map(quoteIdent).join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`
    } else if (action === 'update') {
      const updateData = assertPlainObject(data, 'data')
      const keys = Object.keys(updateData)
      if (keys.length === 0) throw new RequestError('Update requires at least one column')

      const setClauses = keys.map(key => {
        params.push(prepValue(updateData[assertColumn(table, key)]))
        return `${quoteIdent(key)} = $${paramIdx++}`
      })

      const whereClause = buildWhere(match)
      if (!whereClause) throw new RequestError('Update requires match condition')

      sql = `UPDATE ${quoteIdent(table)} SET ${setClauses.join(', ')} ${whereClause} RETURNING *`
    } else if (action === 'delete') {
      const whereClause = buildWhere(match)
      if (!whereClause) throw new RequestError('Delete requires match condition')
      sql = `DELETE FROM ${quoteIdent(table)} ${whereClause} RETURNING *`
    } else if (action === 'upsert') {
      const upsertData = assertPlainObject(data, 'data')
      const keys = Object.keys(upsertData)
      if (keys.length === 0) throw new RequestError('Upsert requires at least one column')
      keys.forEach(key => assertColumn(table, key))

      const conflictColumns = parseConflictTarget(table, match?._onConflict || 'id')
      const valuesPlaceholders = keys.map(key => {
        params.push(prepValue(upsertData[key]))
        return `$${paramIdx++}`
      })
      const updateSet = keys
        .filter(key => !conflictColumns.includes(key))
        .map(key => `${quoteIdent(key)} = EXCLUDED.${quoteIdent(key)}`)

      const conflictSql = conflictColumns.map(quoteIdent).join(', ')
      const actionSql = updateSet.length > 0 ? `DO UPDATE SET ${updateSet.join(', ')}` : 'DO NOTHING'
      sql = `INSERT INTO ${quoteIdent(table)} (${keys.map(quoteIdent).join(', ')}) VALUES (${valuesPlaceholders.join(', ')}) ON CONFLICT (${conflictSql}) ${actionSql} RETURNING *`
    } else {
      throw new RequestError('Invalid action')
    }

    const result = await query(sql, params)

    // When the caller used .single()/.maybeSingle(), return a single object
    // (or null) instead of an array - for reads as well as writes.
    if (req.body.single) {
      if (action === 'select') {
        return res.json(result.rows[0] ?? null)
      }
      if (((action === 'insert' && !Array.isArray(data)) || action === 'update' || action === 'delete') && result.rows.length <= 1) {
        return res.json(result.rows[0] || null)
      }
    }

    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

export default router
