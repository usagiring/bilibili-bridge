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
  const result = {
    isNeedRefreshCookie: true,
    timestamp: Date.now(),
  }
  try {
    const { data } = await checkCookie(userCookie)
    result.isNeedRefreshCookie = data.refresh
    result.timestamp = data.timestamp
  } catch (e) {
    // 
  }

  ctx.body = {
    message: 'ok',
    data: result
  }
}


export default routes