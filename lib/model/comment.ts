import { wrapper2Async, commentDB } from '../service/nedb'

export interface CommentDTO {
  // basic
  _id?: string
  content: string

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
  medalLevel?: number
  medalName?: string
  medalColorBorder?: string
  medalColorStart?: string
  medalColorEnd?: string
}
interface Comment {
  // basic
  _id?: string
  content: string

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
  // medalLevel?: number
  // medalName?: string
  // medalRoomId?: number
  // medalColorBorder?: string
  // medalColorStart?: string
  // medalColorEnd?: string

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

const DB = wrapper2Async(commentDB)

export async function find(query, options): Promise<CommentDTO[]> {
  const comments: Comment[] = await DB.find(transfer(query), options)
  return deTransfer(comments)
}

export async function insert(data): Promise<CommentDTO> {
  const comment: Comment = await DB.insert(transfer(data))
  return deTransfer(comment)
}

export const Model = {
  find,
  insert
}

function transfer(data) {
  const isArray = Array.isArray(data)
  const items = isArray ? data : [data]
  const transfereds = items.map(item => {
    const transfered = {}
    for (const key in item) {
      if (FIELD_MAP[key]) {
        transfered[FIELD_MAP[key]] = data[key]
      } else {
        transfered[key] = data[key]
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
        transfered[REVERSE_FIELD_MAP[key]] = data[key]
      } else {
        transfered[key] = data[key]
      }
    }
    return transfered
  })
  return isArray ? transfereds : transfereds[0]
}