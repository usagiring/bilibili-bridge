export interface Comment {
  // basic
  _id?: string
  comment: string
  
  // common
  sendAt: number
  roomId: number
  
  // user
  uid: number
  uname: string
  isAdmin: boolean
  // guard: 0 | 1 | 2 | 3
  role: 0 | 1 | 2 | 3 
  avatar?: string
  medalLevel?: number
  medalName?: string
  medalRoomId?: number
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}