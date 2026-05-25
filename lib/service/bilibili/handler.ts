import dayjs from 'dayjs'
import event from '../event'
import { EVENT, CMD, BILI_CMD } from '../const'
import state from '../state'
import { getUserInfo } from './sdk'
import wss from '../wss'
import { parseComment, parseGift, parseInteractWord, parseUser } from './'
import { parseAutoReplyMessage } from '../handler'
import { GiftDTO, Model as GiftModel } from '../../model/gift'
import { CommentDTO, Model as CommentModel } from '../../model/comment'
import { UserDTO, Model as UserModel } from '../../model/user'
import { InteractDTO, Model as InteractModel } from '../../model/interact'
import { LotteryDTO, Model as LotteryModel } from '../../model/lottery'
import { Model as OtherModel } from '../../model/other'

const userInfoFrequencyLimit = state.userInfoFrequencyLimit
const saveAllBiliMessage = state.saveAllBiliMessage

event.on(EVENT.NINKI, async (data) => {
  const ninkiNumber = data.count
  wss.broadcast({
    cmd: CMD.NINKI,
    payload: {
      ninkiNumber,
    },
  })
})

event.on(EVENT.MESSAGE, async ({ data, roomId }) => {
  if (Array.isArray(data)) {
    for (const msg of data) {
      if (~msg.cmd.indexOf("DANMU_MSG")) {
        const comment = parseComment(msg, roomId)
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
        const gift = parseGift(msg, roomId)
        await giftJob(gift)
        continue
      }

      if (msg.cmd === "LIVE") {
        // 直播中
        wss.broadcast({
          cmd: 'LIVE',
          payload: {},
        })
        continue
      }
      if (msg.cmd === "PREPARING") {
        // 未开播
        wss.broadcast({
          cmd: 'PREPARING',
          payload: {},
        })
        continue
      }

      if (msg.cmd === BILI_CMD.ANCHOR_LOT_START) {
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
          cmd: CMD.ANCHOR_LOT_START,
          payload: {
            id,
            roomId: room_id,
            awardName: award_name,
            awardNumber: award_num,
            danmaku: danmu,
            giftId: gift_id,
            giftName: gift_name,
            giftNumber: gift_num,
            giftPrice: gift_price,
            maxTime: max_time,
          },
        })
      }

      if (msg.cmd === BILI_CMD.ANCHOR_LOT_AWARD) {
        const {
          id,
          award_name,
          award_num,
          award_users: awardUsers,
        } = msg.data

        wss.broadcast({
          cmd: CMD.ANCHOR_LOT_AWARD,
          payload: {
            id,
            awardName: award_name,
            awardNumber: award_num,
            awardUsers,
          },
        })

        for (const awardUser of awardUsers) {
          const lotteryData: LotteryDTO = {
            uid: awardUser.uid,
            uname: awardUser.uname,
            avatar: awardUser.face,
            awardedAt: Date.now(),
            description: `${award_name} (天选时刻)`,
          }
          await LotteryModel.insert(lotteryData)
        }
      }

      if (msg.cmd === BILI_CMD.WATCHED_CHANGE) {
        // {"num":3727,"text_small":"3727","text_large":"3727人看过"}
        const { num } = msg.data
        wss.broadcast({
          cmd: CMD.WATCHED_CHANGE,
          payload: {
            watchedNumber: num,
          },
        })
      }
      if (msg.cmd === BILI_CMD.LIKE_CHANGE) {
        // {"cmd":"LIKE_INFO_V3_UPDATE","data":{"click_count":6291}}
        const { click_count } = msg.data
        wss.broadcast({
          cmd: CMD.LIKE_CHANGE,
          payload: {
            likeNumber: click_count,
          },
        })
      }

      if (msg.cmd === BILI_CMD.ONLINE_COUNT) {
        const count = msg.data.count || 0
        wss.broadcast({
          cmd: CMD.ONLINE_COUNT,
          payload: {
            onlineNumber: count,
          },
        })
      }
    }
  } else {
    if (data.cmd === "ROOM_REAL_TIME_MESSAGE_UPDATE") {
      const { fans, fans_club } = data.data
      wss.broadcast({
        cmd: CMD.ROOM_REAL_TIME_MESSAGE_UPDATE,
        payload: {
          fansNumber: fans,
          fansClubNumber: fans_club,
        },
      })
    }

    // if (data.cmd === BILI_CMDS.LOG_IN_NOTICE) {
    //   wss.broadcast({
    //     cmd: CMDS.LOG_IN_NOTICE,
    //   })
    //   const bilibiliWSClient = global.getInner('bilibiliWSClient')
    //   if (bilibiliWSClient) {
    //     bilibiliWSClient.reconnect()
    //   }
    // }
  }

  if (saveAllBiliMessage) {
    OtherModel.insert({ raw: data })
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
  }, userInfoFrequencyLimit || 2000)

  try {
    const { data } = await getUserInfo(uid)
    if (!data.mid) throw new Error('user data error')
    return data
  } catch (e) {
    if ((e as Error).message === 'Request failed with status code 412') {
      isGetUserInfoLocked20min = true
    }
    throw e
  }
}

async function commentJob(comment: CommentDTO) {
  // console.log(`${comment.name}(${comment.uid}): ${comment.comment}`);
  // if (global.get('isShowAvatar')) {
  //   await fillUserAvatar(comment)
  // }

  wss.broadcast({
    cmd: CMD.COMMENT,
    payload: comment,
  })

  event.emit(EVENT.AUTO_REPLY, parseAutoReplyMessage(comment, 'comment'))
  event.emit(EVENT.DANMAKU_COMMAND, comment)

  // TODO cloneDeep
  CommentModel.insert(comment)
    .catch(e => console.error(e))
}

async function interactJob(interact: InteractDTO) {
  // console.log(`${interactWord.name}(${interactWord.uid}) 进入了直播间`);
  const data = await InteractModel.insert(interact)
  wss.broadcast({
    cmd: CMD.INTERACT,
    payload: data,
  })

  event.emit(EVENT.AUTO_REPLY, parseAutoReplyMessage(data, 'interact'))
}

async function giftJob(gift: GiftDTO) {
  if (!gift.avatar) {
    await fillUserAvatar(gift)
  }

  if (gift.type === 3) {
    let sc = await GiftModel.findOne({
      roomId: gift.roomId,
      SCId: gift.SCId,
    })

    // 如果找到已存在sc 并且 新sc有JPN信息，需要更新
    if (sc) {
      if (gift.content) {
        sc = await GiftModel.update(
          { _id: sc._id },
          {
            $set: { contentJPN: gift.contentJPN },
          },
          { returnUpdatedDocs: true },
        )
      } else {
        // 如果新收到的gift不包含JPN信息，表示原数据齐全，跳过
        return
      }
    } else {
      sc = await GiftModel.insert(gift)
    }

    wss.broadcast({
      cmd: CMD.SUPER_CHAT,
      payload: sc,
    })

    event.emit(EVENT.AUTO_REPLY, parseAutoReplyMessage(sc, 'superchat'))
  } else if (gift.type === 1 || gift.type === 2) {
    let data
    // 辣条
    // fix: 辣条没有 batchComboId 导致无法正常堆叠
    if (gift.id === 1) {
      // batch:gift:combo_id:{uid}:{giftId}:{roomId}:{startOfMinute} 
      gift.batchComboId = `batch:gift:combo_id:${gift.uid}:${gift.id}:${gift.roomId}:${dayjs().startOf('minute').valueOf()}`
    }

    if (gift.batchComboId) {
      const comboGift = await GiftModel.findOne({
        roomId: gift.roomId,
        batchComboId: gift.batchComboId,
      })
      if (comboGift) {
        data = await GiftModel.update(
          { _id: comboGift._id },
          {
            $set: {
              count: comboGift.count + gift.count,
            },
          },
          { returnUpdatedDocs: true },
        )
      }
    }
    if (!data) {
      data = await GiftModel.insert(gift)
    }
    wss.broadcast({
      cmd: CMD.GIFT,
      payload: {
        ...data,
        singleCount: gift.count,
      },
    })

    event.emit(EVENT.AUTO_REPLY, parseAutoReplyMessage(data, 'gift'))
  }
}

async function fillUserAvatar(item): Promise<UserDTO> {
  if (!item.uid) return item
  // 缓存 user 信息
  let user = await UserModel.findOne({ uid: item.uid })
  if (!user) {
    try {
      const data = await getUserInfoThrottle(item.uid)
      // 统一格式化用户数据
      user = parseUser(data)
      // data.createdAt = new Date()
      UserModel.insert(user)
    } catch (e) {
      // throw new Error("getUserInfo limit");
    }
  }

  item.avatar = (user || {}).avatar
  return item
}