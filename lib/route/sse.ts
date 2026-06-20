import sse from '../service/sse'
import { COMMON_RESPONSE } from '../service/const'

const routes = [
  {
    verb: 'get',
    uri: '/sse/connect',
    middlewares: [ connect ],
  },
]

/**
 * GET /api/sse/connect?clientId=xxx
 * 客户端发起 SSE 连接，服务端保持长连接推送消息
 */
async function connect(ctx) {
  const clientId = ctx.query.clientId as string

  if (!clientId) {
    ctx.status = 400
    ctx.body = { message: 'clientId is required' }
    return
  }

  // 注册 SSE 连接（同一个 clientId 允许多个连接并存）
  // 必须显式告知 Koa 不要接管响应，否则 Koa 可能在中间件返回后关闭连接
  ctx.respond = false
  sse.register(ctx, clientId)

  // 不调用 next()，连接由 sse.register() 接管
}

export default routes
