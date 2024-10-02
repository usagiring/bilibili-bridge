import Koa from 'koa'
import path from 'path'
import logger from 'koa-logger'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import * as send from '@koa/send'
import router from './lib/route'
import wss from './lib/service/wss'
import global from './lib/service/state'
// 注册事件
import './lib/service/bilibili/handler'
import './lib/service/handler'

import './lib/service/protobuf'

const PORT = global.get('PORT') || 3000

const app = new Koa()

app.use(cors({
  origin: '*',
  allowMethods: ['POST', 'OPTIONS', 'PUT', 'HEAD', 'DELETE', 'PATCH']
}))
app.use(bodyParser())
app.use(logger())

const html = global.get('HTML_PATH') || path.join(__dirname, '../node_modules/@tokine/bilibili-danmaku-page')
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

app
  .use(router.routes())
// .use(router.allowedMethods())

const server = app.listen(PORT)

wss.init(server)

console.log(`listening port: ${PORT} ...`)
export default app

function serve(root, opts: any = {}) {
  opts.root = path.resolve(root)
  opts.index = opts.index ?? 'index.html'

  if (!opts.defer) {
    return async function serve(ctx, next) {
      let done = false

      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        try {
          done = await send.send(ctx, ctx.path, opts)
        } catch (err) {
          if (err.status !== 404) {
            throw err
          }
        }
      }

      if (!done) {
        await next()
      }
    }
  }

  return async function serve(ctx, next) {
    await next()

    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return
    // response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

    try {
      await send(ctx, ctx.path, opts)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}