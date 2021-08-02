import { lotteryDB, wrapper2Async } from "../service/nedb"

export interface LotteryDTO {
  _id?: string
  uid: number
  uname: string
  avatar: string
  awardedAt: number
  description?: string
}

type Lottery = LotteryDTO

const DB = wrapper2Async(lotteryDB)

export async function find(query, options): Promise<LotteryDTO[]> {
  const lotterys: Lottery[] = await DB.find(query, options)
  return lotterys
}

export async function insert(data): Promise<LotteryDTO> {
  const lottery: Lottery = await DB.insert(data)
  return lottery
}

export async function findOne(query): Promise<LotteryDTO> {
  const lottery: Lottery = await DB.findOne(query)
  return lottery
}

export async function deleteMany(query): Promise<any> {
  await DB.deleteMany(query)
}

export async function count(query): Promise<number> {
  const count = await DB.count(query)
  return count
}

export const Model = {
  find,
  findOne,
  insert,
  deleteMany,
  count
}