import { sql, eq, inArray, like, and, or, desc, asc, gte, lte } from 'drizzle-orm'
import { messages, MessageRow } from '../model/message.sqlite'
import { db } from '../service/db'

const routes = [
  {
    verb: 'get',
    uri: '/message/query',
    middlewares: [ query ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
        category: { type: 'array', items: { type: 'string' }, separator: ',' },
        userId: { type: 'string' },
        username: { type: 'string' },
        content: { type: 'string' },
        search: { type: 'string' },
        coinType: { type: 'array', items: { type: 'string' }, separator: ',' },
        sendAtLte: { type: 'number' },
        sendAtGte: { type: 'number' },
        // order: { type: 'string' }, // 该接口固定按sendAt倒序，不再进行额外抽象封装
        cursor: { type: 'string' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    verb: 'get',
    uri: '/message/count',
    middlewares: [ count ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
        userId: { type: 'string' },
        username: { type: 'string' },
        content: { type: 'string' },
        search: { type: 'string' },
        coinType: { type: 'array', items: { type: 'string' }, separator: ',' },
        sendAtLte: { type: 'number' },
        endAt: { type: 'number' },
        category: { type: 'array', items: { type: 'string' }, separator: ',' },
      },
    },
  },
]

async function query(ctx) {
  const { roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte, cursor, limit = 20 } = ctx.__body

  const conditions = buildConditions({ roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte, cursor })

  const parsed = parseCursor(cursor)
  const isPrev = parsed?.direction === 'prev'

  const data = db.select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(isPrev ? asc(messages.sendAt) : desc(messages.sendAt), isPrev ? asc(messages.id) : desc(messages.id))
    .limit(limit + 1)
    .all() as MessageRow[]

  // prev 查出来是升序，反转回降序
  if (isPrev) data.reverse()

  const hasMore = data.length > limit
  if (hasMore) data.pop()

  // const first = data[0]
  // const last = data[data.length - 1]
  // const prevCursor = first ? buildCursor(first, 'prev') : null
  // const nextCursor = hasMore ? buildCursor(last, 'next') : null

  ctx.body = {
    message: 'ok',
    data,
    // prevCursor,
    // nextCursor,
  }
}

const columnMap: Record<string, any> = {
  sendAt: messages.sendAt,
  id: messages.id,
}

// row → 'next$sendAt:1719500000,id:1234' | 'prev$sendAt:1719500000,id:1234'
// function buildCursor(row: MessageRow, dir: 'prev' | 'next') {
//   const parts = Object.keys(columnMap).map(f => `${f}:${(row as any)[f]}`)
//   return `${dir}$${parts.join(',')}`
// }

async function count(ctx) {
  const { roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte } = ctx.__body

  const conditions = buildConditions({ roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte })

  const result = db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(...conditions))
    .get()

  ctx.body = { message: 'ok', data: result?.count || 0 }
}

function buildConditions(filters: {
  roomId?: string
  userId?: string
  username?: string
  content?: string
  search?: string
  coinType?: string[]
  category?: string[]
  sendAtLte?: number
  sendAtGte?: number
  cursor?: string
}) {
  const conditions = []

  // 精确条件 — 各自独立 AND
  if (filters.roomId) conditions.push(eq(messages.roomId, filters.roomId))
  if (filters.category?.length) conditions.push(inArray(messages.category, filters.category))
  if (filters.sendAtGte) conditions.push(gte(messages.sendAt, filters.sendAtGte))
  if (filters.sendAtLte) conditions.push(lte(messages.sendAt, filters.sendAtLte))
  if (filters.userId) conditions.push(eq(messages.userId, filters.userId))
  if (filters.username) conditions.push(like(messages.username, `%${filters.username}%`))
  if (filters.content) conditions.push(like(messages.content, `%${filters.content}%`))
  if (filters.coinType?.length) {
    conditions.push(inArray(sql`json_extract(${messages.gift}, '$.coinType')`, filters.coinType))
  }

  // cursor = 'prev$sendAt:1719500000,id:1234' | 'next$sendAt:1719500000,id:1234'
  // prev → 往前翻（>）  next → 往后翻（<）
  if (filters.cursor) {
    const parsed = parseCursor(filters.cursor)
    if (parsed) {
      const cmp = parsed.direction === 'prev' ? sql`>` : sql`<`
      const cols = parsed.fields.map(f => columnMap[f.field] ? sql`${columnMap[f.field]}` : null)
      const vals = parsed.fields.map(f => f.value)
      if (cols.every(Boolean)) {
        conditions.push(sql`(${sql.join(cols, sql`,`)}) ${cmp} (${sql.join(vals, sql`,`)})`)
      }
    }
  }

  // search 内部 OR — 跨字段模糊搜索
  if (filters.search) {
    conditions.push(or(
      eq(messages.userId, filters.search),
      like(messages.username, `%${filters.search}%`),
      like(messages.content, `%${filters.search}%`),
    ))
  }

  return conditions
}

// 'prev$sendAt:1719500000,id:1234' → { fields: [...], direction: 'prev' }
function parseCursor(cursor: string | undefined) {
  if (!cursor) return null
  const match = cursor.match(/^(prev|next)\$(.+)$/)
  if (!match) return null
  const direction = match[1] as 'prev' | 'next'

  const fields = match[2].split(',').map((pair) => {
    const [ field, val ] = pair.split(':')
    if (!columnMap[field]) return null
    return { field, value: Number(val) }
  })

  if (fields.some(f => !f)) return null
  return { fields: fields as { field: string; value: number }[], direction }
}

export default routes