// import _ from 'lodash'

interface Client {
  id: string
  SSEClient: any
  bilibiliWSClient: any
  render: any
  room: {
    id: string
    userId: string
    liveStatus: number
    liveStream: string
    autoReplyRules: any[]
  }
  user: {
    id: string
    face: string
    cookie: string
    medal: {
      name: string
    }
  }
  record: {
    id: string
    isRecording: boolean
    startedAt: number
  }
  ASR: {
    instance: any
  }
  MT: {
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
} as const

export default state
