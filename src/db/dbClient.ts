import { io, Socket } from 'socket.io-client'
import { API_BASE, SOCKET_BASE } from '@/lib/apiBase'

const SOCKET_URL = SOCKET_BASE

let socketInstance: Socket | null = null
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { autoConnect: true })
  }
  return socketInstance
}

class QueryBuilder implements PromiseLike<any> {
  private _table: string
  private _action: string = 'select'
  private _matchObj: any = {}
  private _dataObj: any = null
  private _orderObj: any = null
  private _limitVal: number | null = null
  private _singleResult: boolean = false
  private _selectCols: string = '*'

  constructor(table: string) {
    this._table = table
  }

  select(cols = '*', options?: { count?: string, head?: boolean }) {
    // When chained after a write (e.g. .insert(...).select()), keep the write
    // action so the row is actually inserted/updated and returned — don't
    // downgrade it to a plain SELECT.
    if (!['insert', 'update', 'upsert', 'delete'].includes(this._action)) this._action = 'select'
    this._selectCols = cols
    if (options?.count) this._matchObj['_count'] = options.count
    if (options?.head) this._matchObj['_head'] = options.head
    return this
  }

  insert(data: any) {
    this._action = 'insert'
    this._dataObj = data
    return this
  }

  update(data: any) {
    this._action = 'update'
    this._dataObj = data
    return this
  }

  delete() {
    this._action = 'delete'
    return this
  }

  upsert(data: any, options?: any) {
    this._action = 'upsert'
    this._dataObj = data
    if (options && options.onConflict) {
      this._matchObj['_onConflict'] = options.onConflict
    }
    return this
  }

  eq(column: string, value: any) {
    this._matchObj[column] = value
    return this
  }

  match(obj: any) {
    this._matchObj = { ...this._matchObj, ...obj }
    return this
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this._orderObj = { column, ascending: options.ascending !== false }
    return this
  }

  limit(count: number) {
    this._limitVal = count
    return this
  }

  single() {
    this._singleResult = true
    return this
  }

  maybeSingle() {
    this._singleResult = true
    return this
  }

  or(condition: string) {
    this._matchObj['_or'] = condition
    return this
  }

  async execute() {
    const payload = {
      action: this._action,
      match: this._matchObj,
      data: this._dataObj,
      order: this._orderObj,
      limit: this._limitVal,
      single: this._singleResult,
      select: this._selectCols
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/db/${this._table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Database error')
      }

      const data = await res.json()
      
      // If we insert/update a chat_message, emit an event
      if ((this._action === 'insert' || this._action === 'update') && (this._table === 'chat_messages' || this._table === 'chat_conversations')) {
        const resultRow = Array.isArray(data) ? data[0] : data;
        const s = getSocket()
        if (resultRow) {
          s.emit('send_message', { topic: 'public:chat_messages', payload: { new: resultRow, table: this._table } })
        }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error(`DB Error [${this._table}]:`, error)
      return { data: null, error }
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected) as PromiseLike<TResult1 | TResult2>;
  }
}

class MockChannel {
  private topic: string;
  private handlers: any[] = [];
  private socket: Socket;

  constructor(topic: string) {
    this.topic = topic;
    this.socket = getSocket();
  }

  on(type: string, filter: any, callback: (payload: any) => void) {
    this.handlers.push({ type, filter, callback });
    return this;
  }

  subscribe() {
    this.socket.emit('join', this.topic);
    this.socket.on('new_message', (payload: any) => {
      // payload looks like { new: { ...row... }, table: 'chat_messages' }
      for (const h of this.handlers) {
        if (h.type === 'postgres_changes') {
          // If a table filter is specified, ensure it matches
          if (h.filter.table && h.filter.table !== payload.table) continue;
          
          // If a value filter is specified, e.g. "conversation_id=eq.123"
          if (h.filter.filter) {
            const [col, eqVal] = h.filter.filter.split('=eq.');
            if (col && eqVal && payload.new[col] !== eqVal) {
              continue; // condition not met
            }
          }

          // Everything matches!
          h.callback(payload);
        }
      }
    });
    return this;
  }

  unsubscribe() {
    // Because we just use a generic 'new_message', we can't easily remove specific listener without ref tracking,
    // but typically when unmounting we disconnect or remove listeners.
    this.socket.off('new_message');
    return Promise.resolve();
  }
}

export const db = {
  from: (table: string) => new QueryBuilder(table),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  channel: (topic: string) => new MockChannel(topic),
  removeChannel: async (channel: any) => { if (channel && channel.unsubscribe) return channel.unsubscribe(); }
}

export const uploadFileUrl = `${API_BASE}/api/upload/file`
