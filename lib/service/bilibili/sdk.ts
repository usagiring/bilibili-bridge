import axios from 'axios'
import cookie from "cookie"
import crypto from 'crypto'
import querystring from "querystring"
import state from '../state'

const baseUrl = 'https://api.bilibili.com'
const baseLiveUrl = 'https://api.live.bilibili.com'

const defaultHeaders = {
  origin: "https://live.bilibili.com",
  referer: "https://live.bilibili.com/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  accept: "application/json, text/javascript, */*; q=0.01",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
}

const postHeader = Object.assign({}, defaultHeaders, {
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
})

interface BaseResponse {
  code: number,
  message: string
}

export interface SendMessage {
  message: string
  roomId: number
  color?: number
  fontsize?: number
  mode?: number
  rnd?: number
  bubble?: number
  replyMid?: number
}

export async function getRoomInfoV1(roomId) {
  const res = await axios.get(`${baseLiveUrl}/room/v1/Room/get_info?room_id=${roomId}&from=room`)
  return res.data
}

export async function getRoomInfoV2(roomId) {
  const res = await axios.get(`${baseLiveUrl}/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`, {
    headers: defaultHeaders
  })
  return res.data
}

export async function getInfoByUser(roomId, userCookie) {
  const res = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=${roomId}&from=0`, {
    headers: Object.assign({}, defaultHeaders, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res.data
}

export async function getDamankuInfo(roomId, userCookie): Promise<BaseResponse & {
  ttl: number
  data: {
    group: string
    business_id: number
    refresh_row_factor: number
    refresh_rate: number
    max_delay: number
    token: string
    host_list: {
      host: string
      port: number
      wss_port: number
      ws_port: number
    }[]
  }
}> {
  const res = await axios.get(`${baseLiveUrl}/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}&type=0`, {
    headers: userCookie ? Object.assign({}, defaultHeaders, { cookie: userCookie }) : defaultHeaders
  })
  return res.data
}

export async function getGiftConfig(roomId, platform = 'pc') {
  const res = await axios.get(`${baseLiveUrl}/xlive/web-room/v1/giftPanel/giftConfig?platform=${platform}&room_id=${roomId}`, {
    headers: defaultHeaders
  })
  return res.data
}

export async function getUserInfo(userId) {
  const querystring = await getSignedQueryString({
    params: {
      mid: userId,
      platform: 'web'
    }
  })

  const res = await axios.get(`${baseUrl}/x/space/wbi/acc/info?${querystring}`, {
    headers: Object.assign({}, defaultHeaders),
    timeout: 1000
  })
  return res.data
}

export async function getHistoryMessages(roomId) {
  const res = await axios.get(`${baseLiveUrl}/xlive/web-room/v1/dM/gethistory?roomid=${roomId}`, {

  })
  return res.data
}

// ruid: 当前主播 uid
export async function getGuardInfo(roomId, ruid) {
  const res = await axios.get(`${baseLiveUrl}/xlive/app-room/v2/guardTab/topList?roomid=${roomId}&page=1&ruid=${ruid}&page_size=29`, {})
  return res.data
}

export async function sendMessage(data: SendMessage, userCookie: string) {
  const { message, roomId, color, fontsize, mode, rnd, bubble, replyMid } = data
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct
  const params = querystring.stringify({
    color: color || 16777215,
    fontsize: fontsize || 25,
    reply_mid: replyMid, // @用户ID
    mode: mode || 1,
    msg: message,
    rnd: rnd || Math.floor(Date.now() / 1000 - 10000),
    roomid: roomId,
    bubble: bubble || 0,
    csrf_token: csrf,
    csrf: csrf,
  })

  const res = await axios.post(`https://api.live.bilibili.com/msg/send`, params, {
    headers: Object.assign({}, postHeader, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res.data
}

export async function wearMedal(medalId, userCookie) {
  if (!medalId) throw new Error('medalId is required')
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct
  const params = querystring.stringify({
    medal_id: medalId,
    csrf_token: csrf,
    csrf: csrf,
  })

  const res = await axios.post(`https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear`, params, {
    headers: Object.assign({}, postHeader, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res.data
}

export async function getBagList(roomId, userCookie) {
  const res = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/gift/bag_list?t=${Date.now()}&room_id=${roomId}`, {
    headers: Object.assign({}, postHeader, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res.data
}

export async function getRoomInfoByIds(ids: string[]) {
  if (!ids || !ids.length) return { data: [] }
  const res = await axios.get(`https://api.live.bilibili.com/room/v1/Room/get_info_by_id?${ids.map(id => `ids[]=${id}`).join('&')}`, {
    headers: Object.assign({}, defaultHeaders),
  })
  return res.data
}

export async function getMedalList({
  page = 1,
  pageSize = 10,
  userCookie
}: {
  page: number
  pageSize: number
  userCookie: string
}) {
  const res = await axios.get(
    `https://api.live.bilibili.com/xlive/app-ucenter/v1/user/GetMyMedals?page=${page}&page_size=${pageSize}`,
    {
      headers: Object.assign({}, defaultHeaders, { cookie: userCookie }),
    }
  )
  return res.data
}

export async function searchUser(data, userCookie) {
  const { name } = data
  const res = await axios.get(
    `https://api.live.bilibili.com/banned_service/v2/Silent/search_user?search=${encodeURIComponent(name)}`,
    {
      headers: Object.assign({}, postHeader, { cookie: userCookie }),
      // adapter: httpAdapter
    }
  )
  return res.data
}

interface AddSilentUserOption {
  roomId: number
  tuid: number
  mobile_app?: string
  visit_id?: string // 12dim random string? eg.1qhhblrij268
}

export async function addSilentUser(data: AddSilentUserOption, userCookie) {
  const { roomId, tuid, mobile_app, visit_id } = data
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct
  const params = querystring.stringify({
    room_id: roomId,
    tuid,
    mobile_app: mobile_app || 'web',
    csrf_token: csrf,
    csrf: csrf,
    visit_id: visit_id || '',
  })

  const res = await axios.post(
    `https://api.live.bilibili.com/xlive/web-ucenter/v1/banned/AddSilentUser`,
    params,
    {
      headers: Object.assign({}, postHeader, { cookie: userCookie }),
      // adapter: httpAdapter
    }
  )
  return res.data
}

// 获取游客 buvid, 有cookie则从cookie中拿
export async function getFinger(): Promise<BaseResponse & {
  data: {
    b_3: string
    b_4: string
  }
}> {
  const res = await axios.get(`${baseUrl}/x/frontend/finger/spi`, {
    headers: defaultHeaders
  })
  return res.data
}

export async function checkCookie(userCookie): Promise<BaseResponse & {
  data: {
    refresh: boolean
    timestamp: number
  }
}> {
  const res = await axios.get(`https://passport.bilibili.com/x/passport-login/web/cookie/info`, {
    headers: Object.assign({}, defaultHeaders, { cookie: userCookie }),
  })
  return res.data
}

export async function getQrCode() {
  const res = await axios.get(`https://passport.bilibili.com/x/passport-login/web/qrcode/generate`, {
    headers: Object.assign({}, defaultHeaders),
  })
  return res.data
}

export async function loginFromQrCode(qrCodeKey) {
  const res = await axios.get(`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrCodeKey}`, {
    headers: Object.assign({}, defaultHeaders),
  })
  return res
}

export async function getPlayUrl({
  roomId,
  platform,
  qn,
  userCookie,
}) {
  const res = await axios.get(`${baseLiveUrl}/room/v1/Room/playUrl?cid=${roomId}&qn=${qn || 0}&platform=${platform || 'web'}`, {
    headers: userCookie ? Object.assign({}, defaultHeaders, { cookie: userCookie }) : defaultHeaders
  })
  return res.data
}

export async function getRandomPlayUrl(param) {
  const result = await getPlayUrl(param)
  const urlsLength = result.data.durl.length
  return result.data.durl[Math.floor(Math.random() * urlsLength)].url
}

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

async function getWbiKeys() {
  const res = await axios.get(`https://api.bilibili.com/x/web-interface/nav`, {
    headers: Object.assign({}, defaultHeaders),
  })
  const data = res.data
  const { img_url, sub_url } = data.data.wbi_img
  const imgKey = img_url.replace('https://i0.hdslb.com/bfs/wbi/', '').replace('.png', '')
  const subKey = sub_url.replace('https://i0.hdslb.com/bfs/wbi/', '').replace('.png', '')
  return {
    imgKey,
    subKey
  }
}

// 对 imgKey 和 subKey 进行字符顺序打乱编码
async function getMixinKey() {
  const wbi = state.get('wbi')
  // if(wbi?.expired && wbi?.mixinKey && wbi.expired < new Date()) {
  //   return wbi.mixinKey
  // }
  if (wbi?.mixinKey) return wbi.mixinKey

  const { imgKey, subKey } = await getWbiKeys()
  const orig = imgKey + subKey

  let temp = ''
  mixinKeyEncTab.forEach((n) => {
    temp += orig[n]
  })
  const mixinKey = temp.slice(0, 32)

  state.set('wbi', {
    mixinKey
  })

  return mixinKey
}

async function getSignedQueryString({ params }) {
  const mixinKey = await getMixinKey()
  const currTime = Math.round(Date.now() / 1000)
  // const chr_filter = /[!'\(\)*]/g

  Object.assign(params, { wts: currTime })    // 添加 wts 字段

  const querystring = Object.keys(params)
    .sort() // 按照 key 重排参数
    .map((key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    })
    .join('&')

  // Object.keys(params).sort().forEach((key) => {
  //   query.push(
  //     encodeURIComponent(key) +
  //     '=' +
  //     // 过滤 value 中的 "!'()*" 字符
  //     encodeURIComponent(('' + params[key]).replace(chr_filter, ''))
  //   )
  // })
  const hash = crypto.createHash('md5')
  hash.update(querystring + mixinKey)
  const wbi_sign = hash.digest('hex')
  // const wbi_sign = md5(querystring + mixinKey) // 计算 w_rid
  return `${querystring}&w_rid=${wbi_sign}`
}

/**
 *    CorrespondPath = 生成CorrespondPath(当前毫秒时间戳)
      refresh_csrf = 获取refresh_csrf(CorrespondPath, cookie)
      refresh_token_old = refresh_token # 这一步必须保存旧的 refresh_token 备用
      cookie, refresh_token = 刷新Cookie(refresh_token, refresh_csrf, cookie)
      确认更新(refresh_token_old, cookie) # 这一步需要新的 Cookie 以及旧的 refresh_token
 */
export async function refreshCookie({ refreshToken, userCookie }): Promise<{ userCookie: string, refreshToken: string }> {
  const correspondPath = await getCorrespondPath()
  await new Promise(resolve => setTimeout(resolve, 4001))
  const refreshCsrf = await getRefreshCsrf({ correspondPath, userCookie })
  const result = await __refreshCookie({ userCookie, refreshCsrf: refreshCsrf, refreshToken })
  await confirmRefresh({ userCookie: result.userCookie, refreshToken })
  return result
}

async function getCorrespondPath() {
  const publicKey = await globalThis.crypto.subtle.importKey(
    "jwk",
    {
      kty: "RSA",
      n: "y4HdjgJHBlbaBN04VERG4qNBIFHP6a3GozCl75AihQloSWCXC5HDNgyinEnhaQ_4-gaMud_GF50elYXLlCToR9se9Z8z433U3KjM-3Yx7ptKkmQNAMggQwAVKgq3zYAoidNEWuxpkY_mAitTSRLnsJW-NCTa0bqBFF6Wm1MxgfE",
      e: "AQAB",
    },
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  )

  const ts = Date.now()
  const data = new TextEncoder().encode(`refresh_${ts}`)
  const encrypted = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data))
  const correspondPath = encrypted.reduce((str, c) => str + c.toString(16).padStart(2, "0"), "")

  return correspondPath
}

async function getRefreshCsrf({ correspondPath, userCookie }) {
  const url = `https://www.bilibili.com/correspond/1/${correspondPath}`

  console.log(url)
  const res = await axios.get(url, {
    headers: Object.assign({}, {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'cache-control': 'max-age=0',
      'priority': 'u=0, i',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'cookie': userCookie,
    }),
  }).catch(e => {
    console.error(e)
    throw e
  })

  console.log(res.data)

  const regexp = /<div id="1-name">(.+?)<\/div>/

  const matches = res.data.match(regexp)
  const refreshCsrf = matches?.[1] || null

  console.log(refreshCsrf)
  return refreshCsrf

}

async function __refreshCookie({ userCookie, refreshCsrf, source = 'main_web', refreshToken }) {
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct

  console.log({ userCookie, refreshCsrf, source, refreshToken, csrf })

  const url = `https://passport.bilibili.com/x/passport-login/web/cookie/refresh`
  const res = await axios.post(url, {
    csrf: csrf,
    refresh_csrf: refreshCsrf,
    source,
    refresh_token: refreshToken
  }, {
    headers: Object.assign({}, postHeader, {
      'cookie': userCookie,
    }),
  })
  console.log(res.data)

  const newCookies = res.headers['set-cookie']
  const newCookie = newCookies.map(cookie => cookie.split(';')[0]).join(';')

  return {
    userCookie: newCookie,
    refreshToken: res.data.data.refresh_token
  }
}

async function confirmRefresh({ userCookie, refreshToken }) {
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct

  const url = `https://passport.bilibili.com/x/passport-login/web/confirm/refresh`
  const res = await axios.post(url, {
    csrf,
    refresh_token: refreshToken
  }, {
    headers: Object.assign({}, postHeader, {
      'cookie': userCookie,
    }),
  })
  console.log(res.data)
  return res.data
}