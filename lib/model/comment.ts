export interface Comment {
  _id: string
  roomId: number
  sendAt: number
  uid: number
  name: string
  isAdmin: boolean
  guard: 0 | 1 | 2 | 3
  role: 0 | 1 | 2 | 3  // duplicate 
  comment: string
  avatar: string

  medalLevel?: number
  medalName?: string
  medalRoomId?: number
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}