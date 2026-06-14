import { Config } from './const'

export interface Client {
  id: string
  SSEClient?: any
  ASRInstance?: any
  MTInstance?: any

  config?: Config
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
  bilibiliWSInstances: [],
} as const

export default state
