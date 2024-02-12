import { interactDB, wrapper2Async } from "../service/nedb"

export interface InteractDTO {
  // basic
  _id?: string
  identities: number[]
  // score?: number
  type: 1 | 2 | 3

  // common
  roomId: number
  sendAt: number

  // user
  uid: number
  face?: string
  uname: string
  unameColor?: string
  medalLevel?: number
  medalName?: string
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}

export interface Interact {
  // basic
  _id?: string
  identities: number[]
  // score?: number
  type: 1 | 2 | 3

  // common
  roomId: number
  sendAt: number

  // user
  uid: number
  uname: string
  unameColor?: string

  // short for medal info
  ML?: number
  MN?: string
  MCB?: string
  MCS?: string
  MCE?: string
}


const FIELD_MAP = {
  medalLevel: 'ML',
  medalName: 'MN',
  medalColorBorder: 'MCB',
  medalColorStart: 'MCS',
  medalColorEnd: 'MCE',
}

const REVERSE_FIELD_MAP = {
  ML: 'medalLevel',
  MN: 'medalName',
  MCB: 'medalColorBorder',
  MCS: 'medalColorStart',
  MCE: 'medalColorEnd',
}

const DB = wrapper2Async(interactDB)

export async function find(query, options): Promise<InteractDTO[]> {
  const interacts: Interact[] = await DB.find(transfer(query), options)
  return deTransfer(interacts) as InteractDTO[]
}

export async function insert(data): Promise<InteractDTO> {
  const interact: Interact = await DB.insert(transfer(data))
  return deTransfer(interact) as InteractDTO
}

export async function count(query): Promise<number> {
  const count = await DB.count(query)
  return count
}

export const Model = {
  find,
  insert,
  count
}

function transfer(data) {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const transfered = {}
    for (const key in item) {
      if (FIELD_MAP[key]) {
        transfered[FIELD_MAP[key]] = item[key]
      } else {
        transfered[key] = item[key]
      }
    }
    return transfered
  })
  return isArray ? transfereds : transfereds[0]
}

function deTransfer(data) {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const transfered = {}
    for (const key in item) {
      if (REVERSE_FIELD_MAP[key]) {
        transfered[REVERSE_FIELD_MAP[key]] = item[key]
      } else {
        transfered[key] = item[key]
      }
    }
    return transfered
  })
  return isArray ? transfereds : transfereds[0]
}