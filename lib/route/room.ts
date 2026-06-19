import { COMMON_RESPONSE, ERROR } from '../service/const'
import BilibiliWSClient from '../service/bilibili/ws'
import { getRoomInfoV2 } from '../service/bilibili/sdk'
import { sql } from 'drizzle-orm'
import { messages } from '../model/message.sqlite'
import { db } from '../service/db'
import { getClient, getUserCookie } from '../service/client'
import * as biliRecordService from '../service/bilibili/record'
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
    verb: 'post',
    uri: '/room/record/start',
    middlewares: [ startRecord ],
    validator: {
      type: 'object',
      required: [ 'roomId' ],
      properties: {
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
      required: [ 'roomId', 'recordId' ],
      properties: {
        roomId: { type: 'string' },
        recordId: { type: 'string' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/room/record/status',
    middlewares: [ getRecordStatus ],
    validator: {
      type: 'object',
      properties: {
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
    await bilibiliWSClient.connect({ userId: Number(userId) || 0, roomId: Number(roomId), clientId })

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
    // throw new Error(ERROR.SYSTEM_ERROR)
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
      return i.roomId  === roomId && i.clientId === clientId && i.instance
    })

    return {
      roomId, 
      isConnected,
    }
  })

  ctx.body = {
    message: 'ok',
    data,
  }
}

async function startRecord(ctx) {
  const { roomId, output, qn, platform, withCookie, clientId } = ctx.__body

  const { id } = await biliRecordService.record({
    clientId,
    roomId,
    output,
    qn,
    platform,
    cookie: withCookie ? getUserCookie({ clientId }) || null : null,
  })

  // const room = client.rooms.find((r: any) => r.id === roomId)
  // if (room) room.record = { id, isRecording: true, startedAt: Date.now() }

  ctx.body = { message: 'ok', data: { id } }
}

async function cancelRecord(ctx) {
  const { recordId, clientId, roomId } = ctx.__body
  const client = getClient(clientId)

  await biliRecordService.cancel({ id: recordId })
  // const room = client.rooms.find((r: any) => r.id === roomId)
  // if (room) room.record = { id: '', isRecording: false, startedAt: 0 }
  ctx.body = COMMON_RESPONSE
}

async function getRecordStatus(ctx) {
  const { clientId, roomId } = ctx.__body
  const client = getClient(clientId)
  // const room = client.rooms.find((r: any) => r.id === roomId)

  // ctx.body = { message: 'ok', data: room?.record }
}

export default routes