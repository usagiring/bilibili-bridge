import { CMD, COMMON_RESPONSE } from '../service/const'
import sse from '../service/sse'

const routes = [
  {
    verb: 'post',
    uri: '/dm/clear',
    middlewares: [ clear ],
  },
  {
    verb: 'post',
    uri: '/dm/send',
    middlewares: [ sendMessages ],
    validator: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        data: { type: 'object' },
      },
    },
  },
]

async function clear(ctx) {
  const { clientId } = ctx.__body
  sse.send({ clientId, event: CMD.MESSAGE_CLEAR, data: {} })
  ctx.body = { message: 'ok' }
}

async function sendMessages(ctx) {
  const { data, clientId } = ctx.__body
  sse.send({ clientId, event: CMD.MESSAGE, data })
  ctx.body = COMMON_RESPONSE
}

export default routes