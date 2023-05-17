import { SpeechTranscription as AliSpeechTranscription } from "alibabacloud-nls"
import SpeechTranscription from "alibabacloud-nls/lib/st"
import AliClient from './client'

type Event = 'changed' | 'begin' | 'end' | 'started' | 'completed' | 'closed' | 'failed'

const HOST = 'nls-gateway.aliyuncs.com'
let asr: SpeechTranscription


export function get() {
  return asr
}

export async function initial({
  appKey,
  accessKeyId,
  accessKeySecret,
}) {
  const aliClient = new AliClient({ accessKeyId, accessKeySecret })
  const token = await aliClient.getToken()
  asr = new AliSpeechTranscription({
    url: `wss://${HOST}/ws/v1`,
    token: token,
    appkey: appKey,
  })

  // started 实时语音识别开始。
  // changed 实时语音识别中间结果。
  // completed 实时语音识别完成。
  // closed
  // failed
  // begin 提示句子开始。
  // end 提示句子结束。
  asr.on("started", (msg) => {
    console.log("Client recv started:", msg)
  })

  asr.on("completed", (msg) => {
    console.log("Client recv completed:", msg)
  })

  asr.on("closed", () => {
    console.log("Client recv closed")
  })

  asr.on("failed", (msg) => {
    console.log("Client recv failed:", msg)
  })
  return asr
}

export async function start() {
  // {
  //     "format": "pcm",
  //     "sample_rate": 16000,
  //     "enable_intermediate_result": true,
  //     "enable_punctuation_predition": true,
  //     "enable_inverse_text_normalization": true
  // }
  const defaultParams = asr.defaultStartParams()
  const params = {
    ...defaultParams
  }

  await asr.start(
    params,
    true, // 是否自动向云端发送ping请求，默认false。
    6000, // 发ping请求间隔时间，默认6000，单位为毫秒。
  )
}

export async function close() {
  await asr.close()
}

export function on(event: Event, func) {
  asr.on(event, (msg) => {
    func(JSON.parse(msg))
  })
}

export function sendAudio(data) {
  asr.sendAudio(data)
}