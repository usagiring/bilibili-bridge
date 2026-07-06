import { Jieba, TfIdf } from '@node-rs/jieba'
import { dict, idf } from '@node-rs/jieba/dict'

import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from './db'
import { messages } from '../model/message.sqlite'
import type { GiftInfo } from '../model/message.sqlite'

interface ChartOption {
  times: string[]
  data: number[]
}

interface StatisticResult {
  // topSendGiftUser: any
  // topCommentUser: any
  totalGold: number
  totalSendGiftUser: number
  totalComment: number
  chart?: ChartOption
}

const jieba = Jieba.withDict(dict)
const tfIdf = TfIdf.withDict(idf)

export async function getStats({
  roomId,
  startTime,
  endTime,
}: {
  roomId: string
  startTime: number | Date
  endTime: number | Date
}): Promise<StatisticResult> {
  const startMs = new Date(startTime).getTime()
  const endMs = new Date(endTime).getTime()

  const baseConditions = [
    eq(messages.roomId, String(roomId)),
    gte(messages.sendAt, startMs),
    lte(messages.sendAt, endMs),
  ]

  // ── 礼物统计（gold coinType）──
  const giftRows = db
    .select({
      userId: messages.userId,
      username: messages.username,
      gift: messages.gift,
    })
    .from(messages)
    .where(and(
      sql`${messages.category} IN ('gift', 'superchat')`,
      sql`json_extract(${messages.gift}, '$.coinType') = 'gold'`,
      ...baseConditions,
    ))
    .all()

  const giftByUser: Record<string, { username: string; totalPrice: number }> = {}
  for (const row of giftRows) {
    const gift = row.gift as GiftInfo | null
    if (!gift) continue
    const price = (gift.count || 0) * gift.price
    if (giftByUser[row.userId]) {
      giftByUser[row.userId].totalPrice += price
    } else {
      giftByUser[row.userId] = { username: row.username, totalPrice: price }
    }
  }

  const giftEntries = Object.entries(giftByUser)
  const totalGold = giftEntries.reduce((sum, [ , u ]) => sum + u.totalPrice, 0)
  // const topSendGiftUser = giftEntries.reduce((best, [ , u ]) =>
  //   u.totalPrice > (best?.totalPrice || 0) ? u : best,
  // null as { username: string; totalPrice: number } | null,
  // )

  // ── 评论统计 ──
  const commentRows = db
    .select({
      userId: messages.userId,
      username: messages.username,
      sendAt: messages.sendAt,
    })
    .from(messages)
    .where(and(eq(messages.category, 'comment'), ...baseConditions))
    .all()

  const commentByUser: Record<string, { username: string; count: number }> = {}
  for (const row of commentRows) {
    const entry = commentByUser[row.userId]
    if (entry) {
      entry.count++
    } else {
      commentByUser[row.userId] = { username: row.username, count: 1 }
    }
  }

  // const commentEntries = Object.entries(commentByUser)
  // const topCommentUser = commentEntries.reduce((best, [ , u ]) =>
  //   u.count > (best?.count || 0) ? u : best,
  // null as { username: string; count: number } | null,
  // )

  // ── 每分钟评论数图表 ──
  const totalMinutes = Math.ceil((endMs - startMs) / (60 * 1000))
  const times: string[] = []
  const chartData = new Array(totalMinutes).fill(0)

  for (let i = 0; i < totalMinutes; i++) {
    const date = new Date(startMs + i * 60 * 1000)
    times.push(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)
  }

  for (const row of commentRows) {
    const idx = Math.floor((row.sendAt - startMs) / (60 * 1000))
    if (idx >= 0 && idx < chartData.length) chartData[idx]++
  }

  return {
    totalGold: Math.round(totalGold * 1000),
    totalSendGiftUser: giftEntries.length,
    // topSendGiftUser,
    totalComment: commentRows.length,
    // topCommentUser,
    chart: { times, data: chartData },
  }
}

async function tokenization(_params: any) {
  // TODO
}

export async function wordExtract({
  roomId,
  startTime,
  endTime,
}: {
  roomId: string
  startTime: number | Date
  endTime: number | Date
}): Promise<Record<string, number>> {
  const conditions = [
    eq(messages.roomId, String(roomId)),
    eq(messages.category, 'comment'),
    gte(messages.sendAt, new Date(startTime).getTime()),
    lte(messages.sendAt, new Date(endTime).getTime()),
  ]

  const rows = db
    .select({ content: messages.content })
    .from(messages)
    .where(and(...conditions))
    .all()

  const frequency: Record<string, number> = {}
  for (const row of rows) {
    const keywords = tfIdf.extractKeywords(jieba, row.content, 3)
    for (const keyword of keywords) {
      frequency[keyword.keyword] = (frequency[keyword.keyword] || 0) + 1
    }
  }

  return frequency
}

export async function generateCSV({
  roomId,
  startTime,
  endTime,
}: {
  roomId: string
  startTime?: number | Date
  endTime?: number | Date
}): Promise<Buffer> {
  const conditions = [
    eq(messages.roomId, String(roomId)),
    sql`${messages.category} IN ('gift', 'superchat')`,
    sql`json_extract(${messages.gift}, '$.coinType') = 'gold'`,
    gte(messages.sendAt, new Date(startTime).getTime()),
    lte(messages.sendAt, new Date(endTime).getTime()),
  ]

  const rows = db
    .select({
      userId: messages.userId,
      username: messages.username,
      roomId: messages.roomId,
      sendAt: messages.sendAt,
      gift: messages.gift,
    })
    .from(messages)
    .where(and(...conditions))
    .all()

  const header = [ 'UID', '用户名', '房间号', '礼物名', '礼物数量', '金额（元）', '时间' ]
  const lines = [ header.join(',') ]

  for (const row of rows) {
    const gift = row.gift as GiftInfo | null
    if (!gift) continue
    lines.push([
      forceText(row.userId),
      escapeCSV(row.username),
      forceText(row.roomId),
      escapeCSV(gift.name),
      String(gift.count),
      String(gift.totalPrice),
      new Date(row.sendAt).toLocaleString(),
    ].join(','))
  }

  // return lines.join('\n')

  // 1. 创建包含 UTF-8 BOM 头的 Buffer
  const bom = Buffer.from([ 0xEF, 0xBB, 0xBF ])
  const csvContent = lines.join('\n')
  return Buffer.concat([ bom, Buffer.from(csvContent, 'utf-8') ])
}

function escapeCSV(value: string): string {
  // Excel 公式注入防护：以 = + - @ 开头的值前加单引号
  if (/^[=+\-@]/.test(value)) value = `'${value}`
  // 含逗号、引号、换行、回车的字段用双引号包裹
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** 长数字强制 Excel 当文本显示，避免变成指数形式 */
function forceText(value: string): string {
  return `="${value}"`
}