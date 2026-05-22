/**
 * SQLite Drizzle 模型统一导出
 *
 * 文件拆分:
 *   client.sqlite.ts       — 客户端连接
 *   client-room.sqlite.ts  — 客户端-房间关联
 *   user.sqlite.ts         — 用户
 *   room.sqlite.ts         — 直播间
 *   message.sqlite.ts      — 统一消息
 *   lottery.sqlite.ts      — 抽奖记录
 *   other.sqlite.ts        — 原始消息存档
 */

// ── 客户端 ──
export { clients } from './client.sqlite'
export type { ClientRow, ClientInsert } from './client.sqlite'

// ── 客户端-房间关联 ──
export { clientRooms } from './client-room.sqlite'
export type { ClientRoomRow, ClientRoomInsert, ClientRoomFeatures } from './client-room.sqlite'

// ── 用户 ──
export { users } from './user.sqlite'
export type { UserRow, UserInsert } from './user.sqlite'

// ── 直播间 ──
export { rooms } from './room.sqlite'
export type { RoomRow, RoomInsert } from './room.sqlite'

// ── 统一消息 ──
export { messages } from './message.sqlite'
export type {
  MessageRow,
  MessageInsert,
  CommentExtra,
  GiftExtra,
  SuperChatExtra,
  InteractExtra,
  MedalInfo,
} from './message.sqlite'

// ── 抽奖记录 ──
export { lotteries } from './lottery.sqlite'
export type { LotteryRow, LotteryInsert } from './lottery.sqlite'

// ── 原始消息 ──
export { others } from './other.sqlite'
export type { OtherRow, OtherInsert } from './other.sqlite'

