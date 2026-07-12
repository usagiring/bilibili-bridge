import { COMMON_RESPONSE, ERROR, HTTP_ERROR } from '../service/const'
import BilibiliWSClient from '../service/bilibili/ws'
import { getGiftList, getRoomInfoV2 } from '../service/bilibili/sdk'
import { sql } from 'drizzle-orm'
import { messages } from '../model/message.sqlite'
import { db } from '../service/db'
import { getClient, getUserCookie } from '../service/client'
import { CreateRecorder, createRecorder } from '../service/bilibili/record'
import { state } from '../service/state'

const routes = [
  {
    verb: 'get',
    uri: '/room/info',
    middlewares: [ getRoomInfo ],
  },
  {
    verb: 'post',
    uri: '/room/connect',
    middlewares: [ connect ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'string' },
        userId: { type: 'string' },
        clientId: { type: 'string' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/room/disconnect',
    middlewares: [ disconnect ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/room/real-time/viewer/count',
    middlewares: [ getRealTimeViewersCount ],
    validator: {
      type: 'object',
      required: [ 'roomId' ],
      properties: {
        roomId: { type: 'string' },
        startedAt: { type: 'number' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/room/status',
    middlewares: [ getStatus ],
    validator: {
      type: 'object',
      required: [ 'roomIds' ],
      properties: {
        roomIds: { type: 'array', items: { type: 'string' }, separator: ',' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/room/gift/list',
    middlewares: [ getRoomGiftList ],
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
    uri: '/room/record/start',
    middlewares: [ startRecord ],
    validator: {
      type: 'object',
      required: [ 'clientId', 'roomId' ],
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
        output: { type: 'string' },
        qn: { type: 'number' },
        platform: { type: 'string' },
        withCookie: { type: 'boolean' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/room/record/cancel',
    middlewares: [ cancelRecord ],
    validator: {
      type: 'object',
      required: [ 'clientId', 'roomId' ],
      properties: {
        clientId: { type: 'string' },
        roomId: { type: 'string' },
      },
    },
  },
]

async function getRoomInfo(ctx) {
  const { roomId } = ctx.__body
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function connect(ctx) {
  const { roomId, userId, clientId } = ctx.__body

  const instance = state.bilibiliWSInstances.find(i => i.roomId === roomId)
  if (!instance) {
    const bilibiliWSClient = new BilibiliWSClient()
    const cookie = getUserCookie({ clientId })
    await bilibiliWSClient.connect({ 
      roomId,
      clientId,
      cookie,
    })

    state.bilibiliWSInstances?.push({
      instance: bilibiliWSClient,
      roomId,
      userId,
      clientId,
    })
  }

  ctx.body = COMMON_RESPONSE
}

async function disconnect(ctx) {
  const { clientId, roomId } = ctx.__body

  const instance = state.bilibiliWSInstances.find(instance => instance.roomId === roomId)
  if (instance) {
    await instance.instance.close()
    state.bilibiliWSInstances = state.bilibiliWSInstances?.filter(i => i.roomId !== roomId)
  } else {
    throw new Error(ERROR.SYSTEM_ERROR)
  }

  ctx.body = COMMON_RESPONSE
}

async function getRealTimeViewersCount(ctx) {
  const { roomId: _roomId } = ctx.__body
  let { startedAt } = ctx.__body
  if (!startedAt) startedAt = Date.now() - 1000 * 60 * 10

  // TODO: 添加 roomId / startedAt WHERE 条件
  const result = db.select({ count: sql<number>`count(distinct ${messages.userId})` })
    .from(messages)
    .get()

  ctx.body = { message: 'ok', data: result?.count || 0 }
}

async function getStatus(ctx) {
  const { clientId, roomIds } = ctx.__body

  const data = roomIds.map(roomId => {
    const isConnected = !!state.bilibiliWSInstances.find(i => {
      return i.roomId === roomId && i.clientId === clientId && i.instance
    })

    const isRecording = !!state.recorders.find(i => {
      return i.roomId === roomId && i.clientId === clientId && i.instance
    })

    return {
      roomId, 
      isConnected,
      isRecording,
    }
  })

  ctx.body = {
    message: 'ok',
    data,
  }
}

async function getRoomGiftList(ctx) {
  const { clientId, roomId, roomUserId } = ctx.__body

  let cache = state.giftCache[roomId]
  if (!cache) {
    const result = await getGiftList({ roomId, roomUserId })
    const gifts = result.data?.gift_config?.base_config?.list || []
    const _gifts = gifts.map(gift => {
      return {
        id: gift.id,
        webp: gift.webp,
        name: gift.name,
        price: gift.price,
        coinType: gift.coin_type,
      }
    })
    cache = _gifts
    state.giftCache[roomId] = _gifts
  }

  ctx.body = {
    message: 'ok',
    data: cache,
  }
}

async function startRecord(ctx) {
  const { roomId, output, qn, withCookie, clientId } = ctx.__body
  const cookie = getUserCookie({ clientId })

  const recorder = state.recorders.find(r => r.roomId === roomId && r.clientId === clientId && r.instance)

  // new instance
  if (!recorder) {
    const param: CreateRecorder = {
      clientId,
      roomId,
      output,
      qn,
    }

    if (withCookie) param.cookie = cookie

    const recorder = createRecorder(param)

    try {
      await recorder.start()
    } catch (e) {
      console.error(e)
      throw HTTP_ERROR.SYSTEM_ERROR
    }

    state.recorders.push({
      clientId,
      roomId,
      instance: recorder,
    })
  }

  ctx.body = COMMON_RESPONSE
}

async function cancelRecord(ctx) {
  const { clientId, roomId } = ctx.__body

  const recorder = state.recorders.find(r => r.roomId === roomId && r.clientId === clientId && r.instance)
  if (!recorder) throw HTTP_ERROR.PARAMS_ERROR
  await recorder.instance.cancel()
  state.recorders = state.recorders.filter(r => r.roomId !== roomId)
  ctx.body = COMMON_RESPONSE
}

export default routes