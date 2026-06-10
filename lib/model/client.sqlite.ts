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
  style: text('style', { mode: 'json' }),

  /** 直播间信息：{ id, userId, liveStatus, liveStream, autoReplyRules, record } */
  rooms: text('rooms', { mode: 'json' }),

  /** 用户信息：{ id, face, cookie, medal: { name } } */
  user: text('user', { mode: 'json' }),

  /** ASR 配置：{ instance } */
  asr: text('asr', { mode: 'json' }),

  /** 机器翻译配置：{ instance, fromLang, toLang } */
  mt: text('mt', { mode: 'json' }),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
})

export type ClientRow = typeof clients.$inferSelect
export type ClientInsert = typeof clients.$inferInsert
