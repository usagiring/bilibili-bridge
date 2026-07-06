import { messages, MessageInsert } from '../../model/message.sqlite'
import { db } from '../db'
import { CMD, BILI_CMD } from '../const'
import event from '../event'
import sse from '../sse'
import { transformColorNumber2String } from '../util'
import state from '../state'

export default {
  commentJob,
  interactJob,
  giftJob,
}

interface MessageInfo_0_15 {
  mode: number
  extra: string
  user: {
    uid: number
    base: {
      name: string
      face: string
      name_color: number
      is_mystery: boolean
      risk_ctrl_info: {
        name: string
        face: string
      }
      origin_info: {
        name: string
        face: string
      }
      official_info: {
        role: number
        title: string
        desc: string
        type: number
      }
    }
    medal: any
    wealth: {
      level: number
      dm_icon_key: string
    }
    guard: any
    uhead_frame: any
    guard_leader: {
      is_guard_leader: boolean
    }
  }
}

interface MessageInfo_0_15_extra {
  emots?: {
    [x: string]: {
      emoticon_id: number
      emoji: string
      descript: string
      url: string
      width: number
      height: number
      emoticon_unique: string
    }
  }
}

interface InteractData {
  identities: number[]
  is_mystery: boolean
  msg_type: 1 | 2 | 3
  timestamp: number
  roomid: string
  fans_medal: {
    anchor_roomid: number
    guard_level: number
    icon_id: number
    is_lighted: number
    medal_color: number
    medal_color_border: number
    medal_color_end: number
    medal_color_start: number
    medal_level: number
    medal_name: string
    score: number
    special: string
    target_id: number
  }
  uid: string
  score: number
  uname: string
  uname_color: string
  uinfo: {
    uid: string
    base: {
      name: string
      face: string
      name_color: number
      is_mystery: boolean
      risk_ctrl_info: {
        name: string
        face: string
      }
      origin_info: {
        name: string
        face: string
      }
    }
    medal: {
      ruid: number
      name: string
      level: number
      guard_level: number,
      v2_medal_color_border: string
      v2_medal_color_end: string
      v2_medal_color_level: string
      v2_medal_color_start: string
      v2_medal_color_text: string
    }
  }
}

interface InteractV2 {
  userId: string
  roomId: string
  type: number
  sendAt: string
  user: {
    id: string
    info: {
      username: string
      face: string
      usernameColor: string
    }
    medal: {
      name: string
      level: number
      anchor: number
      color1: string
      color2: string
      color3: string
      color4: string
      color5: string
    }
  }
}

export async function commentJob({ msg, roomId, clientId }) {
  const comment = parseComment({ msg, roomId, clientId })
  if (!comment) return

  const result = db.insert(messages).values(comment).returning().get()

  sse.send({ clientId, event: CMD.MESSAGE, data: result })
  event.emit(CMD.AUTO_REPLY, { clientId, message: result })
  // event.emit(CMD.DANMAKU_COMMAND, result)
}

export async function interactJob({ msg, roomId, clientId }) {
  const interact = parseInteract({ msg, clientId })
  if (!interact) return

  const result = db.insert(messages).values(interact).returning().get()

  sse.send({ clientId, event: CMD.MESSAGE, data: result })
  event.emit(CMD.AUTO_REPLY, { clientId, message: result })
}

export async function giftJob({ msg, roomId, clientId }) {
  const gift = parseGift({ msg, clientId, roomId })
  if (!gift) return

  const result = db.insert(messages).values(gift).returning().get()

  sse.send({ clientId, event: CMD.MESSAGE, data: result })
  event.emit(CMD.AUTO_REPLY, { clientId, message: result })
}

const roleTransformMap = {
  1: 3, // 总督
  2: 2, // 提督
  3: 1, // 舰长
}
export function parseComment({ msg, roomId, clientId }): MessageInsert {
  if (!msg.cmd.includes(BILI_CMD.DANMU_MSG)) return
  const dmV2 = msg.dm_v2

  let face: string = ''
  if (dmV2) {
    const dmV2Decoder = state.dmV2Decoder
    if (dmV2Decoder) {
      const dm = dmV2Decoder(dmV2)
      face = dm?.user?.face
    }
  }
  const [ uid, name, isAdmin ] = msg.info[2]
  const [ medalLevel, medalName, medalAnchorName, medalRoomId, medalColor, , , medalColorBorder, medalColorStart, medalColorEnd ] = msg.info[3]
  let emoji = msg.info[0][13] || {}
  let voice = msg.info[0][14] || {}
  const { extra: extraString, user } = (msg.info[0][15] || {}) as MessageInfo_0_15
  let extra: MessageInfo_0_15_extra
  try {
    emoji = typeof emoji === 'string' ? JSON.parse(emoji) : emoji
    voice = typeof voice === 'string' ? JSON.parse(voice) : voice
    extra = typeof extraString === 'string' ? JSON.parse(extraString) : extraString
  } catch (e) {
    // silence
  }

  const { voice_url: voiceUrl, file_duration: fileDuration } = voice
  const { url: emojiUrl } = emoji
  if (user) {
    face = user.base?.face
  }

  const anchorRole = roleTransformMap[msg.info[7]]
  const roles = [ anchorRole || 0 ]
  if (isAdmin) roles.push(99)
  // TODO 房主

  const comment: MessageInsert = {
    roomId: String(roomId),
    clientId,
    category: 'comment',
    content: msg.info[1],
    sendAt: msg.info[0][4],
    userId: String(uid || ''),
    username: name,
    usernameColor: transformColorNumber2String(msg.info[0][12]), // ?
    roles,
    color: transformColorNumber2String(msg.info[0][3]), // 弹幕原生原色
    type: msg.info[0][9], // 0：普通弹幕 1：节奏风暴 2：天选时刻
    face,
  }

  if (user?.medal) {
    comment.medal = {
      name: user.medal.name,
      level: user.medal.level,
      roomId: String(medalRoomId),
      color: {
        bg: user.medal.v2_medal_color_start,
        border: user.medal.v2_medal_color_border,
        level: user.medal.v2_medal_color_level,
        text: user.medal.v2_medal_color_text,
      },
    }
  } else if (medalLevel && medalName) {
    comment.medal = {
      name: medalName,
      level: medalLevel,
      roomId: medalRoomId,
      color: {
        bg: transformColorNumber2String(medalColorStart),
        border: transformColorNumber2String(medalColorBorder),
        level: '#FFFFFF',
        text: '#FFFFFF',
      },
    }
  }

  if (voiceUrl && fileDuration) {
    comment.voiceUrl = voiceUrl
    comment.fileDuration = fileDuration
  }
  if (emojiUrl) {
    comment.emojiUrl = emojiUrl
  }
  if (extra) {
    comment.emots = extra.emots
  }
  return comment
}

const contentMap = {
  1: '进入直播间',
  2: '关注直播间',
  3: '分享直播间',
}
  
export function parseInteract ({ msg, clientId }): MessageInsert {
  if (msg.cmd !== BILI_CMD.INTERACT_WORD_V2) return
  const pb = msg.data?.pb
  if (!pb) return 
  const pbDecoder = state.interactDecoder
  if (!pbDecoder) return 

  const data: InteractV2 = pbDecoder(pb)

  const roomId = data.roomId
  const type = data.type
  const sendAt = data.sendAt
  const userId = data.userId
  const username = data.user?.info?.username
  const usernameColor = data.user?.info?.usernameColor
  const face = data.user?.info?.face
  const medal = data.user?.medal

  const content = `${username} ${contentMap[type]}`
  // if(medal.anchor > 0 && type === 1) {
  //   content = `${username} 光临直播间`
  // }

  const interact: MessageInsert = {
    roomId: String(roomId),
    clientId,
    category: 'interact',
    content,
    type, // 1 进入直播间 2 关注直播间 3 分享直播间
    sendAt: Number(sendAt) * 1000,
    userId: String(userId || ''),
    username,
    usernameColor,
    face,
  }

  if (medal) {
    interact.medal = {
      name: medal.name,
      level: medal.level,
      anchor: medal.anchor,
      color: {
        bg: medal.color5,
        border: medal.color5,
        level: medal.color4, // #FFFFFF
        text: medal.color4, // #FFFFFF
      },
    }
  }

  return interact
}

export function parseGift({ msg, roomId, clientId }): MessageInsert {
  const now = Date.now()
  const RATE = 1000

  if (msg.cmd === BILI_CMD.SUPER_CHAT_MESSAGE || msg.cmd === BILI_CMD.SUPER_CHAT_MESSAGE_JPN) {
    const { uid, price, message, message_jpn, gift, user_info } = msg.data
    const { uname, face, guard_level } = user_info
    const { num, gift_id, gift_name } = gift

    const anchorRole = guard_level
    const roles = [ anchorRole || 0 ]
    const count = num || 1

    return {
      roomId: String(roomId),
      clientId,
      category: 'superchat',
      content: message,
      sendAt: now,
      userId: String(uid || ''),
      username: uname,
      face,
      roles,
      gift: {
        id: gift_id,
        type: 'superchat',
        name: 'superchat',
        price,
        count,
        coinType: 'gold',
        totalPrice: price * count,
        contentJpn: message_jpn,
      },
    }
  }

  if (msg.cmd === BILI_CMD.GUARD_BUY) {
    const { uid, username, guard_level, num, price, gift_id, gift_name } = msg.data

    const anchorRole = guard_level
    const roles = [ anchorRole || 0 ]

    const priceRMB = price / RATE
    const count = num || 1

    return {
      roomId: String(roomId),
      category: 'gift',
      clientId,
      content: `${username} 赠送了 ${String(gift_name)}`,
      sendAt: now,
      userId: String(uid || ''),
      username,
      roles,
      gift: {
        id: String(gift_id),
        type: 'anchor',
        name: String(gift_name),
        price: priceRMB,
        count,
        totalPrice: priceRMB * count,
        coinType: 'gold',
      },
    }
  }

  if (msg.cmd === BILI_CMD.SEND_GIFT) {
    const { uid, num, price, guard_level, giftId, coin_type, uname, face, giftName, batch_combo_id } = msg.data

    const anchorRole = guard_level
    const roles = [ anchorRole || 0 ]
    
    const priceRMB = coin_type === 'gold' ? price / RATE : 0
    const count = num || 1

    return {
      roomId: String(roomId),
      content: `${uname} 赠送了 ${String(giftName)}`,
      clientId,
      category: 'gift',
      sendAt: now,
      userId: String(uid || ''),
      username: uname,
      face,
      roles,
      gift: {
        id: giftId,
        type: 'gift',
        name: String(giftName),
        price: priceRMB,
        count,
        coinType: coin_type,
        totalPrice: priceRMB * count,
        batchComboId: batch_combo_id,
      },
    }
  }
}
