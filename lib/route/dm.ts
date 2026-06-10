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
  sse.send(clientId, { cmd: CMD.MESSAGE_CLEAR })
  ctx.body = { message: 'ok' }
}

async function sendMessages(ctx) {
  const { category, data, clientId } = ctx.__body
  const cmd = categoryToCmd(category)
  sse.send(clientId, { cmd, payload: data })
  ctx.body = COMMON_RESPONSE
}

function categoryToCmd(category: string) {
  switch (category) {
    case 'comment':   return CMD.COMMENT
    case 'gift':      return CMD.GIFT
    case 'interact':  return CMD.INTERACT
    case 'superChat': return CMD.SUPER_CHAT
    default:          return ''
  }
}

export default routes