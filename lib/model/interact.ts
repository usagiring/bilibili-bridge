export interface Interact {
  // basic
  _id?: string
  identities: number[]
  score?: number
  msgType: 1 | 2 | 3

  // common
  roomId: number
  sendAt: number
  
  // user
  uid: number
  uname: string
  unameColor?: string
  medalLevel?: number
  medalName?: string
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}