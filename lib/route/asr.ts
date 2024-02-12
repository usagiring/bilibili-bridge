import { AliASR, ffmpeg, AliSpeechRecognition } from '@tokine/asr'
import Alimt from '@tokine/mt'
import { chunk } from 'lodash'

import global from '../service/global'
import { CMDS, COMMON_RESPONSE, HTTP_ERRORS } from '../service/const'
import wss, { SocketPayload } from '../service/wss'
import { wait } from '../service/util'

const routes = [
  {
    verb: 'get',
    uri: '/asr/status',
    middlewares: [status],
  },
  {
    verb: 'post',
    uri: '/asr/initial',
    middlewares: [initial],
  },
  {
    verb: 'post',
    uri: '/asr/live/start',
    middlewares: [liveStreamStart],
  },
  {
    verb: 'post',
    uri: '/asr/live/close',
    middlewares: [liveStreamClose],
  },
  {
    verb: 'post',
    uri: '/asr/close',
    middlewares: [close],
  },
  {
    verb: 'post',
    uri: '/translate/sentence',
    middlewares: [translateSentence],
  },
  {
    verb: 'post',
    uri: '/translate/open',
    middlewares: [translateOpen],
  },
  {
    verb: 'post',
    uri: '/translate/close',
    middlewares: [translateClose],
  },
  {
    verb: 'get',
    uri: '/translate/status',
    middlewares: [translateStatus],
  },
  {
    verb: 'post',
    uri: '/speech-recognition/initial',
    middlewares: [srInitial],
  },
  {
    verb: 'post',
    uri: '/speech-recognition/speech-to-text',
    middlewares: [speechToText],
  }
]

async function status(ctx) {
  const asr = global.getInner('asrInstance')
  const message = asr ? '1' : '0'
  ctx.body = {
    message
  }
}

async function initial(ctx) {
  const { appKey, accessKeyId, accessKeySecret } = ctx.__body
  const oldAsr = global.getInner('asrInstance')
  if (oldAsr) {
    try {
      await oldAsr.close()
    } catch (e) {
      console.log(e)
    }

    global.setInner('asrInstance', null)
  }

  const asr = await AliASR.initial({
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    appKey: appKey,
  })

  AliASR.on('begin', (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_BEGIN,
      payload: msg
    }
    wss.broadcast(data)
  })

  AliASR.on('end', async (msg) => {
    const socket: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_END,
      payload: msg
    }
    wss.broadcast(socket)

    if (!msg?.payload?.result) return

    const mtInstance = global.getInner('mtInstance')
    if (!mtInstance) { return }

    const fromLang = global.get('mtFromLang')
    const toLang = global.get('mtToLang')

    let __fromLang = fromLang
    if (fromLang === 'auto') {
      const result = await mtInstance.getDetectLanguage({ text: msg.payload?.result })
      __fromLang = result.body.detectedLanguage
    }

    if (__fromLang === toLang) return

    mtInstance.translateGeneral({
      text: msg.payload?.result,
      from: __fromLang,
      to: toLang
    }).then(result => {
      const socket: SocketPayload = {
        cmd: CMDS.MECHINE_TRANSLATE,
        payload: {
          id: msg.header?.message_id,
          message: result?.body?.data?.translated
        }
      }
      wss.broadcast(socket)
    })
  })


  // {
  //     "header": {
  //         "namespace": "SpeechTranscriber",
  //         "name": "TranscriptionResultChanged",
  //         "status": 20000000,
  //         "message_id": "053e0932f3b541898073268e2bdf5c1b",
  //         "task_id": "0af33d971fc24020966e2acef8d2f5d7",
  //         "status_text": "Gateway:SUCCESS:Success."
  //     },
  //     "payload": {
  //         "index": 15,
  //         "time": 77940,
  //         "result": "有你等他收拾一下等他",
  //         "confidence": 0.87,
  //         "words": [],
  //         "status": 0
  //     }
  // }
  AliASR.on('changed', (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_CHANGE,
      payload: msg
    }
    wss.broadcast(data)
  })

  await AliASR.start()

  global.setInner('asrInstance', asr)

  ctx.body = COMMON_RESPONSE
}

async function liveStreamStart(ctx) {
  const { playUrl, ffmpegPath } = ctx.__body
  const asr = global.getInner('asrInstance')
  if (!asr) {
    throw HTTP_ERRORS.PARAMS_ERROR
    // message: 'no found asr instance'
  }

  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath)
  }

  const stream = await ffmpeg.getAudioStream({ url: playUrl })
  stream.on('data', (chunk) => {
    try {
      const data = Buffer.from(chunk, "binary")

      const result = asr.sendAudio(data)
      if (!result) {
        stream.end(null)
        asr.close()
        global.setInner('asrInstance', null)
      }
    } catch (e) {
      console.error("send audio failed")
      console.error(e)
    }
  })
  stream.on('close', () => {
    console.log('stream close')
    // asr.close()
  })
  stream.on('end', () => {
    console.log('stream end')
    // asr.close()
  })
  stream.on('error', () => {
    console.log('stream error')
    // asr.close()
  })

  global.setInner('liveStream', stream)

  ctx.body = COMMON_RESPONSE
}

async function liveStreamClose(ctx) {
  const stream = global.getInner('liveStream')
  if (stream) {
    try {
      stream.end(null)
    } catch (e) {
      console.log(e)
    }
  }

  global.setInner('liveStream', null)
  ctx.body = COMMON_RESPONSE
}

async function close(ctx) {
  const oldAsr = global.getInner('asrInstance')

  if (oldAsr) {
    global.setInner('asrInstance', null)

    try {
      await oldAsr.close()
    } catch (e) {
      console.log(e)
    }
  }

  ctx.body = COMMON_RESPONSE
}

async function translateSentence(ctx) {
  const { from, to, text, accessKeyId, accessKeySecret, payload } = ctx.__body

  let mtInstance = global.getInner('mtInstance')
  if (!mtInstance) {
    mtInstance = new Alimt({
      accessKeyId,
      accessKeySecret,
    })
    global.setInner('mtInstance', mtInstance)
  }

  const result = await mtInstance.translateGeneral({
    text,
    from,
    to
  })

  const data: SocketPayload = {
    cmd: CMDS.MECHINE_TRANSLATE,
    payload: {
      ...payload,
      message: result?.body?.data?.translated
    }
  }
  wss.broadcast(data)

  ctx.body = {
    message: result?.body?.data?.translated
  }
}

async function translateOpen(ctx) {
  const { accessKeyId, accessKeySecret } = ctx.__body
  const { fromLang, toLang } = ctx.__body

  let mtInstance = global.getInner('mtInstance')
  if (!mtInstance) {
    mtInstance = new Alimt({
      accessKeyId,
      accessKeySecret,
    })
    global.setInner('mtInstance', mtInstance)
  }
  global.set('mtFromLang', fromLang)
  global.set('mtToLang', toLang)
  ctx.body = COMMON_RESPONSE
}

async function translateClose(ctx) {
  global.set('mtFromLang', null)
  global.set('mtToLang', null)
  global.setInner('mtInstance', null)
  ctx.body = COMMON_RESPONSE
}

async function translateStatus(ctx) {
  const isOpen = global.getInner('mtInstance')
  const fromLang = global.get('mtFromLang')
  const toLang = global.get('mtToLang')
  const message = isOpen ? '1' : '0'
  ctx.body = {
    message,
    data: {
      fromLang,
      toLang
    }
  }
}

async function srInitial(ctx) {
  const { appKey, accessKeyId, accessKeySecret } = ctx.__body
  // const oldSr = global.getInner('speechRecognitionInstance')
  // if (oldSr) {
  //   try {
  //     await oldSr.close()
  //   } catch (e) {
  //     console.log(e)
  //   }

  //   global.setInner('speechRecognitionInstance', null)
  // }

  // const sr = await AliSpeechRecognition.initial({
  //   accessKeyId: accessKeyId,
  //   accessKeySecret: accessKeySecret,
  //   appKey: appKey,
  // })

  // sr.on('started', async (msg) => {
  //   const data: SocketPayload = {
  //     cmd: CMDS.SR_STARTED,
  //     payload: msg
  //   }
  //   wss.broadcast(data)
  // })

  // sr.on('completed', async (msg) => {
  //   console.log('completed', msg)
  //   const data: SocketPayload = {
  //     cmd: CMDS.SR_COMPLETED,
  //     payload: msg
  //   }
  //   wss.broadcast(data)
  // })

  // // await AliSpeechRecognition.start()

  // global.setInner('speechRecognitionInstance', sr)

  // 由于每次start/close sr实例都会发送多次重复事件，怀疑有oom风险
  // 这里仅获取Token，之后每次调用都初始化新实例
  const token = await AliSpeechRecognition.getToken({ accessKeyId, accessKeySecret })
  global.setInner('aliToken', token)

  ctx.body = COMMON_RESPONSE
}

async function speechToText(ctx) {
  const { appKey, payload } = ctx.__body
  const token = global.getInner('aliToken')
  if (!token) {
    throw HTTP_ERRORS.PARAMS_ERROR
  }

  const sr = AliSpeechRecognition.initial({
    token,
    appKey,
  })

  sr.on('started', async (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.SR_STARTED,
      payload: JSON.parse(msg)
    }
    wss.broadcast(data)
  })

  sr.on('completed', async (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.SR_COMPLETED,
      payload: JSON.parse(msg)
    }
    wss.broadcast(data)
  })

  const params = sr.defaultStartParams()
  params.enable_inverse_text_normalization = true
  params.enable_intermediate_result = false
  params.max_start_silence = 5000
  params.max_end_silence = 3000

  try {
    await sr.start(params, true, 6000)
  } catch (error) {
    console.log("error on start:", error)
    throw error
  }

  for (const __chunk of chunk(JSON.parse(payload), 1024)) {
    const buffer = new Int16Array(__chunk)
    sr.sendAudio(buffer)
    await wait(20)
  }

  try {
    console.log("close...")
    await sr.close()

  } catch (error) {
    console.log("error on close:", error)
  }

  ctx.body = COMMON_RESPONSE
}

export default routes