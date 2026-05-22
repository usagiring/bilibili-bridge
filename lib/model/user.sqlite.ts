/**
 * 用户模型
 */
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

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
