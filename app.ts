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

const html = state.htmlPath || path.join(__dirname, '../node_modules/@tokine/bilibili-danmaku-page')
console.log(html)
app.use(serve(html, {
  maxage: 60 * 1000,
  defer: false,
}))

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
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

function serve(root, opts: any = {}) {
  opts.root = path.resolve(root)
  opts.index = opts.index ?? 'index.html'

  return async function serve(ctx, next) {
    // defer: 先让下游处理，没命中再用 send 兜底
    // !defer: 先用 send 响应，没命中再交给下游
    if (opts.defer) {
      await next()
      if (ctx.body != null || ctx.status !== 404) return
    }

    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      try {
        await send(ctx, ctx.path, opts)
      } catch (err) {
        if (err.status !== 404) throw err
      }
    }

    if (!opts.defer) {
      await next()
    }
  }
}