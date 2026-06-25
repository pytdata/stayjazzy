import express from 'express';
import { query } from '../db.js';
import { ensureSchema } from '../schema.js';

const router = express.Router();

// Encode JS objects/arrays for jsonb columns; pass scalars through untouched.
const prepValue = (v) =>
  v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v;

const ALLOWED_TABLES = [
  'hero_slides', 'service_packages', 'sub_services', 'pricing_tiers', 'pricing_features', 
  'portfolio_works', 'team_members', 'faqs', 'client_logos', 'site_content', 
  'newsletter_subscribers', 'contact_messages', 'bookings', 'chat_messages', 
  'page_views', 'admins', 'otps', 'booking_stages', 'chat_settings', 'chat_default_responses', 
  'chat_conversations', 'chat_leads', 'payment_transactions', 'payment_requests', 
  'invoices', 'receipts', 'company_settings', 'seo_settings', 'portfolio_categories'
];

router.post('/:table', async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  const { action, match, data, order, limit, select } = req.body;

  try {
    // Make sure the schema exists before touching any table (covers fresh /
    // serverless deployments where the startup hook may not have run).
    await ensureSchema();

    let sql = '';
    let params = [];
    let paramIdx = 1;

    // Build WHERE clause
    const buildWhere = (matchObj) => {
      if (!matchObj || Object.keys(matchObj).length === 0) return '';
      const clauses = [];
      for (const [k, v] of Object.entries(matchObj)) {
        if (k === '_count' || k === '_head' || k === '_onConflict') continue;
        
        if (k === '_or') {
          const orConditions = v.split(',');
          const orClauses = orConditions.map(cond => {
            const parts = cond.split('.eq.');
            if (parts.length === 2) {
              const col = parts[0];
              const val = parts[1];
              params.push(val);
              return `${col} = $${paramIdx++}`;
            }
            return '';
          }).filter(c => c);
          if (orClauses.length > 0) {
            clauses.push(`(${orClauses.join(' OR ')})`);
          }
        } else {
          clauses.push(`${k} = $${paramIdx++}`);
          params.push(v);
        }
      }
      return clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    };

    if (action === 'select') {
      sql = `SELECT ${select || '*'} FROM ${table} ${buildWhere(match)}`;
      if (order) {
        sql += ` ORDER BY ${order.column} ${order.ascending ? 'ASC' : 'DESC'}`;
      }
      if (limit) {
        sql += ` LIMIT $${paramIdx++}`;
        params.push(limit);
      }
    } else if (action === 'insert') {
      // Handle array or single object
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];
      if (items.length === 0) return res.json([]);
      
      const keys = Object.keys(items[0]);
      const values = [];
      const placeholders = items.map(item => {
        const itemPl = [];
        keys.forEach(k => {
          itemPl.push(`$${paramIdx++}`);
          params.push(prepValue(item[k]));
        });
        return `(${itemPl.join(', ')})`;
      });

      sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`;
    } else if (action === 'update') {
      const keys = Object.keys(data);
      const setClauses = keys.map(k => `${k} = $${paramIdx++}`);
      for (const k of keys) params.push(prepValue(data[k]));
      
      const whereClause = buildWhere(match);
      if (!whereClause) throw new Error('Update requires match condition');
      
      sql = `UPDATE ${table} SET ${setClauses.join(', ')} ${whereClause} RETURNING *`;
    } else if (action === 'delete') {
      const whereClause = buildWhere(match);
      if (!whereClause) throw new Error('Delete requires match condition');
      sql = `DELETE FROM ${table} ${whereClause} RETURNING *`;
    } else if (action === 'upsert') {
       // Upsert on the caller-supplied conflict target (defaults to the primary key).
       const conflictTarget = (match && match._onConflict) || 'id';
       const keys = Object.keys(data);
       const valuesPl = keys.map(k => { params.push(prepValue(data[k])); return `$${paramIdx++}`; });
       const updateSet = keys.filter(k => k !== conflictTarget).map(k => `${k} = EXCLUDED.${k}`);
       sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${valuesPl.join(', ')}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet.join(', ')} RETURNING *`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await query(sql, params);

    // When the caller used .single()/.maybeSingle(), return a single object
    // (or null) instead of an array — for reads as well as writes.
    if (req.body.single) {
      if (action === 'select') {
        return res.json(result.rows[0] ?? null);
      }
      if (((action === 'insert' && !Array.isArray(data)) || action === 'update' || action === 'delete') && result.rows.length <= 1) {
        return res.json(result.rows[0] || null);
      }
    }

    res.json(result.rows);
  } catch (error) {
    console.error(`DB Error (${table} ${action}):`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
