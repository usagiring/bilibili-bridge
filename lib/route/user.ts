import {
  checkCookie,
  getQrCode as getQrCodeApi,
  loginFromQrCode as loginFromQrCodeApi,
  refreshCookie as refreshCookieApi,
} from '../service/bilibili/sdk'
import { getUserCookie } from '../service/client'
import { HTTP_ERROR } from '../service/const'

const routes = [
  { verb: 'get', uri: '/cookie/refresh/check', middlewares: [ isNeedRefreshCookie ] },
  { verb: 'post', uri: '/cookie/refresh', middlewares: [ refreshCookie ] },
  { verb: 'get', uri: '/login/qr-code/generate', middlewares: [ getQrCode ] },
  { verb: 'get', uri: '/login/qr-code/poll', middlewares: [ loginFromQrCode ] },
]

async function isNeedRefreshCookie(ctx) {
  const { clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  const result = { isNeedRefreshCookie: true, timestamp: Date.now() }
  try {
    if (cookie) {
      const { data } = await checkCookie(cookie)
      result.isNeedRefreshCookie = data.refresh
      result.timestamp = data.timestamp
    }
  } catch { /* ignore */ }

  ctx.body = { message: 'ok', data: result }
}

async function refreshCookie(ctx) {
  const { refreshToken, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!refreshToken || !cookie) throw HTTP_ERROR.PARAMS_ERROR
  const result = await refreshCookieApi({ refreshToken, userCookie: cookie })

  ctx.body = { message: 'ok', data: result }
}

async function getQrCode(ctx) {
  ctx.body = await getQrCodeApi()
}

async function loginFromQrCode(ctx) {
  const { qrCodeKey, clientId } = ctx.__body
  const res = await loginFromQrCodeApi(qrCodeKey)

  if (res.data.data.code) {
    ctx.body = { ...res.data.data }
    return
  }

  const cookies = res.headers['set-cookie'] ?? []
  const cookie = cookies.map((c: string) => c.split(';')[0]).join(';')

  // 保存 cookie 到客户端
  if (cookie) {
    getUserCookie({ clientId })
  }

  ctx.body = { ...res.data.data, cookie }
}

export default routes