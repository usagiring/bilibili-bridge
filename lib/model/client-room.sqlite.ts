/**
 * Client-Room 关联表
 * 多对多：一个客户端可监听多个房间，一个房间可被多个客户端监听
 */
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const clientRooms = sqliteTable('client_room', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** 客户端 ID → client.id */
  clientId: integer('client_id').notNull(),

  /** 房间 ID → room.id */
  roomId: integer('room_id').notNull(),

  /** 在该房间启用的功能 (JSON): { asr, translate, autoReply, danmakuCommand } */
  features: text('features', { mode: 'json' }),

  /** 关联状态: 'active' | 'paused' */
  status: text('status').notNull().default('active'),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    // 同一 client-room 组合唯一
    uniquePair: uniqueIndex('idx_client_room_pair').on(table.clientId, table.roomId),
    clientIdx: index('idx_cr_client').on(table.clientId),
    roomIdx: index('idx_cr_room').on(table.roomId),
    statusIdx: index('idx_cr_status').on(table.status),
  }))

export type ClientRoomRow = typeof clientRooms.$inferSelect
export type ClientRoomInsert = typeof clientRooms.$inferInsert

export interface ClientRoomFeatures {
  asr?: boolean
  translate?: boolean
  autoReply?: boolean
  danmakuCommand?: boolean
}
