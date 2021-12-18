import statisticService from '../service/statistic'
import { COMMON_RESPONSE } from '../service/const'

const routes = [
  {
    verb: 'post',
    uri: '/statistic',
    middlewares: [statistic],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        start: { type: 'string' },
        end: { type: 'string' },
      }
    }
  },

  {
    verb: 'post',
    uri: '/comments/tokenization',
    middlewares: [tokenization],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        start: { type: 'string' },
        end: { type: 'string' },
      }
    }
  },

  {
    verb: 'post',
    uri: '/comments/word-extract',
    middlewares: [wordExtract],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' },
        start: { type: 'string' },
        end: { type: 'string' },
      }
    }
  },
]

async function statistic(ctx) {
  const { start, end, roomId } = ctx.__body
  const result = await statisticService.statistic({ roomId, start, end })
  ctx.body = {
    message: 'ok',
    data: result
  }
}

async function tokenization(ctx) {
  const { roomId, start, end } = ctx.__body
  await statisticService.tokenization({ roomId, start, end })
  ctx.body = COMMON_RESPONSE
}

async function wordExtract(ctx) {
  const { roomId, start, end } = ctx.__body
  const result = await statisticService.wordExtract({ roomId, start, end })
  ctx.body = {
    message: 'ok',
    data: result
  }
}

export default routes