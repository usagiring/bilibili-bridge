import { getClient } from '../service/client'
import { COMMON_RESPONSE, HTTP_ERROR } from '../service/const'
import SherpaOnnx from '../service/sherpa-onnx'
import state from '../service/state'

const routes = [
  {
    verb: 'post',
    uri: '/speech-to-text/initial',
    middlewares: [ initial ],
    validator: {
      type: 'object',
      properties: {
        roomId: { type: 'string' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/speech-to-text/decode',
    middlewares: [ decode ],
  },
  {
    verb: 'get',
    uri: '/speech-to-text/status',
    middlewares: [ getStatus ],
  },
]

async function initial(ctx) {
  const { clientId, roomId } = ctx.__body

  const find = state.speechToTextInstances.find(i => i.clientId === clientId && i.roomId === roomId)
  if (find) {
    ctx.body = COMMON_RESPONSE
    return 
  }

  const client = getClient(clientId)
  const config = client.config?.AIConfig?.speechToText
  if (!config) {
    throw new Error('模型配置错误')
  }

  const so = new SherpaOnnx({
    clientId,
    roomId,
    ...config,
  })

  const i = {
    clientId,
    roomId,
    instance: so,
  }
  state.speechToTextInstances.push(i)
  
  ctx.body = COMMON_RESPONSE
}

async function getStatus (ctx) {
  const { clientId, roomId } = ctx.__body
  const stt = state.speechToTextInstances.find(i => i.clientId === clientId && i.roomId === roomId)
  const instance = stt?.instance as InstanceType<typeof SherpaOnnx> | undefined

  ctx.body = {
    message: 'ok',
    data: {
      clientId,
      roomId,
      isReady: !!instance,
    },
  }
}

async function decode(ctx) {
  const clientId = ctx.query.clientId as string
  const roomId = ctx.query.roomId as string
  if (!clientId || !roomId) throw HTTP_ERROR.PARAMS_ERROR
  const stt = state.speechToTextInstances.find(i => i.clientId === clientId && i.roomId === roomId)
  if (!stt) throw HTTP_ERROR.PARAMS_ERROR

  const instance = stt.instance

  // bodyParser 不处理 application/octet-stream，手动读 req 流
  const chunks: Buffer[] = []
  for await (const chunk of ctx.req) {
    chunks.push(Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks)
  const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
  instance.decode(samples)
  ctx.body = COMMON_RESPONSE
}

export default routes