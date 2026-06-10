/**
 * 原始 B站消息存档模型
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const others = sqliteTable('other',{
  id: integer('id').primaryKey({ autoIncrement: true }),
  cmd: text('cmd').notNull(),
  roomId: integer('room_id').notNull(),
  raw: text('raw', { mode: 'json' }).notNull(),

  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  cmdIdx: index('idx_other_cmd').on(table.cmd),
  roomIdIdx: index('idx_other_room_id').on(table.roomId),
}))

export type OtherRow = typeof others.$inferSelect
export type OtherInsert = typeof others.$inferInsert
