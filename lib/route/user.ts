import { checkCookie } from '../service/bilibili/sdk'
import global from '../service/global'

const routes = [
  {
    verb: 'get',
    uri: '/need-refresh-cookie',
    middlewares: [isNeedRefreshCookie],
  },

]

async function isNeedRefreshCookie(ctx) {
  const userCookie = global.get('userCookie')
  const { data } = await checkCookie(userCookie)


  ctx.body = {
    message: 'ok',
    data: {
      isNeedRefreshCookie: data.refresh,
      timestamp: data.timestamp,
    }
  }
}


export default routes