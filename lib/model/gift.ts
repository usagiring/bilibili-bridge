export interface Gift {
  _id: string
  roomId: number
  sendAt: number
  // user
  uid: number
  name: string
  avatar: string
  guardLevel: 0 | 1 | 2
  coinType: 'gold' | 'silver'

  // gift
  price: number
  giftId: number
  giftName: string
  giftNumber: number
  batchComboId?: string

  // sc
  superChatId: string
  type: 'superChat' | 'gift'
  comment: string
  commentJPN: string
}