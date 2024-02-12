import axios from 'axios'
import cookie from "cookie"
import querystring from "querystring"
// import httpAdapter from './http'

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
  const res = await axios.get(`${baseUrl}/x/space/acc/info?mid=${userId}&jsonp=jsonp`, {
    headers: Object.assign({}, defaultHeaders, {
      origin: "https://space.bilibili.com",
      referer: `https://space.bilibili.com/${userId}`
    }),
    timeout: 1000
  })
  return res.data
}

export async function getHistoryMessages(roomId) {
  const res = await axios.get(`${baseLiveUrl}/xlive/web-room/v1/dM/gethistory?roomid=${roomId}`, {

  })
  return res.data
}

export async function getGuardInfo(roomId, ruid) {
  const res = await axios.get(`${baseLiveUrl}/xlive/app-room/v2/guardTab/topList?roomid=${roomId}&page=1&ruid=${ruid}&page_size=29`, {})
  return res.data
}

export async function getPlayUrl(roomId) {
  const res = await axios.get(`${baseLiveUrl}/room/v1/Room/playUrl?cid=${roomId}&qn=0&platform=web`)
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
  return res
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
  return res
}

export async function getBagList(roomId, userCookie) {
  const res = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/gift/bag_list?t=${Date.now()}&room_id=${roomId}`, {
    headers: Object.assign({}, postHeader, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res
}

export async function sendBagGift(data, userCookie) {
  const { uid, gift_id, ruid, bag_id, rnd, biz_id, price } = data
  const cookies = cookie.parse(userCookie)
  const csrf = cookies.bili_jct
  const params = querystring.stringify({
    uid,
    gift_id,
    ruid,
    send_ruid: 0,
    gift_num: 1,
    bag_id,
    platform: 'pc',
    biz_code: 'live',
    biz_id,
    rnd: rnd || Math.floor(Date.now() / 1000 - 10000),
    storm_beat_id: 0,
    price: price || 0,
    csrf_token: csrf,
    csrf: csrf,
  })

  const res = await axios.post(`https://api.live.bilibili.com/gift/v2/live/bag_send`, params, {
    headers: Object.assign({}, postHeader, { cookie: userCookie }),
    // adapter: httpAdapter
  })
  return res
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