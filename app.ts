import Koa from 'koa'
import path from 'path'
import logger from 'koa-logger'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { send } from '@koa/send'
import router from './lib/route'
import state from './lib/service/state'
// 注册事件
import './lib/service/bilibili/handler'
import './lib/service/handler'
import './lib/service/protobuf'

const port = state.port || 3000

const app = new Koa()

app.use(cors({
  origin: '*',
  allowMethods: [ 'POST', 'OPTIONS', 'PUT', 'HEAD', 'DELETE', 'PATCH' ],
}))
app.use(bodyParser())
app.use(logger())

app.use(serve({
  maxage: 60 * 1000,
  defer: false,
}))

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('[error]', err)
    ctx.status = err.statusCode || err.status || 500
    ctx.body = {
      status: ctx.status,
      message: err.message,
    }
  }
})

app.use(router.routes())
// .use(router.allowedMethods())

console.log(`listening port: ${port} ...`)

app.listen(port)

export default app

function serve(opts: any = {}) {
  const defaultRoot = path.join(__dirname, '../bilibili-live-danmaku/web/dist')

  opts.index = opts.index ?? 'index.html'

  return async function serve(ctx, next) {
    // 每次请求动态读取 htmlPath，支持运行时修改
    const root = state.htmlPath || defaultRoot

    // 每次请求创建独立 opts，避免并发覆盖
    const sendOpts = { ...opts, root: path.resolve(root) }

    // defer: 先让下游处理，没命中再用 send 兜底
    // !defer: 先用 send 响应，没命中再交给下游
    if (sendOpts.defer) {
      await next()
      if (ctx.body != null || ctx.status !== 404) return
    }

    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      try {
        await send(ctx, ctx.path, sendOpts)
      } catch (err) {
        if (err.status !== 404) throw err
      }
    }

    if (!sendOpts.defer) {
      await next()
    }
  }
}