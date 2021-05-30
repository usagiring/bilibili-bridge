import { lotteryDB, QueryOptions } from '../service/nedb'
import { COMMON_RESPONSE } from '../service/const'

const routes = [
    {
        verb: 'post',
        uri: '/lottery-histories/query',
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
        uri: '/lottery-histories/count',
        middlewares: [count],
        validator: {
            type: 'object',
            properties: {
                query: { type: 'object' },
            }
        }
    },
    {
        verb: 'post',
        uri: '/lottery-histories',
        middlewares: [create],
        validator: {
            type: 'object',
            properties: {}
        }
    },
    {
        verb: 'delete',
        uri: '/lottery-histories',
        middlewares: [remove],
        validator: {
            type: 'object',
            properties: {
            }
        }
    },
]

async function query(ctx) {
    const { query, sort, skip, limit, projection } = ctx.__body
    const options: QueryOptions = {}
    if (sort) { options.sort = sort }
    if (skip) { options.skip = skip }
    if (limit) { options.limit = limit }
    if (projection) { options.projection = projection }
    const lotteries = await lotteryDB.find(query, options)
    ctx.body = {
        message: 'ok',
        data: lotteries
    }
}

async function count(ctx) {
    const { query } = ctx.__body
    const count = await lotteryDB.count(query)
    ctx.body = {
        message: 'ok',
        data: count
    }
}

async function create(ctx) {
    const body = ctx.__body
    const lottery = await lotteryDB.insert(body)
    ctx.body = {
        message: 'ok',
        data: lottery
    }
}

async function remove(ctx) {
    await lotteryDB.deleteMany({})
    ctx.body = COMMON_RESPONSE
}

export default routes