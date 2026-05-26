// import _ from 'lodash'

interface Client {
  id: string
  SSEClient: any
  render: any
  autoReplyRules: any[]
  room: {
    id: string
    userId: string
    liveStatus: number
    liveStream: string
  }
  user: {
    id: string
    face: string
    cookie: string
    medal: {
      name: string
    }
  }
  ASR: {
    instance: any
  }
  MT: {
    instance: any
    fromLang?: string
    toLang?: string
  }
  /** ASR 实时流 */
  liveStream?: any
  /** 语音识别 Token */
  aliToken?: string
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
