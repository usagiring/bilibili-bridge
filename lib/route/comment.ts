import { commentDB, QueryOptions } from '../service/nedb'

const routes = [
  {
    verb: 'post',
    uri: '/comments/query',
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
    uri: '/comments/count',
    middlewares: [count],
    validator: {
      type: 'object',
      properties: {
        query: { type: 'object' },

      }
    }
  }
]

async function query(ctx) {
  const { query, sort, skip, limit, projection } = ctx.__body
  const options: QueryOptions = {}
  if (sort) { options.sort = sort }
  if (skip) { options.skip = skip }
  if (limit) { options.limit = limit }
  if (projection) { options.projection = projection }
  const comments = await commentDB.find(query, options)
  ctx.body = {
    message: 'ok',
    data: comments
  }
}

async function count(ctx) {
  const { query } = ctx.__body
  const count = await commentDB.count(query)
  ctx.body = {
    message: 'ok',
    data: count
  }
}

export default routes