/**
 * 客户端 / Bridge 连接模型
 * 每个客户端代表一个独立的 B站直播间连接实例
 */
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const clients = sqliteTable('client', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** 客户端名称（用于管理面板展示） */
  name: text('name').notNull(),

  /** B站直播间房间号 */
  roomId: integer('room_id').notNull(),

  /** 云服务 AccessKey / SecretId */
  accessKeyId: text('access_key_id'),

  /** 云服务 AccessKey Secret / SecretKey */
  accessKeySecret: text('access_key_secret'),

  /** ASR/翻译 AppKey */
  appKey: text('app_key'),

  /** 云厂商: 'alicloud' | 'tencentcloud' */
  provider: text('provider').notNull().default('alicloud'),

  /** 状态: 'active' | 'paused' | 'closed' */
  status: text('status').notNull().default('active'),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
},
  (table) => ({
    roomIdUniqueIdx: uniqueIndex('idx_client_room_id').on(table.roomId),
    statusIdx: uniqueIndex('idx_client_status').on(table.status),
  }))

export type ClientRow = typeof clients.$inferSelect
export type ClientInsert = typeof clients.$inferInsert
