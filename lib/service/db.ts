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
  voice_url TEXT,
  file_duration TEXT,
  emoji_url TEXT,
  gift TEXT,
  medal TEXT,
  interact TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)

// 兼容旧数据库：添加后来新增的列
for (const col of [ 'voice_url', 'file_duration', 'emoji_url' ]) {
  try { sqlite.exec(`ALTER TABLE message ADD COLUMN ${col} TEXT`) } catch { /* 列已存在则忽略 */ }
}

// 索引
for (const idx of [
  // 游标分页：(room_id, send_at, id) 覆盖 message.ts 的游标查询
  'CREATE INDEX IF NOT EXISTS idx_msg_room_sendat_id ON message(room_id, send_at, id)',
  // 统计查询：(room_id, category, send_at) 覆盖 stats.ts 的所有查询
  'CREATE INDEX IF NOT EXISTS idx_msg_room_category_sendat ON message(room_id, category, send_at)',
]) {
  sqlite.exec(idx)
}

export const db = drizzle(dbPath)
