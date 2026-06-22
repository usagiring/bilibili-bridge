import event from '../event'
import { CMD, BILI_CMD } from '../const'
import state from '../state'
import { commentJob, interactJob, giftJob } from './pipeline'
import sse from '../sse'
import { db } from '../db'
import { lotteries } from '../../model/lottery.sqlite'
import * as fs from 'fs'
import path from 'path'

const saveAllBiliMessage = state.saveAllBiliMessage

event.on(CMD.NINKI, async (data) => {
  const { count: ninkiNumber, clientId, roomId } = data

  sse.send({ clientId, event: CMD.NINKI, data: { ninkiNumber, roomId } })
})

event.on(CMD.MESSAGE, async ({ data, roomId, clientId }) => {
  if (Array.isArray(data)) {
    for (const msg of data) {
      if (msg.cmd.includes(BILI_CMD.DANMU_MSG)) {
        await commentJob({ msg, roomId, clientId })
        continue
      }

      if(msg.cmd === BILI_CMD.INTERACT_WORD_V2) {
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
        sse.send({ clientId, event: CMD.LIVE, data: { roomId } })
        continue
      }
      if (msg.cmd === BILI_CMD.PREPARING) {
        // 未开播
        sse.send({ clientId, event: CMD.PREPARING, data: { roomId } })
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
        sse.send({ clientId, event: CMD.ANCHOR_LOT_START, data: {
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
        } })
      }

      if (msg.cmd === BILI_CMD.ANCHOR_LOT_AWARD) {
        const {
          id,
          award_name,
          award_num,
          award_users: awardUsers,
        } = msg.data

        sse.send({ clientId, event: CMD.ANCHOR_LOT_AWARD, data: {
          id,
          awardName: award_name,
          awardNumber: award_num,
          awardUsers,
        } })

        for (const awardUser of awardUsers) {
          await db.insert(lotteries).values({
            uid: awardUser.uid,
            uname: awardUser.uname,
            avatar: awardUser.face,
            awardedAt: Date.now(),
            description: `${award_name} (天选时刻)`,
          })
        }
      }

      if (msg.cmd === BILI_CMD.WATCHED_CHANGE) {
        // {"num":3727,"text_small":"3727","text_large":"3727人看过"}
        const { num: watchedNumber } = msg.data
        sse.send({ clientId, event: CMD.WATCHED_CHANGE, data: { roomId, watchedNumber } })
      }
      if (msg.cmd === BILI_CMD.LIKE_CHANGE) {
        // {"cmd":"LIKE_INFO_V3_UPDATE","data":{"click_count":6291}}
        const { click_count } = msg.data
        sse.send({ clientId, event: CMD.LIKE_CHANGE, data: { roomId, likeNumber: click_count } })
      }

      if (msg.cmd === BILI_CMD.ONLINE_COUNT) {
        const count = msg.data.count || 0
        sse.send({ clientId, event: CMD.ONLINE_COUNT, data: { roomId, onlineNumber: count } })
      }
    }
  } else {
    if (data.cmd === BILI_CMD.ROOM_REAL_TIME_MESSAGE_UPDATE) {
      const { fans, fans_club } = data.data
      sse.send({ clientId, event: CMD.ROOM_REAL_TIME_MESSAGE_UPDATE, data: { roomId, fansNumber: fans, fansclubNumber: fans_club } })
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
    const today = new Date().toISOString().slice(0, 10)
    const dir = path.join(process.cwd(), 'data', 'messages')
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, `${roomId}_${today}.jsonl`)
    fs.appendFileSync(filePath, JSON.stringify({ ts: Date.now(), cmd: Array.isArray(data) ? data[0]?.cmd : data.cmd, roomId, data }) + '\n')
  }
})