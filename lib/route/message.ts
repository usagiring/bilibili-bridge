import { sql } from 'drizzle-orm'
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
        category: { type: 'string' },
        roomId: { type: 'number' },
        userId: { type: 'string' },
        sort: { type: 'object' },
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
        roomId: { type: 'number' },
        userId: { type: 'string' },
        category: { type: 'string' },
      },
    },
  },
]

async function query(ctx) {
  const { _roomId, _userId, _category, _sort, skip = 0, limit = 20 } = ctx.__body

  // TODO: 用 _roomId / _userId / _category / _sort 构建 WHERE + ORDER BY
  const data = db.select().from(messages).limit(limit).offset(skip).all() as MessageRow[]

  ctx.body = { message: 'ok', data }
}

async function count(ctx) {
  const { _roomId, _userId, _category } = ctx.__body

  // TODO: 用 _roomId / _userId / _category 构建 WHERE
  const result = db.select({ count: sql<number>`count(*)` }).from(messages).get()

  ctx.body = { message: 'ok', data: result?.count || 0 }
}

export default routes