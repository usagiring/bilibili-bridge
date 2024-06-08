import wss from '../service/wss'
import { CMDS, COMMON_RESPONSE } from '../service/const'
import global from '../service/global'

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
    cmd: CMDS.MESSAGE_CLEAR
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
      cmd = CMDS.COMMENT
      break
    case 'gift':
      cmd = CMDS.GIFT
      break
    case 'interact':
      cmd = CMDS.INTERACT
      break
    case 'superChat':
      cmd = CMDS.SUPER_CHAT
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