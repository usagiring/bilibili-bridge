
import Koa from 'koa'
import config from 'config'
import router from './lib/route'
import wss from './lib/service/wss'

// 注册事件
import './lib/service/socket-event'

const PORT = config.get('PORT') || 3000

const app = new Koa()
app
  .use(router.routes())
  .use(router.allowedMethods())

const server = app.listen(PORT)

wss.init(server)

console.log(`listening port: ${PORT} ...`)
export default app