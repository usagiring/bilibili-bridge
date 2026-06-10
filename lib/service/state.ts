// import _ from 'lodash'

export interface Client {
  id: string
  SSEClient?: any
  bilibiliWSClient?: any
  style?: any

  rooms: {
    id: string
    userId: string
    liveStatus: number
    liveStream: string
    autoReplyRules: any[]

    record: {
      id: string
      isRecording: boolean
      startedAt: number
    }
  }[]

  user?: {
    id: string
    face: string
    cookie: string
    medal: {
      name: string
    }
  }

  ASR?: {
    instance: any
  }
  MT?: {
    instance: any
    fromLang?: string
    toLang?: string
  }
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
}

// NEED INITIALIZATION
export const state: Partial<State> = {
  port: 3000,
  clients: [],
} as const

export default state
