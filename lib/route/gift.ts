import global from '../service/global'

const routes = [
  {
    verb: 'get',
    uri: '/gifts/config',
    middlewares: [get],
  }
]

async function get(ctx) {
  ctx.body = {
    message: 'ok',
    data: global.get('giftConfig') || {}
  }
}

export default routes