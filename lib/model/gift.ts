import { giftDB, wrapper2Async } from "../service/nedb"

export interface GiftDTO {
  // basic
  _id?: string
  id: number
  name: number
  price: number
  count: number
  coinType: 1 | 2 // 1: 'gold' | 2: 'silver'
  type: 1 | 2 | 3 // 1: 'gift' | 2: 'guard' | 3: 'SC'

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

  // sc
  SCId?: string
  content?: string
  contentJPN?: string
}

type Gift = GiftDTO

const DB = wrapper2Async(giftDB)

export async function find(query, options): Promise<GiftDTO[]> {
  const gifts: Gift[] = await DB.find(query, options)
  return gifts
}

export async function insert(data): Promise<GiftDTO> {
  const gift: Gift = await DB.insert(data)
  return gift
}

export async function findOne(query): Promise<GiftDTO> {
  const gift: Gift = await DB.findOne(query)
  return gift
}

export async function update(query, data, options): Promise<GiftDTO> {
  const gift: Gift = await DB.update(query, data, options)
  return gift
}

export async function count(query): Promise<number> {
  const count = await DB.count(query)
  return count
}

export const Model = {
  find,
  findOne,
  update,
  insert,
  count
}