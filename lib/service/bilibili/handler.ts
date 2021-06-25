import event from '../event'
import { EVENTS, CMDS, BILI_CMDS } from '../const'
import { userDB, commentDB, interactDB, giftDB, lotteryDB, otherDB } from '../nedb'
import global from '../global'
import { getUserInfo } from './sdk'
import wss from '../wss'
import { parseComment, parseGift, parseInteractWord, parseUser } from './'

const GET_USER_INFO_FREQUENCY_LIMIT = global.get('GET_USER_INFO_FREQUENCY_LIMIT')
const SAVE_ALL_BILI_MESSAGE = global.get('SAVE_ALL_BILI_MESSAGE')

event.on(EVENTS.NINKI, async (data) => {
  const ninkiNumber = data.count
  wss.broadcast({
    cmd: CMDS.NINKI,
    payload: {
      ninkiNumber
    }
  })
})

event.on(EVENTS.MESSAGE, async (data) => {
  if (Array.isArray(data)) {
    for (const msg of data) {
      if (~msg.cmd.indexOf("DANMU_MSG")) {
        const comment = parseComment(msg)
        await commentJob(comment)
        continue
      }

      if (msg.cmd === "INTERACT_WORD") {
        const interact = parseInteractWord(msg)
        await interactJob(interact)
        continue
      }

      if (
        msg.cmd === 'SUPER_CHAT_MESSAGE' ||
        msg.cmd === 'SUPER_CHAT_MESSAGE_JPN' ||
        msg.cmd === 'GUARD_BUY' ||
        msg.cmd === 'SEND_GIFT'
      ) {
        const gift = parseGift(msg)
        await giftJob(gift)
        continue
      }

      if (msg.cmd === "LIVE") {
        // 直播中
        wss.broadcast({
          cmd: 'LIVE',
          payload: {}
        })
        continue
      }
      if (msg.cmd === "PREPARING") {
        // 未开播
        wss.broadcast({
          cmd: 'PREPARING',
          payload: {}
        })
        continue
      }

      if (msg.cmd === BILI_CMDS.ANCHOR_LOT_START) {
        const {
          award_name, // description
          award_num,
          danmu,
          gift_id,
          gift_name,
          gift_num,
          gift_price, // 金瓜子
          id,
          max_time,
          room_id,
        } = msg.data
        wss.broadcast({
          cmd: CMDS.ANCHOR_LOT_START,
          payload: {
            id: id,
            roomId: room_id,
            awardName: award_name,
            awardNumber: award_num,
            danmaku: danmu,
            giftId: gift_id,
            giftName: gift_name,
            giftNumber: gift_num,
            giftPrice: gift_price,
            maxTime: max_time,
          }
        })
      }

      if (msg.cmd === BILI_CMDS.ANCHOR_LOT_AWARD) {
        const {
          id,
          award_name,
          award_num,
          award_users: awardUsers,
        } = msg.data

        wss.broadcast({
          cmd: CMDS.ANCHOR_LOT_AWARD,
          payload: {
            id: id,
            awardName: award_name,
            awardNumber: award_num,
            awardUsers
          }
        })

        for (const awardUser of awardUsers) {
          await lotteryDB.insert(Object.assign({}, awardUser, {
            time: Date.now(),
            description: `${award_name} (天选时刻)`
          }))
        }
      }

      if (SAVE_ALL_BILI_MESSAGE) {
        await otherDB.insert({ raw: msg, format: 'array' })
      }
    }
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
      return
    }

    if (SAVE_ALL_BILI_MESSAGE) {
      await otherDB.insert({ raw: data, format: 'item' })
    }
  }
})

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

async function commentJob(comment) {
  // console.log(`${comment.name}(${comment.uid}): ${comment.comment}`);
  if (global.get('isShowAvatar')) {
    await fillUserAvatar(comment)
  }

  const data = await commentDB.insert(comment)
  wss.broadcast({
    cmd: CMDS.COMMENT,
    payload: data
  })
}

async function interactJob(interact) {
  // console.log(`${interactWord.name}(${interactWord.uid}) 进入了直播间`);
  const data = await interactDB.insert(interact)
  wss.broadcast({
    cmd: CMDS.INTERACT,
    payload: data
  })
}

async function giftJob(gift) {
  if (!gift.avatar) {
    await fillUserAvatar(gift)
  }

  if (gift.type === "superChat") {
    let sc = await giftDB.findOne({
      roomId: global.get('roomId'),
      superChatId: gift.superChatId,
    })

    // 如果找到已存在sc 并且 新sc有JPN信息，需要更新
    if (sc) {
      if (gift.commentJPN) {
        sc = await giftDB.update(
          { _id: sc._id },
          {
            $set: { commentJPN: gift.commentJPN },
          },
          { returnUpdatedDocs: true }
        )
      } else {
        // 如果新收到的gift不包含JPN信息，表示原数据齐全，跳过
        return
      }
    } else {
      sc = await giftDB.insert(gift)
    }

    wss.broadcast({
      cmd: CMDS.SUPER_CHAT,
      payload: sc
    })
  } else if (gift.type === "gift") {
    let data
    if (gift.batchComboId) {
      const comboGift = await giftDB.findOne({
        roomId: global.get('roomId'),
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
    if (global.get('isAutoReply')) {
      event.emit(EVENTS.AUTO_REPLY, data)
    }
  }
}

async function fillUserAvatar(item) {
  if (!item.uid) return item
  // 缓存 user 信息
  let user = await userDB.findOne({ uid: item.uid })
  if (!user) {
    try {
      const data = await getUserInfoThrottle(item.uid)
      // 统一格式化用户数据
      user = parseUser(data)
      data.createdAt = new Date()
      userDB.insert(user)
    } catch (e) {
      // throw new Error("getUserInfo limit");
    }
  }

  item.avatar = (user || {}).avatar
  return item
}