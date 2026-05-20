import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ═══════════════════════════════════════════
// 1. 统一消息表（弹幕 / 礼物 / SC / 互动）
// ═══════════════════════════════════════════
//
// 字段归类：
//   category     — 区分消息大类: 'comment' | 'gift' | 'guard' | 'superchat' | 'interact'
//   subType      — 原始细分类型号
//   [公共字段]    — uid, uname, role, roomId, sendAt, avatar
//   medal (JSON) — 勋章信息，三张表都有，合并为 JSON
//   extra (JSON) — 各类特有字段，按 category 区分结构
//
//   extra 结构（按 category）:
//   ┌───────────┬──────────────────────────────────────────────┐
//   │ comment   │ { content, isAdmin, color, emots }           │
//   │ gift      │ { giftId, giftName, price, count, coinType,  │
//   │           │   batchComboId }                             │
//   │ guard     │ { giftId, giftName, price, count }           │
//   │ superchat │ { scId, content, contentJpn, price }         │
//   │ interact  │ { identities[], face, unameColor }           │
//   └───────────┴──────────────────────────────────────────────┘

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

// ═══════════════════════════════════════════
// 2. 用户表
// ═══════════════════════════════════════════
export const users = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uid: integer('uid').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  sex: text('sex'),
  level: integer('level').notNull().default(0),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    uidUniqueIdx: uniqueIndex('idx_user_uid').on(table.uid),
  }))

export type UserRow = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert

// ═══════════════════════════════════════════
// 3. 抽奖记录表
// ═══════════════════════════════════════════
export const lotteries = sqliteTable('lottery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uid: integer('uid').notNull(),
  uname: text('uname').notNull(),
  avatar: text('avatar').notNull(),
  awardedAt: integer('awarded_at').notNull(),
  description: text('description'),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    uidIdx: index('idx_lottery_uid').on(table.uid),
    awardedAtIdx: index('idx_lottery_awarded_at').on(table.awardedAt),
  }))

export type LotteryRow = typeof lotteries.$inferSelect
export type LotteryInsert = typeof lotteries.$inferInsert

// ═══════════════════════════════════════════
// 4. 其他消息表（原始 B站消息存档）
// ═══════════════════════════════════════════
export const others = sqliteTable('other', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cmd: text('cmd').notNull(),
  roomId: integer('room_id').notNull(),
  raw: text('raw', { mode: 'json' }).notNull(),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    cmdIdx: index('idx_other_cmd').on(table.cmd),
    roomIdIdx: index('idx_other_room_id').on(table.roomId),
  }))

export type OtherRow = typeof others.$inferSelect
export type OtherInsert = typeof others.$inferInsert
