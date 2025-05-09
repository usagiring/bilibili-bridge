import {
  checkCookie,
  getQrCode as getQrCodeApi,
  loginFromQrCode as loginFromQrCodeApi,
  refreshCookie as refreshCookieApi,
} from '../service/bilibili/sdk'
import global from '../service/state'
import state from '../service/state'
import { HTTP_ERRORS } from '../service/const'

const routes = [
  {
    verb: 'get',
    uri: '/cookie/refresh/check',
    middlewares: [isNeedRefreshCookie],
  },

  {
    verb: 'post',
    uri: '/cookie/refresh',
    middlewares: [refreshCookie],
  },

  {
    verb: 'get',
    uri: '/login/qr-code/generate',
    middlewares: [getQrCode]
  },
  {
    verb: 'get',
    uri: '/login/qr-code/poll',
    middlewares: [loginFromQrCode]
  }
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

async function refreshCookie(ctx) {
  const { refreshToken } = ctx.__body
  const userCookie = state.get('userCookie')
  if (!refreshToken || !userCookie) throw HTTP_ERRORS.PARAMS_ERROR
  const result = await refreshCookieApi({ refreshToken, userCookie })

  ctx.body = {
    message: 'ok',
    data: result
  }
}

// TODO proxy api
async function getQrCode(ctx) {
  const res = await getQrCodeApi()
  ctx.body = res
}

async function loginFromQrCode(ctx) {
  const { qrCodeKey } = ctx.__body
  const res = await loginFromQrCodeApi(qrCodeKey)

  if (res.data.data.code) {
    ctx.body = {
      ...res.data.data,
    }
    return
  }

  const cookies = res.headers['set-cookie']
  const cookie = cookies.map(cookie => cookie.split(';')[0]).join(';')

  ctx.body = {
    ...res.data.data,
    cookie,
  }

}


export default routes