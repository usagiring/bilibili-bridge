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
  }
}

interface State {
  port: number
  htmlPath: string
  secret: string
  userDataPath: string
  wbi: any
  userInfoFrequencyLimit: number
  saveAllBiliMessage: boolean
  dmV2Decoder: any

  clients?: Client[]
}

// NEED INITIALIZATION
export const state: Partial<State> = {} as const

export default state
