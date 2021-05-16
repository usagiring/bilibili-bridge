import Koa from 'koa'
import cors from '@koa/cors'
import koaBody from 'koa-body'
import router from './lib/route'
import wss from './lib/service/wss'
import global from './lib/service/global'

// 注册事件
import './lib/service/socket-event'

const PORT = global.get('PORT') || 3000

const app = new Koa()

app.use(cors({
  origin: '*'
}))
app.use(koaBody())

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      status: ctx.status,
      message: err.message,
    }
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods())

const server = app.listen(PORT)

wss.init(server)

console.log(`listening port: ${PORT} ...`)
export default app