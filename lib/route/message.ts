import { sql, eq, inArray, like, and, or, desc, gte, lte } from 'drizzle-orm'
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
        skip: { type: 'number', default: 0 },
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
  const { roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte, skip = 0, limit = 20 } = ctx.__body

  const conditions = buildConditions({ roomId, userId, username, content, search, coinType, category, sendAtLte, sendAtGte })

  const data = db.select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.sendAt))
    .limit(limit)
    .offset(skip)
    .all() as MessageRow[]

  ctx.body = { message: 'ok', data }
}

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

export default routes