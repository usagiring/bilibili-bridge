import wss from '../service/wss'
import { CMDS } from '../service/const'

const routes = [
  {
    verb: 'post',
    uri: '/messages/clear',
    middlewares: [clear],
  }
]

async function clear(ctx) {
  wss.broadcast({
    cmd: CMDS.MESSAGE_CLEAR
  })
  ctx.body = {
    message: 'ok'
  }
}

export default routes