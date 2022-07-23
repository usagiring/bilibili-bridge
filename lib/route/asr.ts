import ASR from '@tokine/asr'
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


export default routes