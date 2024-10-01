import { wrapper2Async, commentDB } from '../service/nedb'

export interface CommentDTO {
  // basic
  _id?: string
  content: string
  type: number

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

  // legacy
  // medalLevel?: number
  // medalName?: string
  // medalColorBorder?: string
  // medalColorStart?: string
  // medalColorEnd?: string
  medal?: {
    name: string
    level: number
    rid: string
    color: {
      border: string
      background: string
      level: string
      text: string
    }
  }

  color?: string
  emots?: {
    [x: string]: {
      emoticon_id: number
      emoji: string
      descript: string
      url: string
      width: number
      height: number
      emoticon_unique: string
    }
  }
  // tokenization
}
interface Comment {
  // basic
  _id?: string
  content: string
  type: number

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

  // short for model size
  ml?: {
    ne: string // name
    ll: number // level
    rid: string // roomId
    cr: { // color
      br: string // border
      bd: string // background
      ll: string // level
      tt: string // text
    }
  }
}

const DB = wrapper2Async(commentDB)

export async function find(query, options): Promise<CommentDTO[]> {
  const comments: Comment[] = await DB.find(transfer(query), options)
  return deTransfer(comments) as CommentDTO[]
}

export async function insert(data): Promise<CommentDTO> {
  const comment: Comment = await DB.insert(transfer(data))
  return deTransfer(comment) as CommentDTO
}

export async function count(query): Promise<number> {
  const count = await DB.count(transfer(query))
  return count
}

export const Model = {
  find,
  insert,
  count
}

function transfer(data: (CommentDTO[] | CommentDTO)): Comment[] | Comment {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const comment: Comment = item
    if (item.emots) {
      delete item.emots
    }
    if (item.medal) {
      comment.ml = {
        ne: item.medal.name,
        ll: item.medal.level,
        rid: item.medal.rid,
        cr: {
          br: item.medal.color?.border,
          bd: item.medal.color?.background,
          ll: item.medal.color?.level,
          tt: item.medal.color?.text,
        }
      }
      delete item.medal
    }
    // const transfered = {}
    // for (const key in item) {
    //   if (FIELD_MAP[key]) {
    //     transfered[FIELD_MAP[key]] = item[key]
    //   } else {
    //     transfered[key] = item[key]
    //   }
    // }
    // return transfered


    return comment
  })
  return isArray ? transfereds : transfereds[0]
}

function deTransfer(data: (Comment[] | Comment)): CommentDTO[] | CommentDTO {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    // const transfered = {}
    // for (const key in item) {
    //   if (REVERSE_FIELD_MAP[key]) {
    //     transfered[REVERSE_FIELD_MAP[key]] = item[key]
    //   } else {
    //     transfered[key] = item[key]
    //   }
    // }
    // return transfered
    const comment: CommentDTO = item

    if (item.ml) {
      comment.medal = {
        name: item.ml.ne,
        level: item.ml.ll,
        rid: item.ml.rid,
        color: {
          border: item.ml.cr?.br,
          background: item.ml.cr?.bd,
          level: item.ml.cr?.ll,
          text: item.ml.cr?.tt,
        }
      }
    }
    return comment

  })
  return isArray ? transfereds : transfereds[0]
}