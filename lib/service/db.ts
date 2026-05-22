/**
 * Drizzle + SQLite 数据库实例
 * 使用 better-sqlite3 驱动
 */
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db', 'bridge.sqlite')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)
