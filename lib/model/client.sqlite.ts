/**
 * 客户端 / Bridge 连接模型
 * 每个客户端代表一个独立的 B站直播间连接实例
 *
 * 字段参照 state.ts 中 Client 接口定义，嵌套结构使用 JSON 列
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const clients = sqliteTable('client', {
  /** 客户端唯一标识（UUID） */
  id: text('client_id').primaryKey(),

  /** 自定义样式 */
  config: text('config', { mode: 'json' }),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
})

export type ClientRow = typeof clients.$inferSelect
export type ClientInsert = typeof clients.$inferInsert
