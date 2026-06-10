import { COMMON_RESPONSE, ERROR } from '../service/const'
import BilibiliWSClient from '../service/bilibili/ws'
import { getRoomInfoV2 } from '../service/bilibili/sdk'
import { sql } from 'drizzle-orm'
import { messages } from '../model/message.sqlite'
import { db } from '../service/db'
import { getClient } from '../service/client'
import * as biliRecordService from '../service/bilibili/record'

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
  const { roomId, uid, clientId } = ctx.__body
  const client = getClient(clientId)

  const bilibiliWSClient = new BilibiliWSClient()
  await bilibiliWSClient.connect({ userId: Number(uid) || 0, roomId: Number(roomId) })

  let room = client.rooms.find((r: any) => r.id === roomId)
  if (!room) {
    room = { id: roomId, userId: '', liveStatus: 0, liveStream: '', autoReplyRules: [], record: { id: '', isRecording: false, startedAt: 0 } }
    client.rooms.push(room)
  }
  room.liveStatus = 1
  client.bilibiliWSClient = bilibiliWSClient

  ctx.body = COMMON_RESPONSE
}

async function disconnect(ctx) {
  const { clientId, roomId } = ctx.__body
  const client = getClient(clientId)
  if (!client.bilibiliWSClient) throw new Error(ERROR.SYSTEM_ERROR)

  await client.bilibiliWSClient.close()
  const room = client.rooms.find((r: any) => r.id === roomId)
  if (room) room.liveStatus = 0
  client.bilibiliWSClient = null
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
  const { clientId } = ctx.__body
  const { roomId } = ctx.params
  const client = getClient(clientId)
  const room = client.rooms.find((r: any) => r.id === roomId)

  ctx.body = {
    message: 'ok',
    data: {
      roomId: room?.id || '',
      isConnected: !!room?.liveStatus,
    },
  }
}

async function startRecord(ctx) {
  const { roomId, output, qn, platform, withCookie, clientId } = ctx.__body
  const client = getClient(clientId)

  const { id } = await biliRecordService.record({
    clientId,
    roomId,
    output,
    qn,
    platform,
    cookie: withCookie ? client.user?.cookie || null : null,
  })

  const room = client.rooms.find((r: any) => r.id === roomId)
  if (room) room.record = { id, isRecording: true, startedAt: Date.now() }

  ctx.body = { message: 'ok', data: { id } }
}

async function cancelRecord(ctx) {
  const { recordId, clientId, roomId } = ctx.__body
  const client = getClient(clientId)

  await biliRecordService.cancel({ id: recordId })
  const room = client.rooms.find((r: any) => r.id === roomId)
  if (room) room.record = { id: '', isRecording: false, startedAt: 0 }
  ctx.body = COMMON_RESPONSE
}

async function getRecordStatus(ctx) {
  const { clientId, roomId } = ctx.__body
  const client = getClient(clientId)
  const room = client.rooms.find((r: any) => r.id === roomId)

  ctx.body = { message: 'ok', data: room?.record }
}

export default routes