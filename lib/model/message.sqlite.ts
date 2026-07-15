/**
 * 统一消息模型（弹幕 / 礼物 / SC / 互动 / 进入房间）
 *
 * ┌──────────────┬──────────────────────────────────────────────────┐
 * │ 公共字段      │ id, content, color, category, subType, sendAt,    │
 * │              │ roomId, userId, userName, face, createdAt         │
 * ├──────────────┼──────────────────────────────────────────────────┤
 * │ roles (JSON) │ 用户身份标识: 0:普通 1:总督 2:提督 3:舰长 4:房管 │
 * │ emots (JSON) │ 弹幕表情包（comment 特有）                        │
 * │ gift  (JSON) │ 礼物信息（gift / guard / superchat 特有）         │
 * │ medal (JSON) │ 用户勋章信息（所有类型都可能有）                  │
 * │interact(JSON)│ 进入房间互动信息（interact 特有）                  │
 * └──────────────┴──────────────────────────────────────────────────┘
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const messages = sqliteTable('message', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(), // 原始消息文本内容（弹幕文本 / 礼物名称 / 进入房间等）
  color: text('color'), // 弹幕颜色（十六进制字符串），礼物和其他消息可为空

  // ── 分类 ──
  category: text('category').notNull(), // 'comment' | 'gift' | 'superchat' | 'interact'
  type: integer('type'), // 0：普通弹幕 1：节奏风暴 2：天选时刻

  // ── 时间 & 房间 ──
  sendAt: integer('send_at').notNull(),
  roomId: text('room_id').notNull(),

  clientId: text('client_id'),

  // ── 用户公共字段 ──
  userId: text('user_id').notNull(),
  username: text('user_name').notNull(),
  usernameColor: text('user_name_color'), // 用户名颜色（十六进制字符串），如果有的话
  roles: text('roles', { mode: 'json' }).$type<Role[]>(), // 身份标识数组
  face: text('face'),

  // ── 表情（JSON，弹幕特有）──
  emots: text('emots', { mode: 'json' }).$type<EmotMap>(),
  
  voiceUrl: text('voice_url'),
  fileDuration: text('file_duration'),
  emojiUrl: text('emoji_url'),

  // ── 礼物特有字段 (JSON) ──
  gift: text('gift', { mode: 'json' }).$type<GiftInfo>(),

  // ── 勋章 (JSON) ──
  medal: text('medal', { mode: 'json' }).$type<MedalInfo>(),

  interact: text('interact', { mode: 'json' }).$type<InteractInfo>(),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
},
(table) => [
  index('idx_msg_category').on(table.category),
  index('idx_msg_uid').on(table.userId),
  index('idx_msg_room_id').on(table.roomId),
  index('idx_msg_send_at').on(table.sendAt),
  index('idx_msg_room_category').on(table.roomId, table.category),
  index('idx_msg_room_send_at').on(table.roomId, table.sendAt),
])

export type MessageRow = typeof messages.$inferSelect
export type MessageInsert = typeof messages.$inferInsert

// ── JSON 列类型定义 ──

/** 身份标识: 0:普通 1:总督 2:提督 3:舰长 4:房管 */
export type Role = 0 | 1 | 2 | 3 | 4

export interface EmotInfo {
  emoticon_id: number
  emoji: string
  descript: string
  url: string
  width: number
  height: number
  emoticon_unique: string
}

export type EmotMap = Record<string, EmotInfo>

export interface GiftInfo {
  id: string
  type: 'gift' | 'anchor' | 'superchat'
  name: string
  price: number
  count: number
  coinType: 'gold' | 'silver'
  batchComboId?: string
  totalPrice: number
  contentJpn?: string // SC 日文内容（superchat 特有）
  webp?: string
  isFirst?: boolean
}

export interface MedalInfo {
  name: string
  level: number
  roomId?: string
  anchor?: number
  roomUserId?: string
  color: {
    border: string
    bg: string
    level: string
    text: string
  }
}

export interface InteractInfo {
  type: 1 | 2 | 3 // 1:进入房间 2:关注直播间 3:分享直播间
  identities: number[]
}

// ── 分类 Extra 类型别名 ──
/** 弹幕扩展字段 */
export type CommentExtra = EmotMap

/** 礼物扩展字段 */
export type GiftExtra = GiftInfo

/** SC 扩展字段 */
export type SuperChatExtra = GiftInfo

/** 互动扩展字段 */
export type InteractExtra = InteractInfo
