import {
  getRoomInfoV2,
  getInfoByUser,
  getUserInfo as getUserInfoAPI,
  getGuardInfo as getGuardInfoAPI,
  sendMessage,
  wearMedal as wearMedalAPI,
  getRoomInfoByIds as getRoomInfoByIdsAPI,
  getMedalList as getMedalListAPI,
  getRandomPlayUrl,
  like as likeApi,
} from '../service/bilibili/sdk'
import { HTTP_ERRORS } from '../service/const'
import state from '../service/state'

const routes = [
  {
    verb: 'get',
    uri: '/bilibili/room/:roomId/info',
    middlewares: [getRoomInfo]
  },
  {
    verb: 'post',
    uri: '/bilibili/room/info',
    middlewares: [getRoomInfoByIds]
  },
  {
    verb: 'get',
    uri: '/bilibili/room/:roomId/user/info',
    middlewares: [getUserInfoInRoom],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'string' }
      }
    }
  },
  {
    verb: 'get',
    uri: '/bilibili/room/:roomId/guard',
    middlewares: [getGuardInfo],
    validator: {
      type: 'object',
      required: ['roomId'],
      properties: {
        roomId: { type: 'string' },
      }
    }
  },
  {
    verb: 'post',
    uri: '/bilibili/room/:roomId/comment/send',
    middlewares: [sendComment],
  },
  {
    verb: 'get',
    uri: '/bilibili/room/:roomId/playurl',
    middlewares: [getPlayUrl],
    validator: {
      type: 'object',
      required: ['roomId'],
      properties: {
        roomId: { type: 'string' },
        qn: { type: 'number' },
        withCookie: { type: 'boolean' },
      }
    }
  },

  {
    verb: 'get',
    uri: '/bilibili/user/:userId/info',
    middlewares: [getUserInfo]
  },

  {
    verb: 'post',
    uri: '/bilibili/medal/wear',
    middlewares: [wearMedal],
  },

  {
    verb: 'get',
    uri: '/bilibili/medal/list',
    middlewares: [getMedalList]
  },

  {
    verb: 'post',
    uri: '/room/:roomId/like',
    middlewares: [like],
  }
]

async function getRoomInfo(ctx) {
  const { roomId } = ctx.__body
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function getUserInfoInRoom(ctx) {
  const { roomId, userId } = ctx.__body
  const cookie = state.get('userCookie')
  if (!cookie) {
    throw HTTP_ERRORS.PARAMS_ERROR
  }
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
  const { roomId, comment } = ctx.__body
  const cookie = state.get('userCookie')
  if (!cookie) {
    throw HTTP_ERRORS.PARAMS_ERROR
  }
  ctx.body = await sendMessage({
    message: comment,
    roomId
  }, cookie)
}

async function wearMedal(ctx) {
  const { medalId } = ctx.__body
  const cookie = state.get('userCookie')
  if (!cookie) {
    throw HTTP_ERRORS.PARAMS_ERROR
  }

  ctx.body = await wearMedalAPI(medalId, cookie)

}

async function getRoomInfoByIds(ctx) {
  const { roomIds } = ctx.__body

  ctx.body = await getRoomInfoByIdsAPI(roomIds)
}

async function getMedalList(ctx) {
  const { page, pageSize } = ctx.__body
  const cookie = state.get('userCookie')
  if (!cookie) {
    throw HTTP_ERRORS.PARAMS_ERROR
  }

  ctx.body = await getMedalListAPI({
    page,
    pageSize,
    userCookie: cookie
  })
}

async function getPlayUrl(ctx) {
  const { roomId, qn, withCookie } = ctx.__body

  const playUrl = await getRandomPlayUrl({
    roomId,
    qn,
    userCookie: withCookie ? state.get('userCookie') : null
  })

  ctx.body = {
    message: 'ok',
    data: {
      url: playUrl
    }
  }
}

async function like(ctx) {
  const { roomId, ruid, count } = ctx.__body

  const cookie = state.get('userCookie')

  const result = await likeApi({
    room_id: roomId,
    click_time: count,
    anchor_id: ruid,
  }, cookie)

  ctx.body = result
}


export default routes