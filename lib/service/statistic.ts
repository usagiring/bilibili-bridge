import jieba from '@node-rs/jieba'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from './db'
import { messages } from '../model/message.sqlite'
import type { GiftInfo } from '../model/message.sqlite'

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

  const conditions = [ eq(messages.roomId, String(roomId)) ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  // --- gift: category='gift' & gift->coinType = 1 (金瓜子) ---
  const giftRows = await db
    .select({
      userId: messages.userId,
      userName: messages.userName,
      gift: messages.gift,
    })
    .from(messages)
    .where(and(
      eq(messages.category, 'gift'),
      sql`json_extract(${messages.gift}, '$.coinType') = 1`,
      ...conditions,
    ))

  const userGiftMap: Record<string, { userName: string; totalPrice: number }> = {}
  for (const row of giftRows) {
    const gift = row.gift as GiftInfo
    const totalPrice = (gift.count || 0) * gift.price
    if (userGiftMap[row.userId]) {
      userGiftMap[row.userId].totalPrice += totalPrice
    } else {
      userGiftMap[row.userId] = { userName: row.userName, totalPrice }
    }
  }

  let totalGold = 0
  let topGold = 0
  let topSendGiftUser: any = {}
  for (const key of Object.keys(userGiftMap)) {
    const price = userGiftMap[key].totalPrice
    if (price > topGold) {
      topSendGiftUser = userGiftMap[key]
      topGold = price
    }
    totalGold += price
  }

  result.totalGold = totalGold * 1000
  result.topSendGiftUser = topSendGiftUser
  result.totalSendGiftUser = Object.keys(userGiftMap).length

  // --- comment ---
  const commentRows = await db
    .select({
      userId: messages.userId,
      userName: messages.userName,
      sendAt: messages.sendAt,
    })
    .from(messages)
    .where(and(eq(messages.category, 'comment'), ...conditions))

  const userCommentCountMap: Record<string, { userName: string; count: number }> = {}
  for (const row of commentRows) {
    if (userCommentCountMap[row.userId]) {
      userCommentCountMap[row.userId].count++
    } else {
      userCommentCountMap[row.userId] = { userName: row.userName, count: 1 }
    }
  }

  let topCommentCount = 0
  let topCommentUser: any = {}
  for (const key of Object.keys(userCommentCountMap)) {
    const count = userCommentCountMap[key].count
    if (count > topCommentCount) {
      topCommentUser = userCommentCountMap[key]
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

async function tokenization(_params: any) {
  // TODO
}

async function wordExtract({ roomId, start, end }) {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const conditions = [ eq(messages.roomId, String(roomId)), eq(messages.category, 'comment') ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  const rows = await db
    .select({ content: messages.content })
    .from(messages)
    .where(and(...conditions))

  const map: Record<string, number> = {}
  for (const row of rows) {
    // @node-rs/jieba: extractKeywords or cut
    const keywords: { keyword: string; weight: number }[] = (jieba as any).extract(row.content, 3)
    for (const { keyword } of keywords) {
      map[keyword] = (map[keyword] || 0) + 1
    }
  }

  return map
}

async function generateCSV({ roomId, start, end }) {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  const conditions = [ eq(messages.roomId, String(roomId)), eq(messages.category, 'gift') ]
  if (start) conditions.push(gte(messages.sendAt, startTime))
  if (end) conditions.push(lte(messages.sendAt, endTime))

  const rows = await db
    .select({
      userId: messages.userId,
      userName: messages.userName,
      roomId: messages.roomId,
      sendAt: messages.sendAt,
      gift: messages.gift,
    })
    .from(messages)
    .where(and(
      ...conditions,
      sql`json_extract(${messages.gift}, '$.coinType') = 1`,
    ))

  const header = [ 'userId', '用户名', '房间号', '礼物名', '礼物数量', '金瓜子', 'sendAt' ]
  const lines = [ header.join(',') ]

  for (const row of rows) {
    const gift = row.gift as GiftInfo
    lines.push([
      row.userId,
      row.userName,
      row.roomId,
      gift.name,
      String(gift.count),
      String(gift.price),
      String(row.sendAt),
    ].join(','))
  }

  return lines.join('\n')
}