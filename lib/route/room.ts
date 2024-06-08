import runtime from '../service/runtime'
import { COMMON_RESPONSE, ERRORS, EVENTS } from '../service/const'
import BilibiliWSClient from '../service/bilibili/ws'
import { getRoomInfoV2 } from '../service/bilibili/sdk'
import event from '../service/event'
import { Model as GiftModel } from '../model/gift'
import { Model as CommentModel } from '../model/comment'
import { Model as InteractModel } from '../model/interact'

const routes = [
  {
    verb: 'get',
    uri: '/room/:roomId',
    middlewares: [getRoomInfo]
  },
  {
    verb: 'post',
    uri: '/room/:roomId/connect',
    middlewares: [connect],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'number' }
      }
    }
  },
  {
    verb: 'post',
    uri: '/room/:roomId/disconnect',
    middlewares: [disconnect]
  },
  {
    verb: 'get',
    uri: '/room/:roomId/real-time/viewer/count',
    middlewares: [getRealTimeViewersCount],
    validator: {
      type: 'object',
      required: ['roomId'],
      properties: {
        roomId: { type: 'number' },
        startedAt: { type: 'number' }
      }
    }
  },
  {
    verb: 'get',
    uri: '/room/:roomId/status',
    middlewares: [getStatus],
  }
]

async function getRoomInfo(ctx) {
  const { roomId } = ctx.__body
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function connect(ctx) {
  const { roomId, uid } = ctx.__body

  const bilibiliWSClient = new BilibiliWSClient()
  await bilibiliWSClient.connect({ uid: Number(uid) || 0, roomId: Number(roomId) })

  // global.set('roomId', roomId)
  // global.set('isConnected', true)
  // global.setInner('bilibiliWSClient', bilibiliWSClient)

  runtime.set(`connectionPoolMap.${roomId}`, {
    roomId,
    isConnected: true,
    wsClient: bilibiliWSClient
  })

  event.emit(EVENTS.GET_GIFT_CONFIG, { roomId })

  ctx.body = COMMON_RESPONSE
}

async function disconnect(ctx) {
  const { roomId } = ctx.__body
  const bilibiliWSClient = runtime.get(`connectionPoolMap.${roomId}.wsClient`)
  if (!bilibiliWSClient) {
    throw new Error(ERRORS.SYSTEM_ERROR)
  }
  await bilibiliWSClient.close()
  // global.set('isConnected', false)
  // global.setInner('bilibiliWSClient', null)

  runtime.unset(`connectionPoolMap.${roomId}`)
  ctx.body = COMMON_RESPONSE
}

async function getRealTimeViewersCount(ctx) {
  const { roomId } = ctx.__body
  let { startedAt } = ctx.__body
  if (!startedAt) startedAt = Date.now() - 1000 * 60 * 10

  const [comments, gifts, interacts] = await Promise.all([
    CommentModel.find(
      { roomId, sendAt: { $gte: startedAt } },
      { projection: { uid: 1 } }
    ),
    GiftModel.find(
      { roomId, sendAt: { $gte: startedAt } },
      { projection: { uid: 1 } }
    ),
    InteractModel.find(
      { roomId, sendAt: { $gte: startedAt } },
      { projection: { uid: 1 } }
    ),
  ])
  const countMap = comments
    .concat(gifts as any)
    .concat(interacts as any)
    .reduce((map, i) => {
      map[i.uid] = 1
      return map
    }, {})
  const count = Object.keys(countMap).length
  ctx.body = {
    message: 'ok',
    data: count
  }
}

async function getStatus(ctx) {
  const { roomId } = ctx.__body
  const isConnected = runtime.get(`connectionPoolMap.${roomId}.isConnected`)

  const data = {
    roomId: roomId,
    isConnected,
  }
  ctx.body = {
    message: 'ok',
    data
  }
}

export default routes