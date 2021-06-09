import wss from '../service/wss'
import { CMDS, COMMON_RESPONSE } from '../service/const'
import global from '../service/global'

const routes = [
  {
    verb: 'post',
    uri: '/messages/clear',
    middlewares: [clear],
  },
  {
    verb: 'post',
    uri: '/messages/examples/send',
    middlewares: [sendExampleMessages],
    validator: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        data: { type: 'object' }
      }
    }
  },
  {
    verb: 'get',
    uri: '/messages/examples',
    middlewares: [getInitialMessages],
  },
  {
    verb: 'post',
    uri: '/messages/examples/clear',
    middlewares: [clearExampleMessages],
  },
  {
    verb: 'post',
    uri: '/messages/examples/restore',
    middlewares: [restoreExampleMessages],
  }
]

async function clear(ctx) {
  wss.broadcast({
    cmd: CMDS.MESSAGE_CLEAR
  })
  ctx.body = {
    message: 'ok'
  }
}

async function sendExampleMessages(ctx) {
  const { type, data } = ctx.__body
  let cmd = ''
  switch (type) {
    case 'comment':
      cmd = CMDS.EXAMPLE_COMMENT
      break
    case 'gift':
      cmd = CMDS.EXAMPLE_GIFT
      break
    case 'interact':
      cmd = CMDS.EXAMPLE_INTERACT
      break
    case 'superChat':
      cmd = CMDS.EXAMPLE_SUPER_CHAT
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
    cmd: CMDS.EXAMPLE_MESSAGE_CLEAR
  })
  ctx.body = {
    message: 'ok'
  }
}

async function restoreExampleMessages(ctx) {
  wss.broadcast({
    cmd: CMDS.EXAMPLE_MESSAGE_RESTORE
  })
  ctx.body = {
    message: 'ok'
  }
}

export default routes