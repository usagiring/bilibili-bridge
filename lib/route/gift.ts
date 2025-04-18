import giftService from '../service/gift'
import { QueryOptions } from '../service/nedb'
import { Model as GiftModel } from '../model/gift'
import { parseQueryRegexp } from '../service/util'
import runtime from '../service/runtime'

const routes = [
  {
    verb: 'get',
    uri: '/room/:roomId/gift/map',
    middlewares: [getConfig],
  },
  {
    verb: 'post',
    uri: '/gift/query',
    middlewares: [query],
    validator: {
      type: 'object',
      properties: {
        query: { type: 'object' },
        sort: { type: 'object' },
        skip: { type: 'number', default: 0 },
        limit: { type: 'number', default: 20 },
        projection: { type: 'object' },
      }
    }
  },
  {
    verb: 'post',
    uri: '/gift/count',
    middlewares: [count],
    validator: {
      type: 'object',
      properties: {
        query: { type: 'object' },
      }
    }
  }
]

async function getConfig(ctx) {
  const { roomId } = ctx.__body
  let giftMap = runtime.get(`connectionPoolMap.${roomId}.giftMap`)

  if (!giftMap) {
    giftMap = await giftService.getConfig({ roomId: roomId }) || {}
  }
  ctx.body = {
    message: 'ok',
    data: giftMap
  }
}

async function query(ctx) {
  const { query, sort, skip, limit, projection } = ctx.__body
  const options: QueryOptions = {}
  if (sort) { options.sort = sort }
  if (skip) { options.skip = skip }
  if (limit) { options.limit = limit }
  if (projection) { options.projection = projection }
  // if (query?.uname?.$regex) { query.uname.$regex = new RegExp(query.uname.$regex)}
  parseQueryRegexp(query)
  const gifts = await GiftModel.find(query, options)
  ctx.body = {
    message: 'ok',
    data: gifts
  }
}

async function count(ctx) {
  const { query } = ctx.__body
  const count = await GiftModel.count(query)
  ctx.body = {
    message: 'ok',
    data: count
  }
}

export default routes