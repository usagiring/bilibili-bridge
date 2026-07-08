import { Config } from './const'

export interface Client {
  id: string
  ASRInstance?: any
  MTInstance?: any

  config?: Config
}

interface SSEClientEntry {
  clientId: string
  ctx: any
  lastAlive: number
}

interface State {
  port: number
  htmlPath: string
  secret: string
  userDataPath: string
  models: {
    asr: string
    vad: string
  }
  wbi: {
    mixinKey?: string
  }
  saveAllBiliMessage: boolean
  dmV2Decoder: (base64Str: string) => any
  interactDecoder?: (base64Str: string) => any

  clients?: Client[]

  sseClients?: SSEClientEntry[]

  bilibiliWSInstances?: {
    clientId: string
    roomId: string
    userId: string
    instance: any
  }[]

  giftCache?: {
    [roomId: string]: {
      [giftId: string]: {
        id: string
        webp: string
        name: string
        price: number
      }
    }
  }
}

// NEED INITIALIZATION
export const state: Partial<State> = {
  port: 3000,
  htmlPath: '',
  userDataPath: '',
  models: {
    asr: 'models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09',
    vad: 'models/silero_vad.int8.onnx',
  },
  clients: [],
  sseClients: [],
  bilibiliWSInstances: [],
  giftCache: {},
} as const

export default state
