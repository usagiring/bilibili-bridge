/**
 * 抽奖记录模型
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

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
