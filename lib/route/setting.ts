import { EVENTS } from '../service/const'
import global from '../service/global'
import wss from '../service/wss'

const routes = [
  {
    verb: 'get',
    uri: '/settings',
    middlewares: [get]
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

function get(ctx) {
  const { path } = ctx.params
  ctx.body = global.get(path)
}

function update(ctx) {
  const { path, payload } = ctx.params
  const settings = global.set(path, payload)
  wss.broadcast({
    event: EVENTS.UPDATE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

function merge(ctx) {
  const { payload } = ctx.params
  const settings = global.merge(payload)
  wss.broadcast({
    event: EVENTS.MERGE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

function replace(ctx) {
  const { payload } = ctx.params
  const settings = global.replace(payload)
  wss.broadcast({
    event: EVENTS.REPLACE_SETTING,
    payload: settings
  })
  ctx.body = settings
}

export default routes