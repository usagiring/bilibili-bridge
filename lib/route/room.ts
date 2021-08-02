import global from '../service/global'
import { COMMON_RESPONSE, ERRORS, EVENTS } from '../service/const'
import BilibiliWSClient from '../service/bilibili/ws'
import { getRoomInfoV2 } from '../service/bilibili/sdk'
import event from '../service/event'
import { Model as GiftModel } from '../model/gift'
import { Model as CommentModel } from '../model/comment'
import { Model as InteractModel } from '../model/interact'
const bilibiliWSClient = new BilibiliWSClient()

const routes = [
  {
    verb: 'get',
    uri: '/rooms/:roomId',
    middlewares: [getRoomInfo]
  },
  {
    verb: 'post',
    uri: '/rooms/:roomId/connect',
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
    uri: '/rooms/:roomId/disconnect',
    middlewares: [disconnect]
  },
  {
    verb: 'get',
    uri: '/rooms/:roomId/real-time/viewers/count',
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
    uri: '/rooms/:roomId/status',
    middlewares: [getStatus],
  }
]

async function getRoomInfo(ctx) {
  const { roomId } = ctx.__body
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function connect(ctx) {
  const { roomId } = ctx.__body
  await bilibiliWSClient.connect({ roomId: Number(roomId) })
  global.set('roomId', roomId)
  global.set('isConnected', true)

  event.emit(EVENTS.GET_GIFT_CONFIG, { roomId })

  ctx.body = COMMON_RESPONSE
}

async function disconnect(ctx) {
  // const { roomId } = ctx.__body
  if (!bilibiliWSClient) {
    throw new Error(ERRORS.SYSTEM_ERROR)
  }
  await bilibiliWSClient.close()
  global.set('isConnected', false)
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
  const isConnected = bilibiliWSClient.isConnected()
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