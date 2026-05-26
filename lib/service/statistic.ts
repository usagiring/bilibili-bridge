import jieba from '@node-rs/jieba'
import { and, eq, gte, lte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { dateFormat, parseNumber } from './util'
import { db } from './db'
import { messages } from '../model/message.sqlite'
import type { GiftExtra, CommentExtra } from '../model/message.sqlite'

interface ChartOption {
  times: string[]
  data: number[]
}

interface StatisticResult {
  topSendGiftUser: any
  topCommentUser: any

  totalGold: number
  totalSendGiftUser: number
  totalComment: number

  chart?: ChartOption
}

export default {
  statistic,
  tokenization,
  wordExtract,
  generateCSV,
}

async function statistic({ roomId, start, end }): Promise<StatisticResult> {
  const result: any = {}
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const conditions = [ eq(messages.roomId, Number(roomId)) ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  // --- gift: category='gift' & extra->coinType = 1 (金瓜子) ---
  const giftRows = await db
    .select({
      uid: messages.uid,
      uname: messages.uname,
      extra: messages.extra,
    })
    .from(messages)
    .where(
      and(
        eq(messages.category, 'gift'),
        sql`json_extract(${messages.extra}, '$.coinType') = 1`,
        ...conditions,
      ),
    )

  const userGiftMap: Record<number, { uname: string; totalPrice: number }> = {}
  for (const row of giftRows) {
    const extra = row.extra as GiftExtra
    const totalPrice = (extra.count || 0) * extra.price
    if (userGiftMap[row.uid]) {
      userGiftMap[row.uid].totalPrice += totalPrice
    } else {
      userGiftMap[row.uid] = { uname: row.uname, totalPrice }
    }
  }

  let totalGold = 0
  let topGold = 0
  let topSendGiftUser: any = {}
  for (const key of Object.keys(userGiftMap)) {
    const price = userGiftMap[key as any].totalPrice
    if (price > topGold) {
      topSendGiftUser = userGiftMap[key as any]
      topGold = price
    }
    totalGold += price
  }

  result.totalGold = parseNumber(totalGold * 1000)
  result.topSendGiftUser = topSendGiftUser
  result.totalSendGiftUser = Object.keys(userGiftMap).length

  // --- comment ---
  const commentRows = await db
    .select({
      uid: messages.uid,
      uname: messages.uname,
      sendAt: messages.sendAt,
    })
    .from(messages)
    .where(and(eq(messages.category, 'comment'), ...conditions))

  const userCommentCountMap: Record<number, { uname: string; count: number }> = {}
  for (const row of commentRows) {
    if (userCommentCountMap[row.uid]) {
      userCommentCountMap[row.uid].count++
    } else {
      userCommentCountMap[row.uid] = { uname: row.uname, count: 1 }
    }
  }

  let topCommentCount = 0
  let topCommentUser: any = {}
  for (const key of Object.keys(userCommentCountMap)) {
    const count = userCommentCountMap[key as any].count
    if (count > topCommentCount) {
      topCommentUser = userCommentCountMap[key as any]
      topCommentCount = count
    }
  }

  result.totalComment = commentRows.length
  result.topCommentUser = topCommentUser

  // --- chart: 每分钟评论数 ---
  const dateDelta = endTime - startTime
  const tick = Math.ceil(dateDelta / (60 * 1000))
  const times: string[] = []
  for (let i = 0; i < tick; i++) {
    const date = new Date(startTime + i * 60 * 1000)
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    times.push(`${hh}:${mm}`)
  }

  const data = new Array(times.length).fill(0)
  for (const row of commentRows) {
    const delta = row.sendAt - startTime
    const index = Math.floor(delta / (60 * 1000))
    data[index]++
  }

  result.chart = { times, data }
  return result
}

async function tokenization({ roomId, start, end }) {
  return
}

async function wordExtract({ roomId, start, end }) {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const conditions = [ eq(messages.roomId, Number(roomId)), eq(messages.category, 'comment') ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  const rows = await db
    .select({ extra: messages.extra })
    .from(messages)
    .where(and(...conditions))

  const map: Record<string, number> = {}
  for (const row of rows) {
    const extra = row.extra as CommentExtra
    const keywords = jieba.extract(extra.content, 3)
    for (const { keyword } of keywords) {
      map[keyword] = (map[keyword] || 0) + 1
    }
  }

  return map
}

async function generateCSV({ roomId, start, end }) {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const conditions = [ eq(messages.roomId, Number(roomId)), eq(messages.category, 'gift') ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  const rows = await db
    .select({
      uid: messages.uid,
      uname: messages.uname,
      roomId: messages.roomId,
      sendAt: messages.sendAt,
      extra: messages.extra,
    })
    .from(messages)
    .where(
      and(
        ...conditions,
        sql`json_extract(${messages.extra}, '$.coinType') = 1`,
      ),
    )

  const header = [ 'uid', '用户名', '房间号', '礼物名', '礼物数量', '金瓜子', 'sendAt' ]
  const lines = [ header.join(',') ]

  for (const row of rows) {
    const extra = row.extra as GiftExtra
    lines.push([
      row.uid,
      row.uname,
      row.roomId,
      extra.giftName,
      extra.count,
      parseNumber((extra.price || 0) * (extra.count || 1)),
      dateFormat(row.sendAt),
    ].join(','))
  }

  return lines.join('\n')
}