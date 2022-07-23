import ASR from '@tokine/asr'
import Alimt from '@tokine/mt'

import global from '../service/global'
import { CMDS, COMMON_RESPONSE } from '../service/const'
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
        uri: '/asr/close',
        middlewares: [close],
    },
    {
        verb: 'post',
        uri: '/translate',
        middlewares: [translate],
    }
]

async function status(ctx) {
    const asr = global.get('asrInstance')
    const message = asr ? '1' : '0'
    ctx.body = {
        message
    }
}

async function initial(ctx) {
    const { serviceUrl, appKey, accessKeyId, accessKeySecret, playUrl, ffmpegPath } = ctx.__body

    const instance = global.get('asrInstance')
    if (instance) {
        ctx.body = {
            message: 'exist asr instance'
        }
        return
    }

    const asr = new ASR()
    await asr.init({
        accessKeyId: accessKeyId,
        accessKeySecret: accessKeySecret,
        serviceUrl: serviceUrl,
        appKey: appKey,
        ffmpegPath,
    })

    asr.start({
        url: playUrl
    })

    asr.on('begin', (msg) => {
        const data: SocketPayload = {
            cmd: CMDS.ASR_SENTENCE_BEGIN,
            payload: msg
        }
        wss.broadcast(data)
    })

    asr.on('end', (msg) => {
        const data: SocketPayload = {
            cmd: CMDS.ASR_SENTENCE_END,
            payload: msg
        }
        wss.broadcast(data)
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

async function close(ctx) {
    const asr = global.get('asrInstance')

    if (asr) {
        try {
            await asr.close()
        } catch (e) {
            console.log(e)
        }
    }

    global.set('asrInstance', null)
    ctx.body = COMMON_RESPONSE
}

async function translate(ctx) {
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


export default routes