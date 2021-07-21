export interface Gift {
  // basic
  _id?: string
  id: number
  name: number
  price: number
  count: number
  coinType: 'gold' | 'silver'
  type: 'superChat' | 'gift' | 'guard'

  // common
  roomId: number
  sendAt: number

  // extra
  batchComboId?: string

  // user
  uid: number
  // name: string
  uname: string
  avatar?: string
  // guardLevel: 0 | 1 | 2
  role: 0 | 1 | 2 | 3

  // gift
  // price: number
  // giftId: number
  // giftName: string
  // giftNumber: number
  // batchComboId?: string

  // sc
  superChatId?: string
  comment?: string
  commentJPN?: string
}