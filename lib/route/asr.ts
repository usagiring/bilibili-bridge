import { AliASR, ffmpeg } from '@tokine/asr'
import Alimt from '@tokine/mt'

import global from '../service/global'
import { CMDS, COMMON_RESPONSE, HTTP_ERRORS } from '../service/const'
import wss, { SocketPayload } from '../service/wss'

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
]

async function status(ctx) {
  const asr = global.get('asrInstance')
  const message = asr ? '1' : '0'
  ctx.body = {
    message
  }
}

async function initial(ctx) {
  const { appKey, accessKeyId, accessKeySecret, playUrl, ffmpegPath } = ctx.__body
  const oldAsr = global.get('asrInstance')
  if (oldAsr) {
    try {
      await oldAsr.close()
    } catch (e) {
      console.log(e)
    }

    global.set('asrInstance', null)
  }

  const asr = await AliASR.initial({
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    appKey: appKey,
  })

  asr.on('begin', (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_BEGIN,
      payload: msg
    }
    wss.broadcast(data)
  })

  asr.on('end', (msg) => {
    const socket: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_END,
      payload: msg
    }
    wss.broadcast(socket)

    if (global.get('mtInstanceStatus')) {
      if (!msg.payload?.result) return

      let mtInstance = global.get('mtInstance')
      if (!mtInstance) {
        mtInstance = new Alimt({
          accessKeyId,
          accessKeySecret,
        })
        global.set('mtInstance', mtInstance)
      }
      const fromLang = global.get('mtInstanceFromLang')
      const toLang = global.get('mtInstanceToLang')
      mtInstance.translateGeneral({
        text: msg.payload?.result,
        from: fromLang,
        to: toLang
      })
        .then(result => {
          const socket: SocketPayload = {
            cmd: CMDS.MECHINE_TRANSLATE,
            payload: {
              id: msg.header?.message_id,
              message: result?.body?.data?.translated
            }
          }
          wss.broadcast(socket)
        })
    }
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
  asr.on('change', (msg) => {
    const data: SocketPayload = {
      cmd: CMDS.ASR_SENTENCE_CHANGE,
      payload: msg
    }
    wss.broadcast(data)
  })

  global.set('asrInstance', asr)

  ctx.body = COMMON_RESPONSE
}

async function liveStreamStart(ctx) {
  const { playUrl, ffmpegPath } = ctx.__body
  const asr = global.get('asrInstance')
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
      // if (!result) {
      // asr.close()
      // }
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

  global.set('liveStream', stream)

  ctx.body = COMMON_RESPONSE
}

async function liveStreamClose(ctx) {
  const stream = global.get('liveStream')
  if (stream) {
    try {
      stream.end(null)
    } catch (e) {
      console.log(e)
    }
  }

  global.set('liveStream', null)
  ctx.body = COMMON_RESPONSE
}

async function translateSentence(ctx) {
  const { from, to, text, accessKeyId, accessKeySecret, payload } = ctx.__body

  let mtInstance = global.get('mtInstance')
  if (!mtInstance) {
    mtInstance = new Alimt({
      accessKeyId,
      accessKeySecret,
    })
    global.set('mtInstance', mtInstance)
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
  // const { accessKeyId, accessKeySecret } = ctx.__body
  const { fromLang, toLang } = ctx.__body

  // let mtInstance = global.get('mtInstance')
  // if (!mtInstance) {
  //   mtInstance = new Alimt({
  //     accessKeyId,
  //     accessKeySecret,
  //   })
  //   global.set('mtInstance', mtInstance)
  // }
  global.set('mtInstanceFromLang', fromLang)
  global.set('mtInstanceToLang', toLang)
  global.set('mtInstanceStatus', true)
  ctx.body = COMMON_RESPONSE
}

async function translateClose(ctx) {
  global.set('mtInstanceFromLang', null)
  global.set('mtInstanceToLang', null)
  global.set('mtInstanceStatus', false)
  global.set('mtInstance', null)
  ctx.body = COMMON_RESPONSE
}

async function translateStatus(ctx) {
  const isOpen = global.get('mtInstanceStatus')
  const fromLang = global.get('mtInstanceFromLang')
  const toLang = global.get('mtInstanceToLang')
  const message = isOpen ? '1' : '0'
  ctx.body = {
    message,
    data: {
      fromLang,
      toLang
    }
  }
}

export default routes