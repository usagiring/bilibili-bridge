import { CMDS, HTTP_ERRORS } from '../service/const'
import global from '../service/global'
import wss from '../service/wss'

const routes = [
  {
    verb: 'get',
    uri: '/settings',
    middlewares: [get],
    validator: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      }
    }
  },
  {
    verb: 'put',
    uri: '/settings',
    middlewares: [update]
  },
  {
    verb: 'put',
    uri: '/settings/merge',
    middlewares: [merge]
  },
  {
    verb: 'put',
    uri: '/settings/replace',
    middlewares: [replace]
  }
]

async function get(ctx) {
  const { path } = ctx.__body
  const data = path ? global.get(path) : global.all()
  if (!data) throw HTTP_ERRORS.NOT_FOUND
  ctx.body = {
    message: 'ok',
    data
  }
}

function update(ctx) {
  // const { path, payload } = ctx.__body
  // console.log(ctx.request.body)
  // const settings = global.set(path, payload)
  // wss.broadcast({
  //   cmd: EVENTS.UPDATE_SETTING,
  //   payload: settings
  // })
  ctx.body = {}
}

function merge(ctx) {
  const { payload } = ctx.__body
  global.merge(payload)
  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: payload
  })
  ctx.body = {
    message: 'ok',
    data: payload
  }
}

function replace(ctx) {
  const { payload } = ctx.request.query
  const settings = global.replace(payload)
  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: settings
  })
  ctx.body = {
    message: 'ok',
    data: settings
  }
}

export default routes