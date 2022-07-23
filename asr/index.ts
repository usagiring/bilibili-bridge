import { SpeechTranscription as AliSpeechTranscription } from "alibabacloud-nls"
import AliClient from './src/alicloud/client'
import { getAudioStream, setFfmpegPath } from './src/ffmpeg'

interface SpeechTranscriptionOption {
    // service?: 'alicloud'
    serviceUrl: string
    appKey: string
    accessKeyId: string
    accessKeySecret: string
    ffmpegPath?: string
}

type Event = 'change' | 'begin' | 'end'

// Automatic Speech Recognition
export default class ASR {
    asr: any
    stream: any
    handlers: { [x: string]: Function[] }

    constructor() {
        this.handlers = {}
    }

    async init({
        serviceUrl,
        appKey,
        accessKeyId,
        accessKeySecret,
        ffmpegPath,
    }: SpeechTranscriptionOption) {
        if (ffmpegPath) {
            setFfmpegPath(ffmpegPath)
        }
        const aliClient = new AliClient({ accessKeyId, accessKeySecret })
        this.asr = new AliSpeechTranscription({
            url: serviceUrl, // wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1
            token: await aliClient.getToken(),
            appkey: appKey,
        })

        // {
        //     "format": "pcm",
        //     "sample_rate": 16000,
        //     "enable_intermediate_result": true,
        //     "enable_punctuation_predition": true,
        //     "enable_inverse_text_normalization": true
        // }
        const defaultParams = this.asr.defaultStartParams()
        const params = {
            ...defaultParams
        }
        // started 实时语音识别开始。
        // changed 实时语音识别中间结果。
        // completed 实时语音识别完成。
        // closed
        // failed
        // begin 提示句子开始。
        // end 提示句子结束。
        this.asr.on("started", (msg) => {
            console.log("Client recv started:", msg)
        })

        this.asr.on("changed", (msg) => {
            // console.log("Client recv changed:", msg)
            if (this.handlers?.change?.length) {
                try {
                    this.handlers.change.forEach(func => {
                        func(JSON.parse(msg))
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        })

        this.asr.on("completed", (msg) => {
            console.log("Client recv completed:", msg)
        })

        this.asr.on("closed", () => {
            console.log("Client recv closed")
        })

        this.asr.on("failed", (msg) => {
            console.log("Client recv failed:", msg)
        })

        this.asr.on("begin", (msg) => {
            // console.log("Client recv begin:", msg)
            if (this.handlers?.begin?.length) {
                try {
                    this.handlers.begin.forEach(func => {
                        func(JSON.parse(msg))
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        })

        this.asr.on("end", (msg) => {
            // console.log("Client recv end:", msg)
            if (this.handlers?.end?.length) {
                try {
                    this.handlers.end.forEach(func => {
                        func(JSON.parse(msg))
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        })

        await this.asr.start(
            params,
            true, // 是否自动向云端发送ping请求，默认false。
            6000, // 发ping请求间隔时间，默认6000，单位为毫秒。
        )
    }

    async start({ url }) {
        const self = this
        const stream = getAudioStream({ url })
        stream.on('data', (chunk) => {
            const data = Buffer.from(chunk, "binary")
            if (!self.asr.sendAudio(data)) {
                throw new Error("send audio failed")
            }
        })
        stream.on('close', () => {
            self.asr.close()
        })
        // stream.on('end', () => {
        //     self.asr.close()
        // })
        stream.on('error', () => {
            self.asr.close()
        })
        this.stream = stream
    }

    close() {
        this.stream.end(null)
        // this.stream.destroy()
        // await this.asr.close({})
    }

    on(event: Event, handler) {
        this.handlers[event] = this.handlers[event] || []
        this.handlers[event].push(handler)
    }

    removeAllListeners() {
        this.handlers = {}
    }
}
