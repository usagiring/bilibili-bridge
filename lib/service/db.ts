/**
 * Drizzle + SQLite 数据库实例
 */
import path from 'path'
import { drizzle } from 'drizzle-orm/node-sqlite'

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'db.sqlite')
console.log(dbPath)
export const db = drizzle(dbPath)
