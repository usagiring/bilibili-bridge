import { sql } from 'drizzle-orm'
import { messages, MessageRow } from '../model/message.sqlite'
import { db } from '../service/db'

const routes = [
  {
    verb: 'post',
    uri: '/interact/query',
    middlewares: [ query ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        userId: { type: 'string' },
        sort: { type: 'object' },
        skip: { type: 'number', default: 0 },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    verb: 'post',
    uri: '/interact/count',
    middlewares: [ count ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        userId: { type: 'string' },
      },
    },
  },
]

async function query(ctx) {
  const { _roomId, _userId, _sort, skip = 0, limit = 20 } = ctx.__body
  // TODO: 用 _roomId / _userId / _sort 构建 WHERE + ORDER BY，筛选 category = 'interact'
  const data = db.select().from(messages).limit(limit).offset(skip).all() as MessageRow[]
  ctx.body = { message: 'ok', data }
}

async function count(ctx) {
  const { _roomId, _userId } = ctx.__body
  // TODO: 同上 WHERE 筛选
  const result = db.select({ count: sql<number>`count(*)` }).from(messages).get()
  ctx.body = { message: 'ok', data: result?.count || 0 }
}

export default routes