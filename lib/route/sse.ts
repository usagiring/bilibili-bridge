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

  // 如果已有同 ID 连接，先关闭旧的
  if (sse.isConnected(clientId)) {
    console.log(`[SSE] replacing existing connection: ${clientId}`)
  }

  // 注册 SSE 连接（此方法内部会保持连接不释放）
  // 必须显式告知 Koa 不要接管响应，否则 Koa 可能在中间件返回后关闭连接
  ctx.respond = false
  sse.register(ctx, clientId)

  // 不调用 next()，连接由 sse.register() 接管
}

export default routes
