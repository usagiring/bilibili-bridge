import { lotteryDB, wrapper2Async } from "../service/nedb"

export interface LotteryDTO {

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

export const Model = {
  find,
  findOne,
  insert,
}