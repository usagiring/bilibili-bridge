import { userDB, wrapper2Async } from "../service/nedb"

export interface UserDTO {
  _id?: string
  id: number
  name: string
  avatar: string
  sex: string
  level: number
}

type User = UserDTO

const DB = wrapper2Async(userDB)

// export async function find(query, options): Promise<UserDTO[]> {
//   const users: User[] = await DB.find(query, options)
//   return users
// }

export async function insert(data): Promise<UserDTO> {
  const user: User = await DB.insert(data)
  return user
}

export async function findOne(query): Promise<UserDTO> {
  const user: User = await DB.findOne(query)
  return user
}

export async function update(query, data, options): Promise<UserDTO> {
  const user: User = await DB.update(query, data, options)
  return user
}

export const Model = {
  // find,
  findOne,
  update,
  insert,
}