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

  medal?: {
    name: string
    level: number
    rid?: string
    guard?: number
    color: {
      border: string
      background: string
      level: string
      text: string
    }
  }
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

  // short for model size
  ml?: {
    ne: string // name
    ll: number // level
    rid?: string // roomId
    gd?: number // guard
    cr: { // color
      br: string // border
      bd: string // background
      ll: string // level
      tt: string // text
    }
  }
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

function transfer(data: InteractDTO[] | InteractDTO): Interact[] | Interact {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const interact: Interact = item
    if (item.medal) {
      interact.ml = {
        ne: item.medal.name,
        ll: item.medal.level,
        rid: item.medal.rid,
        gd: item.medal.guard,
        cr: {
          br: item.medal.color?.border,
          bd: item.medal.color?.background,
          ll: item.medal.color?.level,
          tt: item.medal.color?.text,
        }
      }
      delete item.medal
    }
    return interact
  })

  return isArray ? transfereds : transfereds[0]
}

function deTransfer(data: Interact[] | Interact): InteractDTO[] | InteractDTO {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const interact: InteractDTO = item

    if (item.ml) {
      interact.medal = {
        name: item.ml.ne,
        level: item.ml.ll,
        rid: item.ml.rid,
        guard: item.ml.gd,
        color: {
          border: item.ml.cr?.br,
          background: item.ml.cr?.bd,
          level: item.ml.cr?.ll,
          text: item.ml.cr?.tt,
        }
      }
    }
    return interact
  })
  return isArray ? transfereds : transfereds[0]
}