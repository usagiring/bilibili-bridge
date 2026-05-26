import event from '../event'
import { CMD, BILI_CMD } from '../const'
import state from '../state'
import wss from '../wss'
import { commentJob, interactJob, giftJob } from './pipeline'
import { LotteryDTO, Model as LotteryModel } from '../../model/lottery'
import { Model as OtherModel } from '../../model/other'
import sse from '../sse'

const saveAllBiliMessage = state.saveAllBiliMessage

event.on(CMD.NINKI, async (data) => {
  const { count, clientId, roomId } = data

  sse.send(clientId, {
    cmd: CMD.NINKI,
    payload: {
      count,
      roomId,
    },
  })
})

event.on(CMD.MESSAGE, async ({ data, roomId, clientId }) => {
  if (Array.isArray(data)) {
    for (const msg of data) {
      if (msg.cmd.includes(BILI_CMD.DANMU_MSG)) {
        await commentJob({ msg, roomId, clientId })
        continue
      }

      if (msg.cmd === BILI_CMD.INTERACT_WORD) {
        await interactJob({ msg, roomId, clientId })
        continue
      }

      if (
        msg.cmd === BILI_CMD.SUPER_CHAT_MESSAGE ||
        msg.cmd === BILI_CMD.SUPER_CHAT_MESSAGE_JPN ||
        msg.cmd === BILI_CMD.GUARD_BUY ||
        msg.cmd === BILI_CMD.SEND_GIFT
      ) {
        await giftJob({ msg, roomId, clientId })
        continue
      }

      if (msg.cmd === BILI_CMD.LIVE) {
        // 直播中
        sse.send(clientId, {
          cmd: CMD.LIVE,
          payload: {
            roomId,
          },
        })
        continue
      }
      if (msg.cmd === BILI_CMD.PREPARING) {
        // 未开播
        sse.send(clientId, {
          cmd: CMD.PREPARING,
          payload: {
            roomId,
          },
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
    if (data.cmd === BILI_CMD.ROOM_REAL_TIME_MESSAGE_UPDATE) {
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