import Koa from 'koa'
import global from '../service/global'
import { COMMON_RESPONSE, ERRORS } from '../service/const'
import BilibiliWSClient from '../service/bilibili-ws-client'
import { getRoomInfoV2 } from '../service/bilibili-sdk'

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
    middlewares: [connect]
  },
  {
    verb: 'post',
    uri: '/rooms/:roomId/disconnect',
    middlewares: [disconnect]
  }
]

async function getRoomInfo(ctx: Koa.Context) {
  const { roomId } = ctx.params
  const info = await getRoomInfoV2(roomId)
  ctx.body = info
}

async function connect(ctx: Koa.Context) {
  const { roomId } = ctx.params
  await bilibiliWSClient.connect({ roomId: Number(roomId) })
  global.set('roomId', roomId)
  ctx.body = COMMON_RESPONSE
}

async function disconnect(ctx) {
  const { roomId } = ctx.params
  if (!bilibiliWSClient) {
    throw new Error(ERRORS.SYSTEM_ERROR)
  }
  await bilibiliWSClient.close()
  ctx.body = COMMON_RESPONSE
}

export default routes