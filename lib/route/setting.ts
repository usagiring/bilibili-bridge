import { EVENTS, HTTP_ERRORS } from '../service/const'
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
  const data = path ? global.get(path): global.all()
  if(!data) throw HTTP_ERRORS.NOT_FOUND
  ctx.body = data
}

function update(ctx) {
  const { path, payload } = ctx.request.query
  const settings = global.set(path, payload)
  wss.broadcast({
    event: EVENTS.UPDATE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

function merge(ctx) {
  const { payload } = ctx.request.query
  const settings = global.merge(payload)
  wss.broadcast({
    event: EVENTS.MERGE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

function replace(ctx) {
  const { payload } = ctx.request.query
  const settings = global.replace(payload)
  wss.broadcast({
    event: EVENTS.REPLACE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

export default routes