export interface Interact {
  _id: string
  roomId: number
  sendAt: number

  identities: number[]
  score?: number
  msgType: 1 | 2 | 3

  uid: number
  name: string
  nameColor?: string

  medalLevel?: number
  medalName?: string
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}