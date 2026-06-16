/**
 * Drizzle + SQLite 数据库实例
 * 使用 Node.js 原生 node:sqlite 驱动，启动时自动建表
 */
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/node-sqlite'
import path from 'path'

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db.sqlite')
console.log(dbPath)

// ── 自动建表（作为依赖被导入时也生效）──
const sqlite = new DatabaseSync(dbPath)
sqlite.exec('PRAGMA journal_mode = WAL')

sqlite.exec(`CREATE TABLE IF NOT EXISTS client (
  client_id TEXT PRIMARY KEY,
  config TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

sqlite.exec(`CREATE TABLE IF NOT EXISTS "user" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  sex TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

sqlite.exec(`CREATE TABLE IF NOT EXISTS message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT,
  category TEXT NOT NULL,
  type INTEGER,
  send_at INTEGER NOT NULL,
  room_id TEXT NOT NULL,
  client_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_name_color TEXT,
  roles TEXT,
  face TEXT,
  emots TEXT,
  gift TEXT,
  medal TEXT,
  interact TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

sqlite.exec(`CREATE TABLE IF NOT EXISTS lottery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid INTEGER NOT NULL,
  uname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  awarded_at INTEGER NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

// 索引（CREATE INDEX IF NOT EXISTS）
for (const idx of [
  'CREATE INDEX IF NOT EXISTS idx_msg_category ON message(category)',
  'CREATE INDEX IF NOT EXISTS idx_msg_uid ON message(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_msg_room_id ON message(room_id)',
  'CREATE INDEX IF NOT EXISTS idx_msg_send_at ON message(send_at)',
  'CREATE INDEX IF NOT EXISTS idx_msg_room_category ON message(room_id, category)',
  'CREATE INDEX IF NOT EXISTS idx_msg_room_send_at ON message(room_id, send_at)',
  'CREATE INDEX IF NOT EXISTS idx_user_uid ON "user"(uid)',
  'CREATE INDEX IF NOT EXISTS idx_lottery_uid ON lottery(uid)',
  'CREATE INDEX IF NOT EXISTS idx_lottery_awarded_at ON lottery(awarded_at)',
]) {
  sqlite.exec(idx)
}

export const db = drizzle(dbPath)
