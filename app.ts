
import Koa from 'koa'
import config from 'config'
import router from './lib/route'
import wss from './lib/service/wss'
import http from 'http'

// 注册事件
import './lib/service/socket-event'

http.createServer()
const PORT = config.get('PORT')

const app = new Koa()

// wss connect
// wss(app)

app
  .use(router.routes())
  .use(router.allowedMethods())

const server = app.listen(PORT)

wss.init(server)

console.log(`listening port: ${PORT} ...`)

export default app