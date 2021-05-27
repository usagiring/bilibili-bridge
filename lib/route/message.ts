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
    uri: '/messages/example/initial',
    middlewares: [getInitialMessages],
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
  ctx.body = global.get('EXAMPLE_MESSAGES')
}

export default routes