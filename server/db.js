import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, './tokenz.sqlite')
const DEFAULT_MAIL = 'aaa@bbb.com'
const DEFAULT_PHONE = '0912345678'

let db = null

function scryptHash(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex')
}

function ensureDefaultUser(database) {
  const defaults = [
    { email: 'aaa@aaa.com', password: '0' },
    { email: 'bbb@bbb.com', password: '1' },
    { email: 'ccc@ccc.com', password: '1' },
    { email: 'ddd@ddd.com', password: '1' }
  ]

  const now = new Date().toISOString()
  const insert = database.prepare(
    `INSERT INTO users (email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)`
  )
  const existsStmt = database.prepare(`SELECT email FROM users WHERE email = ? LIMIT 1`)

  for (const u of defaults) {
    const exists = existsStmt.get(u.email)
    if (exists) continue
    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = scryptHash(u.password, salt)
    insert.run(u.email, passwordHash, salt, now)
  }
}

export function getDb() {
  if (db) return db
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      product_name TEXT NOT NULL,
      status TEXT NOT NULL,
      mail TEXT,
      phone TEXT,
      cancel_reason TEXT,
      canceled_at TEXT,
      refund_reason TEXT,
      refund_detail TEXT,
      refund_id TEXT,
      refund_payload_json TEXT,
      refunded_at TEXT,
      tokenz_session_id TEXT,
      tokenz_order_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tokenz_session_id ON orders(tokenz_session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tokenz_order_id ON orders(tokenz_order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

    CREATE TABLE IF NOT EXISTS webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      order_id TEXT,
      amount REAL,
      currency TEXT,
      payload_json TEXT NOT NULL,
      received_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
  `)

  const orderColumns = db
    .prepare(`PRAGMA table_info(orders)`)
    .all()
    .map((c) => c.name)
  if (!orderColumns.includes('mail')) {
    db.exec(`ALTER TABLE orders ADD COLUMN mail TEXT;`)
    db.prepare(`UPDATE orders SET mail = ? WHERE mail IS NULL`).run(DEFAULT_MAIL)
  }
  if (!orderColumns.includes('phone')) {
    db.exec(`ALTER TABLE orders ADD COLUMN phone TEXT;`)
    db.prepare(`UPDATE orders SET phone = ? WHERE phone IS NULL`).run(DEFAULT_PHONE)
  }
  if (!orderColumns.includes('cancel_reason')) {
    db.exec(`ALTER TABLE orders ADD COLUMN cancel_reason TEXT;`)
  }
  if (!orderColumns.includes('canceled_at')) {
    db.exec(`ALTER TABLE orders ADD COLUMN canceled_at TEXT;`)
  }
  if (!orderColumns.includes('refund_id')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_id TEXT;`)
  }
  if (!orderColumns.includes('refund_payload_json')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_payload_json TEXT;`)
  }
  if (!orderColumns.includes('refunded_at')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refunded_at TEXT;`)
  }
  if (!orderColumns.includes('refund_reason')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_reason TEXT;`)
  }
  if (!orderColumns.includes('refund_detail')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_detail TEXT;`)
  }

  ensureDefaultUser(db)

  return db
}

export function createOrder({ amount, currency, productName, mail = DEFAULT_MAIL, phone = DEFAULT_PHONE }) {
  const database = getDb()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  database
    .prepare(
      `INSERT INTO orders (id, amount, currency, product_name, status, mail, phone, tokenz_session_id, tokenz_order_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)`
    )
    .run(id, amount, currency, productName, 'created', mail, phone, now, now)

  return id
}

export function attachSessionToOrder({ orderId, tokenzSessionId }) {
  const database = getDb()
  const now = new Date().toISOString()

  database
    .prepare(
      `UPDATE orders
       SET tokenz_session_id = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(tokenzSessionId, now, orderId)
}

export function updateOrderStatusByTokenzOrderId({ tokenzOrderId, status, amount = null, currency = null }) {
  const database = getDb()
  const now = new Date().toISOString()

  const existing = database.prepare(`SELECT id FROM orders WHERE tokenz_order_id = ?`).get(tokenzOrderId)
  if (!existing) return

  const fields = []
  const values = []
  fields.push('status = ?')
  values.push(status)
  if (amount !== null) {
    fields.push('amount = ?')
    values.push(amount)
  }
  if (currency !== null) {
    fields.push('currency = ?')
    values.push(currency)
  }
  fields.push('updated_at = ?')
  values.push(now)
  values.push(tokenzOrderId)

  database.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE tokenz_order_id = ?`).run(...values)
}

export function attachTokenzOrderIdBySessionId({ tokenzSessionId, tokenzOrderId }) {
  const database = getDb()
  const now = new Date().toISOString()

  database
    .prepare(
      `UPDATE orders
       SET tokenz_order_id = ?, updated_at = ?
       WHERE tokenz_session_id = ?`
    )
    .run(tokenzOrderId, now, tokenzSessionId)
}

export function upsertOrderFromWebhook({ tokenzOrderId, status, amount = null, currency = null, productName = null }) {
  const database = getDb()
  const now = new Date().toISOString()

  const existing = database.prepare(`SELECT id FROM orders WHERE tokenz_order_id = ?`).get(tokenzOrderId)
  if (existing) {
    updateOrderStatusByTokenzOrderId({ tokenzOrderId, status, amount, currency })
    return
  }

  if (amount !== null && currency && productName) {
    const candidate = database
      .prepare(
        `
        SELECT id
        FROM orders
        WHERE tokenz_order_id IS NULL
          AND amount = ?
          AND currency = ?
          AND product_name = ?
        ORDER BY created_at DESC
        LIMIT 1
        `
      )
      .get(amount, currency, productName)

    if (candidate?.id) {
      database
        .prepare(
          `
          UPDATE orders
          SET tokenz_order_id = ?, status = ?, updated_at = ?
          WHERE id = ?
          `
        )
        .run(tokenzOrderId, status, now, candidate.id)
      return
    }
  }

  database
    .prepare(
      `INSERT INTO orders (id, amount, currency, product_name, status, tokenz_session_id, tokenz_order_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      amount ?? 0,
      currency ?? 'TWD',
      productName ?? '(unknown)',
      status,
      tokenzOrderId,
      now,
      now
    )
}

export function insertWebhookEvent(event) {
  const database = getDb()
  const eventType =
    (typeof event?.object === 'string' && event.object) ||
    (typeof event?.type === 'string' && event.type) ||
    'unknown'

  const order =
    event?.eventData?.data?.order ??
    event?.eventData?.data?.data?.order ??
    event?.data?.order ??
    event?.data?.data?.order ??
    null

  const orderId =
    (typeof order?.id === 'string' && order.id) ||
    (typeof event?.data?.id === 'string' && event.data.id) ||
    null

  const amountObj = order?.amount ?? event?.data?.amount ?? null
  const amount =
    typeof amountObj === 'number'
      ? amountObj
      : typeof amountObj?.amount === 'number'
        ? amountObj.amount
        : typeof amountObj?.amount === 'string'
          ? Number(amountObj.amount)
          : typeof amountObj === 'string'
            ? Number(amountObj)
            : null

  const currency =
    (typeof amountObj?.currency === 'string' && amountObj.currency) ||
    (typeof order?.currency === 'string' && order.currency) ||
    (typeof event?.data?.currency === 'string' && event.data.currency) ||
    null

  const receivedAt = new Date().toISOString()
  const payloadJson = JSON.stringify(event ?? null)

  database
    .prepare(
      `INSERT INTO webhook_events (event_type, order_id, amount, currency, payload_json, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(eventType, orderId, amount, currency, payloadJson, receivedAt)
}

export function listWebhookEvents({ limit = 50, orderId = null } = {}) {
  const database = getDb()
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))

  if (orderId) {
    return database
      .prepare(
        `SELECT id, event_type, order_id, amount, currency, received_at, payload_json
         FROM webhook_events
         WHERE order_id = ?
         ORDER BY id DESC
         LIMIT ?`
      )
      .all(orderId, safeLimit)
  }

  return database
    .prepare(
      `SELECT id, event_type, order_id, amount, currency, received_at, payload_json
       FROM webhook_events
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(safeLimit)
}

export function listOrders({ limit = 50, mail = null } = {}) {
  const database = getDb()
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))

  const baseSql = `
    SELECT
      id,
      amount,
      currency,
      product_name AS productName,
      status,
      mail,
      phone,
      tokenz_session_id AS tokenzSessionId,
      tokenz_order_id AS tokenzOrderId,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM orders
  `

  if (mail) {
    return database
      .prepare(
        `
        ${baseSql}
        WHERE mail = ?
        ORDER BY updated_at DESC
        LIMIT ?
        `
      )
      .all(mail, safeLimit)
  }

  return database
    .prepare(
      `
      ${baseSql}
      ORDER BY updated_at DESC
      LIMIT ?
      `
    )
    .all(safeLimit)
}

export function getOrderBySessionId(tokenzSessionId) {
  const database = getDb()
  return database
    .prepare(
      `
      SELECT
        id,
        amount,
        currency,
        product_name AS productName,
        status,
        mail,
        phone,
        tokenz_session_id AS tokenzSessionId,
        tokenz_order_id AS tokenzOrderId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      WHERE tokenz_session_id = ?
      LIMIT 1
      `
    )
    .get(tokenzSessionId)
}

export function getOrderById(id) {
  const database = getDb()
  return database
    .prepare(
      `
      SELECT
        id,
        amount,
        currency,
        product_name AS productName,
        status,
        mail,
        phone,
        tokenz_session_id AS tokenzSessionId,
        tokenz_order_id AS tokenzOrderId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      WHERE id = ?
      LIMIT 1
      `
    )
    .get(id)
}

export function updateOrderStatusById({ id, status, cancelReason = null }) {
  const database = getDb()
  const now = new Date().toISOString()
  if (status === 'order.canceled') {
    database
      .prepare(`UPDATE orders SET status = ?, cancel_reason = ?, canceled_at = ?, updated_at = ? WHERE id = ?`)
      .run(status, cancelReason, now, now, id)
  } else {
    database.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, id)
  }
  return getOrderById(id)
}

export function markOrderRefundedById({ id, cancelReason, refundReason, refundDetail, refundId, refundPayloadJson }) {
  const database = getDb()
  const now = new Date().toISOString()
  database
    .prepare(
      `
      UPDATE orders
      SET
        status = ?,
        cancel_reason = ?,
        canceled_at = ?,
        refund_reason = ?,
        refund_detail = ?,
        refund_id = ?,
        refund_payload_json = ?,
        refunded_at = ?,
        updated_at = ?
      WHERE id = ?
      `
    )
    .run('order.refunded', cancelReason, now, refundReason, refundDetail, refundId, refundPayloadJson, now, now, id)
  return getOrderById(id)
}

export function getDbInfo() {
  return { dbPath: DB_PATH }
}

export function authenticateUser({ email, password }) {
  const database = getDb()
  const user = database
    .prepare(`SELECT email, password_hash, password_salt FROM users WHERE email = ? LIMIT 1`)
    .get(email)
  if (!user) return { ok: false }

  const computedHash = scryptHash(password, user.password_salt)
  const a = Buffer.from(computedHash, 'hex')
  const b = Buffer.from(user.password_hash, 'hex')
  if (a.length !== b.length) return { ok: false }
  const ok = crypto.timingSafeEqual(a, b)
  return { ok }
}

export function createUser({ email, password }) {
  const database = getDb()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('email 必填')
  if (typeof password !== 'string' || password.length === 0) throw new Error('password 必填')

  const exists = database.prepare(`SELECT email FROM users WHERE email = ? LIMIT 1`).get(normalizedEmail)
  if (exists) throw new Error('email 已存在')

  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = scryptHash(password, salt)
  const now = new Date().toISOString()
  database
    .prepare(`INSERT INTO users (email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)`)
    .run(normalizedEmail, passwordHash, salt, now)

  return { email: normalizedEmail, createdAt: now }
}

export function listUsers({ limit = 50 } = {}) {
  const database = getDb()
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))
  return database
    .prepare(`SELECT email, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT ?`)
    .all(safeLimit)
}
