import { sql } from 'drizzle-orm'
import { db } from '../service/db'
import { COMMON_RESPONSE } from '../service/const'

const routes = [
  {
    verb: 'post',
    uri: '/lottery/history/query',
    middlewares: [ query ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        sort: { type: 'object' },
        skip: { type: 'number', default: 0 },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    verb: 'post',
    uri: '/lottery/history/count',
    middlewares: [ count ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/lottery/history',
    middlewares: [ create ],
    validator: {
      type: 'object',
      properties: {},
    },
  },
  {
    verb: 'delete',
    uri: '/lottery/history',
    middlewares: [ remove ],
    validator: {
      type: 'object',
      properties: {},
    },
  },
]

async function query(ctx) {
  const { _roomId, _sort, skip = 0, limit = 20 } = ctx.__body
  // TODO: 抽奖表待建 Drizzle schema
  ctx.body = { message: 'ok', data: [] }
}

async function count(ctx) {
  const { _roomId } = ctx.__body
  // TODO: 同上
  ctx.body = { message: 'ok', data: 0 }
}

async function create(ctx) {
  const _body = ctx.__body
  // TODO: db.insert(lotteryTable).values(_body).run()
  ctx.body = { message: 'ok', data: _body }
}

async function remove(ctx) {
  // TODO: db.delete(lotteryTable).run()
  ctx.body = COMMON_RESPONSE
}

export default routes