import { otherDB, wrapper2Async } from "../service/nedb"

const DB = wrapper2Async(otherDB)

export async function insert(data){
  const lottery = await DB.insert(data)
  return lottery
}

export const Model = {
  insert,
}