/**
 * 直播间/房间模型
 */
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const rooms = sqliteTable('room', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** B站直播间房间号 */
  roomId: integer('room_id').notNull().unique(),

  /** 主播 UID */
  uid: integer('uid').notNull(),

  /** 主播昵称 */
  uname: text('uname'),

  /** 直播间标题 */
  title: text('title'),

  /** 封面图 URL */
  cover: text('cover'),

  /** 直播状态: 'live' | 'preparing' | 'offline' */
  status: text('status').notNull().default('offline'),

  /** 人气值 */
  popularity: integer('popularity').default(0),

  /** 在线人数 */
  onlineCount: integer('online_count').default(0),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    roomIdUniqueIdx: uniqueIndex('idx_room_room_id').on(table.roomId),
    uidIdx: uniqueIndex('idx_room_uid').on(table.uid),
    statusIdx: uniqueIndex('idx_room_status').on(table.status),
  }))

export type RoomRow = typeof rooms.$inferSelect
export type RoomInsert = typeof rooms.$inferInsert
