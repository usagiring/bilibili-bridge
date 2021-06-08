import event from '../event'
import { EVENTS, CMDS } from '../const'
import { userDB, commentDB, interactDB, giftDB } from '../nedb'
import global from '../global'
import { getUserInfo } from './sdk'
import wss from '../wss'
import { parseComment, parseGift, parseInteractWord, parseUser } from './'

const GET_USER_INFO_FREQUENCY_LIMIT = global.get('GET_USER_INFO_FREQUENCY_LIMIT')

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
      .filter((msg) => ~msg.cmd.indexOf("DANMU_MSG"))
      .map(parseComment)

    for (const comment of comments) {
      // console.log(`${comment.name}(${comment.uid}): ${comment.comment}`);

      if (global.get('isShowAvatar')) {
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
          roomId: global.get('roomId'),
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
      }
    }

    data.forEach((msg) => {
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