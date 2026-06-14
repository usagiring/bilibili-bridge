import { createRecognizer, createRecognizerOnce, setFfmpegPath, getAudioStream } from '@tokine/asr'
import type { AsrResult } from '@tokine/asr'
import { createTranslator } from '@tokine/mt'
import { chunk } from 'lodash'

import { getClient } from '../service/client'
import sse from '../service/sse'
import { CMD, COMMON_RESPONSE, HTTP_ERROR } from '../service/const'
import { wait } from '../service/util'

// ── 路由定义 ──

const routes = [
  { verb: 'get', uri: '/automatic-speech-recognition/status', middlewares: [ status ] },
  { verb: 'post', uri: '/automatic-speech-recognition/initial', middlewares: [ initial ] },
  { verb: 'post', uri: '/automatic-speech-recognition/live/start', middlewares: [ liveStreamStart ] },
  { verb: 'post', uri: '/automatic-speech-recognition/live/close', middlewares: [ liveStreamClose ] },
  { verb: 'post', uri: '/automatic-speech-recognition/close', middlewares: [ close ] },
  { verb: 'post', uri: '/automatic-speech-recognition/audio', middlewares: [ sendAudio ] },
  { verb: 'post', uri: '/translate/sentence', middlewares: [ translateSentence ] },
  { verb: 'post', uri: '/translate/open', middlewares: [ translateOpen ] },
  { verb: 'post', uri: '/translate/close', middlewares: [ translateClose ] },
  { verb: 'get', uri: '/translate/status', middlewares: [ translateStatus ] },
  { verb: 'post', uri: '/speech-recognition/initial', middlewares: [ srInitial ] },
  { verb: 'post', uri: '/speech-recognition/speech-to-text', middlewares: [ speechToText ] },
]

// ── ASR ──

async function status(ctx) {
  const { clientId } = ctx.__body
  // const client = getClient(clientId)
  // ctx.body = { message: client.ASR.instance ? '1' : '0' }
}

async function initial(ctx) {
  const { appKey, accessKeyId, accessKeySecret, clientId } = ctx.__body
  const client = getClient(clientId)

  await closeASR(client)

  const asr = createRecognizer('alicloud')
  await asr.initial({ appKey, accessKeyId, accessKeySecret })

  asr.on('begin', (result: AsrResult) =>
    sse.send(clientId, { cmd: CMD.ASR_SENTENCE_BEGIN, payload: result }))

  asr.on('end', async (result: AsrResult) => {
    sse.send(clientId, { cmd: CMD.ASR_SENTENCE_END, payload: result })
    if (result.text) {
      await doTranslate(client, clientId, {
        text: result.text,
        extraPayload: { id: (result as any).header?.message_id },
      })
    }
  })

  asr.on('changed', (result: AsrResult) => sse.send(clientId, { cmd: CMD.ASR_SENTENCE_CHANGE, payload: result }))

  await asr.start()
  // client.ASR.instance = asr
  // ctx.body = COMMON_RESPONSE
}

async function liveStreamStart(ctx) {
  const { playUrl, ffmpegPath, clientId } = ctx.__body
  const client = getClient(clientId)

  // if (!client.ASR.instance) throw HTTP_ERROR.PARAMS_ERROR

  // if (ffmpegPath) setFfmpegPath(ffmpegPath)

  // const stream = await getAudioStream({ url: playUrl })
  // const asr = client.ASR.instance

  // stream.on('data', (chunk: Buffer) => {
  //   try {
  //     asr.sendAudio(chunk)
  //   } catch (e) {
  //     console.error('send audio failed', e)
  //     stream.end(null)
  //     closeASR(client)
  //   }
  // })

  // stream.on('close', () => console.log('stream close'))
  // stream.on('end', () => console.log('stream end'))
  // stream.on('error', () => console.log('stream error'))

  // client.liveStream = stream
  ctx.body = COMMON_RESPONSE
}

async function liveStreamClose(ctx) {
  const { clientId } = ctx.__body
  const client = getClient(clientId)

  // try { client.liveStream?.end(null) } catch (e) { console.log(e) }
  // client.liveStream = null
  ctx.body = COMMON_RESPONSE
}

async function close(ctx) {
  const { clientId } = ctx.__body
  const client = getClient(clientId)
  await closeASR(client)
  ctx.body = COMMON_RESPONSE
}

async function sendAudio(ctx) {
  // const { clientId, data } = ctx.__body
  // const client = getClient(clientId)

  // if (!client.ASR.instance) {
  //   ctx.status = 400
  //   ctx.body = { message: 'ASR 未初始化' }
  //   return
  // }
  // if (!data) {
  //   ctx.status = 400
  //   ctx.body = { message: '缺少 data 字段' }
  //   return
  // }

  // try {
  //   client.ASR.instance.sendAudio(Buffer.from(new Int16Array(data).buffer))
  //   ctx.body = { message: 'ok' }
  // } catch {
  //   console.log('ASR sendAudio failed, closing...')
  //   closeASR(client)
  //   ctx.body = { message: 'ok', closed: true }
  // }
}

async function closeASR(client: any) {
  if (client.ASR.instance) {
    try { await client.ASR.instance.close() } catch (e) { console.log(e) }
    client.ASR.instance = null
  }
}

// ── 机器翻译 ──

async function translateSentence(ctx) {
  const { from, to, text, accessKeyId, accessKeySecret, payload, clientId } = ctx.__body
  const client = getClient(clientId)

  // if (!client.MT.instance) {
  //   client.MT.instance = createTranslator('alicloud', { accessKeyId, accessKeySecret })
  // }

  const result = await doTranslate(client, clientId, { text, from, to, extraPayload: payload })
  ctx.body = { message: result?.translated || '' }
}

async function translateOpen(ctx) {
  // const { accessKeyId, accessKeySecret, fromLang, toLang, clientId } = ctx.__body
  // const client = getClient(clientId)

  // if (!client.MT.instance) {
  //   client.MT.instance = createTranslator('alicloud', { accessKeyId, accessKeySecret })
  // }
  // client.MT.fromLang = fromLang
  // client.MT.toLang = toLang
  // ctx.body = COMMON_RESPONSE
}

async function translateClose(ctx) {
  const { clientId } = ctx.__body
  const client = getClient(clientId)

  // client.MT.fromLang = undefined
  // client.MT.toLang = undefined
  // client.MT.instance = null
  // ctx.body = COMMON_RESPONSE
}

async function translateStatus(ctx) {
  const { clientId } = ctx.__body
  const client = getClient(clientId)

  // ctx.body = {
  //   message: client.MT.instance ? '1' : '0',
  //   data: {
  //     fromLang: client.MT.fromLang,
  //     toLang: client.MT.toLang,
  //   },
  // }
}

// ── 语音识别 ──

async function srInitial(ctx) {
  const { accessKeyId, accessKeySecret, clientId } = ctx.__body
  const client = getClient(clientId)

  const sr = createRecognizerOnce('alicloud')
  const token = await sr.getToken({ accessKeyId, accessKeySecret })
  // client.aliToken = token
  ctx.body = COMMON_RESPONSE
}

async function speechToText(ctx) {
  const { appKey, payload, clientId } = ctx.__body
  const client = getClient(clientId)

  // if (!client.aliToken) throw HTTP_ERROR.PARAMS_ERROR

  // const srOnce = createRecognizerOnce('alicloud')
  // const sr = srOnce.initial({ token: client.aliToken, appKey })

  // sr.on('started', (msg: string) => sse.send(clientId, { cmd: CMD.SR_STARTED, payload: JSON.parse(msg) }))
  // sr.on('completed', (msg: string) => sse.send(clientId, { cmd: CMD.SR_COMPLETED, payload: JSON.parse(msg) }))

  // const params = sr.defaultStartParams()
  // params.enable_inverse_text_normalization = true
  // params.enable_intermediate_result = false
  // params.max_start_silence = 5000
  // params.max_end_silence = 3000

  // try {
  //   await sr.start(params, true, 6000)
  // } catch (error) {
  //   console.log('error on start:', error)
  //   throw error
  // }

  // for (const __chunk of chunk(JSON.parse(payload), 1024)) {
  //   sr.sendAudio(Buffer.from(new Int16Array(__chunk).buffer))
  //   await wait(20)
  // }

  // try {
  //   console.log('close...')
  //   await sr.close()
  // } catch (error) {
  //   console.log('error on close:', error)
  // }

  ctx.body = COMMON_RESPONSE
}

// ── 通用翻译 ──

async function doTranslate(
  client: any,
  clientId: string,
  { text, from, to, extraPayload }: { text: string; from?: string; to?: string; extraPayload?: any },
) {
  if (!client.MT.instance) return null

  let fromLang = from || client.MT.fromLang || 'auto'
  if (fromLang === 'auto') {
    const detected = await client.MT.instance.detectLanguage({ text })
    fromLang = detected.language
  }
  const toLang = to || client.MT.toLang
  if (!toLang || fromLang === toLang) return null

  const result = await client.MT.instance.translate({ text, from: fromLang, to: toLang })
  sse.send(clientId, { cmd: CMD.MECHINE_TRANSLATE, payload: { ...extraPayload, message: result.translated } })
  return result
}

export default routes