import {
  getRoomInfoV2,
  getInfoByUser,
  getUserInfo as getUserInfoAPI,
  getGuardInfo as getGuardInfoAPI,
  sendMessage,
  wearMedal as wearMedalAPI,
  getRoomInfoByIds as getRoomInfoByIdsAPI,
  getMedalList as getMedalListAPI,
  like as likeApi,
  getPlayUrl as getPlayUrlApi,
} from '../service/bilibili/sdk'
import { HTTP_ERROR } from '../service/const'
import { getUserCookie } from '../service/client'

const routes = [
  {
    verb: 'get',
    uri: '/bilibili/room/info',
    middlewares: [ getRoomInfo ],
  },
  {
    verb: 'post',
    uri: '/bilibili/room/info',
    middlewares: [ getRoomInfoByIds ],
  },
  {
    verb: 'get',
    uri: '/bilibili/room/user/info',
    middlewares: [ getUserInfoInRoom ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'string' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/bilibili/room/guard',
    middlewares: [ getGuardInfo ],
    validator: {
      type: 'object',
      required: [ 'roomId' ],
      properties: {
        roomId: { type: 'string' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/bilibili/room/comment/send',
    middlewares: [ sendComment ],
  },
  {
    verb: 'get',
    uri: '/bilibili/room/playurl',
    middlewares: [ getPlayUrl ],
    validator: {
      type: 'object',
      required: [ 'roomId' ],
      properties: {
        roomId: { type: 'string' },
        qn: { type: 'number' },
        withCookie: { type: 'boolean' },
      },
    },
  },

  {
    verb: 'get',
    uri: '/bilibili/user/info',
    middlewares: [ getUserInfo ],
  },

  {
    verb: 'post',
    uri: '/bilibili/medal/wear',
    middlewares: [ wearMedal ],
  },

  {
    verb: 'get',
    uri: '/bilibili/medal/list',
    middlewares: [ getMedalList ],
  },

  {
    verb: 'post',
    uri: '/bilibili/room/like',
    middlewares: [ like ],
    validator: {
      type: 'object',
      required: [ 'roomId' ],
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
        roomUserId: { type: 'string' },
        count: { type: 'number', default: 1 },
      },
    },
  },
]

async function getRoomInfo(ctx) {
  const { roomId } = ctx.__body
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function getUserInfoInRoom(ctx) {
  const { roomId, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!cookie) throw HTTP_ERROR.PARAMS_ERROR
  ctx.body = await getInfoByUser(roomId, cookie)
}

async function getUserInfo(ctx) {
  const { userId } = ctx.__body
  ctx.body = await getUserInfoAPI(userId)
}

async function getGuardInfo(ctx) {
  const { roomId, uid } = ctx.__body
  ctx.body = await getGuardInfoAPI(roomId, uid)
}

async function sendComment(ctx) {
  const { roomId, comment, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!cookie) throw HTTP_ERROR.PARAMS_ERROR
  ctx.body = await sendMessage({ message: comment, roomId }, cookie)
}

async function wearMedal(ctx) {
  const { medalId, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!cookie) throw HTTP_ERROR.PARAMS_ERROR
  ctx.body = await wearMedalAPI(medalId, cookie)
}

async function getRoomInfoByIds(ctx) {
  const { roomIds } = ctx.__body

  ctx.body = await getRoomInfoByIdsAPI(roomIds)
}

async function getMedalList(ctx) {
  const { page, pageSize, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!cookie) throw HTTP_ERROR.PARAMS_ERROR
  ctx.body = await getMedalListAPI({ page, pageSize, userCookie: cookie })
}

async function getPlayUrl(ctx) {
  const { roomId, qn, withCookie, clientId } = ctx.__body

  const result = await getPlayUrlApi({
    roomId,
    qn,
    userCookie: withCookie ? getUserCookie({ clientId }) : null,
    platform: 'web',
  })
  const urls = result.data.durl.map(d => d.url)

  ctx.body = { message: 'ok', data: { urls } }
}

async function like(ctx) {
  const { roomId, roomUserId, count, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })
  if (!cookie) throw HTTP_ERROR.PARAMS_ERROR
  ctx.body = await likeApi({ room_id: roomId, click_time: count, anchor_id: roomUserId }, cookie)
}

export default routes