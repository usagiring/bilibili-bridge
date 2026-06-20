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
  wbi: {
    mixinKey?: string
  }
  userInfoFrequencyLimit: number
  saveAllBiliMessage: boolean
  dmV2Decoder: any

  clients?: Client[]

  sseClients?: SSEClientEntry[]

  bilibiliWSInstances?: {
    clientId: string
    roomId: string
    userId: string
    instance: any
  }[]
}

// NEED INITIALIZATION
export const state: Partial<State> = {
  port: 3000,
  clients: [],
  sseClients: [],
  bilibiliWSInstances: [],
} as const

export default state
