/**
 * 统一消息模型（弹幕 / 礼物 / SC / 互动）
 *
 * 字段归类：
 *   category     — 区分消息大类: 'comment' | 'gift' | 'guard' | 'superchat' | 'interact'
 *   subType      — 原始细分类型号
 *   [公共字段]    — uid, uname, role, roomId, sendAt, avatar
 *   medal (JSON) — 勋章信息，三张表都有，合并为 JSON
 *   extra (JSON) — 各类特有字段，按 category 区分结构
 *
 *   extra 结构（按 category）:
 *   ┌───────────┬──────────────────────────────────────────────┐
 *   │ comment   │ { content, isAdmin, color, emots }           │
 *   │ gift      │ { giftId, giftName, price, count, coinType,  │
 *   │           │   batchComboId }                             │
 *   │ guard     │ { giftId, giftName, price, count }           │
 *   │ superchat │ { scId, content, contentJpn, price }         │
 *   │ interact  │ { identities[], face, unameColor }           │
 *   └───────────┴──────────────────────────────────────────────┘
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const messages = sqliteTable('message', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // ── 分类 ──
  category: text('category').notNull(), // 'comment' | 'gift' | 'guard' | 'superchat' | 'interact'
  subType: integer('sub_type'),          // 原始细分类型号

  // ── 时间 & 房间 ──
  sendAt: integer('send_at').notNull(),
  roomId: integer('room_id').notNull(),

  // ── 用户公共字段 ──
  uid: integer('uid').notNull(),
  uname: text('uname').notNull(),
  role: integer('role').notNull().default(0), // 0:普通 1:总督 2:提督 3:舰长
  avatar: text('avatar'),

  // ── 勋章 (JSON) ──
  // { name, level, rid, guard, color: { border, bg, level, text } }
  medal: text('medal', { mode: 'json' }),

  // ── 类别特有字段 (JSON) ──
  extra: text('extra', { mode: 'json' }),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    categoryIdx: index('idx_msg_category').on(table.category),
    uidIdx: index('idx_msg_uid').on(table.uid),
    roomIdIdx: index('idx_msg_room_id').on(table.roomId),
    sendAtIdx: index('idx_msg_send_at').on(table.sendAt),
    roomCategoryIdx: index('idx_msg_room_category').on(table.roomId, table.category),
    roomSendAtIdx: index('idx_msg_room_send_at').on(table.roomId, table.sendAt),
  }))

export type MessageRow = typeof messages.$inferSelect
export type MessageInsert = typeof messages.$inferInsert

// ── 各分类 extra 的类型定义 ──
export interface CommentExtra {
  content: string
  isAdmin?: boolean
  color?: string
  emots?: Record<string, {
    emoticon_id: number
    emoji: string
    descript: string
    url: string
    width: number
    height: number
    emoticon_unique: string
  }>
}

export interface GiftExtra {
  giftId: number
  giftName: string
  price: number
  count: number
  coinType: 1 | 2 // 1:gold 2:silver
  batchComboId?: string
}

export interface SuperChatExtra {
  scId: string
  content: string
  contentJpn?: string
  price: number
}

export interface InteractExtra {
  identities: number[]
  face?: string
  unameColor?: string
}

export interface MedalInfo {
  name: string
  level: number
  rid?: string
  guard?: number
  color: {
    border: string
    bg: string
    level: string
    text: string
  }
}
