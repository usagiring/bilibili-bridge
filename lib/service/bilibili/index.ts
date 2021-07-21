import { Comment } from '../../model/comment'
import { Gift } from '../../model/gift'
import { Interact } from '../../model/interact'
import global from '../global'

export default {
  parseComment,
  parseInteractWord,
  parseGift,
  parseUser
}


export function parseComment(msg): Comment {
  if (!~msg.cmd.indexOf("DANMU_MSG")) return
  const [uid, name, isAdmin] = msg.info[2]
  const [medalLevel, medalName, medalAnchorName, medalRoomId, medalColor, , , medalColorBorder, medalColorStart, medalColorEnd] = msg.info[3]
  const comment = {
    roomId: global.get('roomId'),
    sendAt: msg.info[0][4],
    uid,
    uname: name,
    isAdmin,
    role: msg.info[7],
    comment: msg.info[1],
  }
  if (medalLevel && medalName) {
    Object.assign(comment, {
      medalLevel,
      medalName,
      medalRoomId,
      medalColorBorder: `#${medalColorBorder.toString(16).padStart(6, '0')}`,
      medalColorStart: `#${medalColorStart.toString(16).padStart(6, '0')}`,
      medalColorEnd: `#${medalColorEnd.toString(16).padStart(6, '0')}`,
    })
  }
  return comment
}

export function parseInteractWord(msg): Interact {
  if (msg.cmd !== "INTERACT_WORD") return
  const { identities, msg_type: msgType, roomid: roomId, score, timestamp, uid, uname, uname_color: unameColor, fans_medal } = msg.data
  const interact = {
    identities,
    roomId,
    score,
    msgType, // 1 进入直播间 2 关注直播间 3 分享直播间
    sendAt: timestamp * 1000, // 
    uid,
    uname,
    unameColor: unameColor,
  }
  if (fans_medal && fans_medal.medal_name) {
    const { guard_level, medal_color_border, medal_color_end, medal_color_start, medal_level, medal_name } = fans_medal
    Object.assign(interact, {
      // medalGuardLevel: guard_level,
      medalLevel: medal_level,
      medalName: medal_name,
      medalColorBorder: `#${medal_color_border.toString(16).padStart(6, '0')}`,
      medalColorStart: `#${medal_color_start.toString(16).padStart(6, '0')}`,
      medalColorEnd: `#${medal_color_end.toString(16).padStart(6, '0')}`,
    })
  }
  return interact
}

export function parseGift(msg): Gift {
  const now = Date.now()
  const RATE = 1000

  if (msg.cmd === 'SUPER_CHAT_MESSAGE' || msg.cmd === 'SUPER_CHAT_MESSAGE_JPN') {
    const {
      uid,
      price,
      message,
      message_jpn,
      gift,
      user_info,
      id,
    } = msg.data
    const {
      uname,
      face,
      guard_level
    } = user_info
    const {
      num,
      gift_id,
      gift_name
    } = gift
    return {
      roomId: global.get('roomId'),
      sendAt: now,
      // user
      uid,
      uname: uname,
      avatar: face,
      role: guard_level,
      coinType: 'gold',

      // gift
      price: price,
      id: gift_id,
      name: gift_name,
      count: num || 1,

      // sc
      superChatId: `${id}`,
      type: 'superChat',
      comment: message,
      commentJPN: message_jpn,
    }
  }

  if (msg.cmd === 'GUARD_BUY') {
    const {
      uid,
      username,
      guard_level,
      num,
      price,
      gift_id,
      gift_name
    } = msg.data

    return {
      roomId: global.get('roomId'),
      sendAt: now,
      uid,
      uname: username,

      role: guard_level,
      coinType: 'gold',

      price: price / RATE, // 单价
      id: gift_id,
      name: gift_name,
      count: num,

      type: 'guard',
    }
  }

  if (msg.cmd === 'SEND_GIFT') {
    const {
      uid,
      num,
      price,
      guard_level,
      giftId,
      coin_type,
      uname,
      face,
      giftName,
      batch_combo_id
    } = msg.data
    return {
      roomId: global.get('roomId'),
      sendAt: now,
      uid,
      uname: uname,
      avatar: face,
      role: guard_level,

      batchComboId: batch_combo_id,
      coinType: coin_type,
      price: coin_type === 'gold' ? price / RATE : 0, // 单价
      id: giftId,
      name: giftName,
      count: num,

      type: 'gift',
    }
  }
}

export function parseUser(data) {
  return {
    uid: data.mid,
    name: data.name,
    avatar: data.face,
    sex: data.sex,
    level: data.level,
  }
}
