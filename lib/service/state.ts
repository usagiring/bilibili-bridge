import { Config } from './const'
import SherpaOnnx from './sherpa-onnx'

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

  speechToTextInstances: {
    clientId: string
    roomId: string
    instance: InstanceType<typeof SherpaOnnx>
  }[]
}

// NEED INITIALIZATION
export const state: Partial<State> = {
  port: 3000,
  htmlPath: '',
  userDataPath: '',
  clients: [],
  sseClients: [],
  bilibiliWSInstances: [],
  giftCache: {},
  speechToTextInstances: [],
} as const

export default state
