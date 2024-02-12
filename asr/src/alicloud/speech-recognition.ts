import { SpeechRecognition } from "alibabacloud-nls"
import AliClient from './client'

const HOST = 'nls-gateway.aliyuncs.com'
// const HOST = 'nls-gateway-cn-shanghai.aliyuncs.com'
let sr: SpeechRecognition
type Event = 'started' | 'changed' | 'completed' | 'closed' | 'failed'

export async function getToken({ accessKeyId, accessKeySecret }) {
  const aliClient = new AliClient({ accessKeyId, accessKeySecret })
  const token = await aliClient.getToken()
  return token
}

export function initial({
  appKey,
  token
}) {

  sr = new SpeechRecognition({
    url: `wss://${HOST}/ws/v1`,
    appkey: appKey,
    token: token
  })

  return sr
}

// export async function start() {
//   const params = sr.defaultStartParams()
//   params.enable_inverse_text_normalization = true
//   params.max_start_silence = 5000
//   params.max_end_silence = 3000

//   try {
//     await sr.start(params, true, 6000)
//   } catch (error) {
//     console.log("error on start:", error)
//     throw error
//   }
// }

// export function on(event: Event, func) {
//   sr.on(event, (msg) => {
//     func(JSON.parse(msg))
//   })
// }

// export function sendAudio(data) {
//   sr.sendAudio(data)
// }

// export async function close() {
//   try {
//     console.log("close...")
//     await sr.close()

//   } catch (error) {
//     console.log("error on close:", error)
//   }
// }