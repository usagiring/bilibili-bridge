import event from './event'
import { EVENTS, CMDS } from './const'
import { userDB, commentDB, interactDB, giftDB } from './nedb'
import global from './global'
import { getUserInfo } from './bilibili-sdk'
import wss from './wss'

const realRoomId = global.get('roomId')
const GET_USER_INFO_FREQUENCY_LIMIT = global.get('GET_USER_INFO_FREQUENCY_LIMIT')
const isShowAvatar = global.get('isShowAvatar')

event.on(EVENTS.NINKI, async (data) => {
  const ninkiNumber = data.count
  wss.broadcast({
    cmd: CMDS.NINKI,
    payload: {
      ninkiNumber
    }
  })
})

event.on(EVENTS.DANMAKU, async (data) => {
  if (Array.isArray(data)) {
    const comments = data
      .filter((msg) => msg.cmd === "DANMU_MSG")
      .map(parseComment)

    for (const comment of comments) {
      // console.log(`${comment.name}(${comment.uid}): ${comment.comment}`);

      if (isShowAvatar) {
        // 缓存 user 信息
        let user = await userDB.findOne({ uid: comment.uid })
        if (!user) {
          try {
            const data = await getUserInfoThrottle(comment.uid)
            // 统一格式化用户数据
            user = parseUser(data)
            data.createdAt = new Date()
            userDB.insert(user)
          } catch (e) {
            // throw new Error("getUserInfo limit");
          }
        }

        comment.avatar = ((user || {}) as any).avatar
      }

      const data = await commentDB.insert(comment)
      wss.broadcast({
        cmd: CMDS.COMMENT,
        payload: data
      })
    }

    const interactWords = data
      .filter((msg) => msg.cmd === "INTERACT_WORD")
      .map(parseInteractWord)

    for (const interactWord of interactWords) {
      // console.log(`${interactWord.name}(${interactWord.uid}) 进入了直播间`);
      const data = await interactDB.insert(interactWord)
      wss.broadcast({
        cmd: CMDS.INTERACT,
        payload: data
      })
    }

    const gifts = data.map(parseGift).filter(Boolean)

    for (const gift of gifts) {
      if (!gift.avatar) {
        // 缓存 user 信息
        let user = await userDB.findOne({ uid: gift.uid })
        if (!user) {
          try {
            const data = await getUserInfoThrottle(gift.uid)
            // 统一格式化用户数据
            user = parseUser(data)
            data.createdAt = new Date()
            userDB.insert(user)
          } catch (e) {
            // TODO 全局 errorHandler
            // throw new Error("getUserInfo limit");
          }
        }

        gift.avatar = ((user || {}) as any).avatar
      }

      if (gift.type === "superChat") {
        let data = await giftDB.findOne({
          roomId: realRoomId,
          superChatId: gift.superChatId,
        })

        // 如果找到已存在sc 并且 新sc有JPN信息，需要更新
        if (data) {
          if (gift.commentJPN) {
            data = await giftDB.update(
              { _id: (data as any)._id },
              {
                $set: { commentJPN: gift.commentJPN },
              },
              { returnUpdatedDocs: true }
            )
          } else {
            // 如果新收到的gift不包含JPN信息，表示原数据齐全，直接continue
            continue
          }
        } else {
          data = await giftDB.insert(gift)
        }

        wss.broadcast({
          cmd: CMDS.SUPER_CHAT,
          payload: data
        })
      } else if (gift.type === "gift") {
        let data
        if (gift.batchComboId) {
          const comboGift = <any>await giftDB.findOne({
            roomId: realRoomId,
            batchComboId: gift.batchComboId,
          })
          if (comboGift) {
            data = await giftDB.update(
              { _id: comboGift._id },
              {
                $set: {
                  giftNumber: comboGift.giftNumber + gift.giftNumber,
                },
              },
              { returnUpdatedDocs: true }
            )
          }
        }
        if (!data) {
          data = await giftDB.insert(gift)
        }
        wss.broadcast({
          cmd: CMDS.GIFT,
          payload: data
        })
      }
    }

    data.forEach((msg) => {
      if (msg.cmd === "INTERACT_WORD") return
      if (msg.cmd === "DANMU_MSG") return
      if (msg.cmd === "SEND_GIFT") return
      if (msg.cmd === "LIVE") {
        // 直播中
        wss.broadcast({
          cmd: 'LIVE',
          payload: {}
        })
      }

      if (msg.cmd === "PREPARING") {
        // 未开播
        wss.broadcast({
          cmd: 'PREPARING',
          payload: {}
        })
      }
    })
  } else {
    if (data.cmd === "ROOM_REAL_TIME_MESSAGE_UPDATE") {
      const { fans, fans_club } = data.data
      wss.broadcast({
        cmd: CMDS.ROOM_REAL_TIME_MESSAGE_UPDATE,
        payload: {
          fansNumber: fans,
          fansClubNumber: fans_club
        }
      })
    }
  }
})

export function parseComment(msg) {
  if (msg.cmd !== "DANMU_MSG") return
  const [uid, name, isAdmin] = msg.info[2]
  const [medalLevel, medalName, medalAnchorName, medalRoomId, medalColor, , , medalColorBorder, medalColorStart, medalColorEnd] = msg.info[3]
  const comment = {
    roomId: realRoomId,
    sendAt: msg.info[0][4],
    uid,
    name,
    isAdmin,
    guard: msg.info[7],
    comment: msg.info[1],
    avatar: '',
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

export function parseInteractWord(msg) {
  if (msg.cmd !== "INTERACT_WORD") return
  const { identities, msg_type: msgType, roomid: roomId, score, timestamp, uid, uname: name, uname_color: nameColor, fans_medal } = msg.data
  const interact = {
    identities,
    roomId,
    score,
    msgType, // 1 进入直播间 2 关注直播间 3 分享直播间
    sendAt: timestamp * 1000, // 
    uid,
    name,
    nameColor,
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

export function parseGift(msg) {
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
      roomId: realRoomId,
      sendAt: now,
      // user
      uid,
      name: uname,
      avatar: face,
      guardLevel: guard_level,
      coinType: 'gold',

      // gift
      price: price,
      giftId: gift_id,
      giftName: gift_name,
      giftNumber: num || 1,

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
      roomId: realRoomId,
      sendAt: now,
      uid,
      name: username,
      // face,
      guardLevel: guard_level,
      coinType: 'gold',

      price: price / RATE, // 单价
      giftId: gift_id,
      giftName: gift_name,
      giftNumber: num,

      type: 'gift',
      isGuardGift: true,
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
      roomId: realRoomId,
      sendAt: now,
      uid,
      name: uname,
      avatar: face,
      guardLevel: guard_level,

      batchComboId: batch_combo_id,
      coinType: coin_type,
      price: coin_type === 'gold' ? price / RATE : 0, // 单价
      giftId: giftId,
      giftName: giftName,
      giftNumber: num,

      type: 'gift',
    }
  }
}

export function parseRoomInfo(msg) {
  if (msg.cmd !== "ROOM_REAL_TIME_MESSAGE_UPDATE") return
  const { fans, fans_club: fansClub, room_id: roomId } = msg.data
  return { fans, fansClub, roomId }
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

let isGetUserInfoLocked = false
let isGetUserInfoLocked20min = false
export async function getUserInfoThrottle(uid) {
  if (isGetUserInfoLocked) throw new Error("isGetUserInfoLocked")
  if (isGetUserInfoLocked20min) {
    setTimeout(() => {
      isGetUserInfoLocked20min = false
    }, 1000 * 60 * 20)
    throw new Error('isGetUserInfoLocked 20min')
  }
  // 限制获取头像频率 避免412被封
  // 412 和请求量和速率都有关系，阶段式限流
  isGetUserInfoLocked = true
  setTimeout(() => {
    isGetUserInfoLocked = false
  }, GET_USER_INFO_FREQUENCY_LIMIT || 2000)

  try {
    const { data } = await getUserInfo(uid)
    return data
  } catch (e) {
    if (e.message === 'Request failed with status code 412') {
      isGetUserInfoLocked20min = true
    }
    throw e
  }
}