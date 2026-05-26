import { CMD, COMMON_RESPONSE } from '../service/const'
import sse from '../service/sse'

const routes = [
  {
    verb: 'post',
    uri: '/message/clear',
    middlewares: [ clear ],
  },
  {
    verb: 'post',
    uri: '/message/send',
    middlewares: [ sendMessages ],
    validator: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        data: { type: 'object' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/message/example/send',
    middlewares: [ sendExampleMessages ],
    validator: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        data: { type: 'object' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/message/example',
    middlewares: [ getInitialMessages ],
  },
  {
    verb: 'post',
    uri: '/message/example/clear',
    middlewares: [ clearExampleMessages ],
  },
  {
    verb: 'post',
    uri: '/message/example/restore',
    middlewares: [ restoreExampleMessages ],
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

async function sendExampleMessages(ctx) {
  const { category, data, clientId } = ctx.__body
  const cmd = categoryToExampleCmd(category)
  sse.send(clientId, { cmd, payload: data })
  ctx.body = COMMON_RESPONSE
}

async function getInitialMessages(ctx) {
  // TODO: 从 DB 或客户端 state 加载示例消息
  ctx.body = { message: 'ok', data: [] }
}

async function clearExampleMessages(ctx) {
  const { clientId } = ctx.__body
  sse.send(clientId, { cmd: CMD.EXAMPLE_MESSAGE_CLEAR })
  ctx.body = { message: 'ok' }
}

async function restoreExampleMessages(ctx) {
  const { clientId } = ctx.__body
  sse.send(clientId, { cmd: CMD.EXAMPLE_MESSAGE_RESTORE })
  ctx.body = { message: 'ok' }
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

function categoryToExampleCmd(category: string) {
  switch (category) {
    case 'comment':   return CMD.EXAMPLE_COMMENT
    case 'gift':      return CMD.EXAMPLE_GIFT
    case 'interact':  return CMD.EXAMPLE_INTERACT
    case 'superChat': return CMD.EXAMPLE_SUPER_CHAT
    default:          return ''
  }
}

export default routes