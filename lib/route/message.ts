import wss from '../service/wss'
import { CMD, COMMON_RESPONSE } from '../service/const'
import global from '../service/state'

const routes = [
  {
    verb: 'post',
    uri: '/message/clear',
    middlewares: [clear],
  },
  {
    verb: 'post',
    uri: '/message/send',
    middlewares: [sendMessages],
    validator: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        data: { type: 'object' }
      }
    }
  },
  {
    verb: 'post',
    uri: '/message/example/send',
    middlewares: [sendExampleMessages],
    validator: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        data: { type: 'object' }
      }
    }
  },
  {
    verb: 'get',
    uri: '/message/example',
    middlewares: [getInitialMessages],
  },
  {
    verb: 'post',
    uri: '/message/example/clear',
    middlewares: [clearExampleMessages],
  },
  {
    verb: 'post',
    uri: '/message/example/restore',
    middlewares: [restoreExampleMessages],
  }
]

async function clear(ctx) {
  wss.broadcast({
    cmd: CMD.MESSAGE_CLEAR
  })
  ctx.body = {
    message: 'ok'
  }
}

async function sendMessages(ctx) {
  const { category, data } = ctx.__body
  let cmd = ''
  switch (category) {
    case 'comment':
      cmd = CMD.COMMENT
      break
    case 'gift':
      cmd = CMD.GIFT
      break
    case 'interact':
      cmd = CMD.INTERACT
      break
    case 'superChat':
      cmd = CMD.SUPER_CHAT
      break
  }
  wss.broadcast({
    cmd,
    payload: data
  })

  ctx.body = COMMON_RESPONSE
}

async function sendExampleMessages(ctx) {
  const { category, data } = ctx.__body
  let cmd = ''
  switch (category) {
    case 'comment':
      cmd = CMD.EXAMPLE_COMMENT
      break
    case 'gift':
      cmd = CMD.EXAMPLE_GIFT
      break
    case 'interact':
      cmd = CMD.EXAMPLE_INTERACT
      break
    case 'superChat':
      cmd = CMD.EXAMPLE_SUPER_CHAT
      break
  }
  wss.broadcast({
    cmd,
    payload: data
  })

  ctx.body = COMMON_RESPONSE
}

async function getInitialMessages(ctx) {
  ctx.body = {
    message: 'ok',
    data: global.get('EXAMPLE_MESSAGES')
  }
}

async function clearExampleMessages(ctx) {
  wss.broadcast({
    cmd: CMD.EXAMPLE_MESSAGE_CLEAR
  })
  ctx.body = {
    message: 'ok'
  }
}

async function restoreExampleMessages(ctx) {
  wss.broadcast({
    cmd: CMD.EXAMPLE_MESSAGE_RESTORE
  })
  ctx.body = {
    message: 'ok'
  }
}

export default routes