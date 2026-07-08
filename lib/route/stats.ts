import * as statsService from '../service/stats'
import { Readable } from 'stream'

const routes = [
  {
    verb: 'get',
    uri: '/stats',
    middlewares: [ getStats ],
    validator: {
      type: 'object',
      required: [ 'roomId', 'startTime', 'endTime' ],
      properties: {
        roomId: { type: 'string' },
        startTime: { type: 'number' },
        endTime: { type: 'number' },
      },
    },
  },

  {
    verb: 'get',
    uri: '/stats/comment/keyword-extract',
    middlewares: [ keywordExtract ],
    validator: {
      type: 'object',
      required: [ 'roomId', 'startTime', 'endTime' ],
      properties: {
        roomId: { type: 'string' },
        startTime: { type: 'number' },
        endTime: { type: 'number' },
      },
    },
  },

  {
    verb: 'get',
    uri: '/stats/gift/export',
    middlewares: [ exportFile ],
    validator: {
      type: 'object',
      required: [ 'roomId', 'startTime', 'endTime' ],
      properties: {
        roomId: { type: 'string' },
        startTime: { type: 'number' },
        endTime: { type: 'number' },
      },
    },
  },
]

async function getStats(ctx) {
  const { startTime, endTime, roomId } = ctx.__body
  const result = await statsService.getStats({
    roomId,
    startTime,
    endTime,
  })
  ctx.body = {
    message: 'ok',
    data: result,
  }
}

async function keywordExtract(ctx) {
  const { roomId, startTime, endTime } = ctx.__body
  const result = await statsService.wordExtract({ roomId, startTime, endTime })
  ctx.body = {
    message: 'ok',
    data: result,
  }
}

async function exportFile(ctx) {
  const { roomId, startTime, endTime } = ctx.__body

  const filename = `${roomId}_${Date.now()}.csv`

  const str = await statsService.generateCSV({ roomId, startTime, endTime })
  ctx.set('Content-Disposition', `attachment;filename=${encodeURIComponent(filename)}`)
  // ctx.statusCode = 200
  const s = new Readable()

  // ctx.body = str
  s.push(str)
  s.push(null)
  ctx.body = s
}

export default routes