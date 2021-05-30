import global from '../service/global'
import { giftDB, QueryOptions } from '../service/nedb'

const routes = [
  {
    verb: 'get',
    uri: '/gifts/config',
    middlewares: [get],
  },
  {
    verb: 'post',
    uri: '/gifts/query',
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
    uri: '/gifts/count',
    middlewares: [count],
    validator: {
      type: 'object',
      properties: {
        query: { type: 'object' },
      }
    }
  }
]

async function get(ctx) {
  ctx.body = {
    message: 'ok',
    data: global.get('giftConfig') || {}
  }
}

async function query(ctx) {
  const { query, sort, skip, limit, projection } = ctx.__body
  const options: QueryOptions = {}
  if (sort) { options.sort = sort }
  if (skip) { options.skip = skip }
  if (limit) { options.limit = limit }
  if (projection) { options.projection = projection }
  if (query?.name?.$regex) { query.name.$regex = new RegExp(query.name.$regex)}
  const gifts = await giftDB.find(query, options)
  ctx.body = {
    message: 'ok',
    data: gifts
  }
}

async function count(ctx) {
  const { query } = ctx.__body
  const count = await giftDB.count(query)
  ctx.body = {
    message: 'ok',
    data: count
  }
}

export default routes