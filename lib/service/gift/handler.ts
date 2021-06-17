import { orderBy } from 'lodash'
import event from '../event'
import global from '../global'
import { CMDS, EVENTS } from '../const'
import wss, { SocketPayload } from '../wss'
import giftService from './'
import { sendMessage } from '../bilibili/sdk'

event.on(EVENTS.GET_GIFT_CONFIG, async ({ roomId }) => {
  const giftConfigMap = giftService.getConfig({ roomId })

  const data: SocketPayload = {
    cmd: CMDS.GIFT_CONFIG,
    payload: giftConfigMap
  }
  wss.broadcast(data)
})


// [uid]: { sendAt, name }
let sendUserCache = {}
setInterval(() => {
  sendUserCache = {}
}, 60 * 1000 * 10)
event.on(EVENTS.AUTO_REPLY, async (gift) => {
  const userCookie = global.get('userCookie')
  const autoReplyRules = global.get('autoReplyRules')
  const roomId = global.get('roomId')
  const isConnected = global.get('isConnected')
  const uid = gift.uid
  if (!userCookie || !roomId || !isConnected || !autoReplyRules || !autoReplyRules.length) return
  if (sendUserCache[uid] && sendUserCache[uid].sendAt > Date.now() - 60 * 1000) return

  const autoReplyRulesSorted = orderBy(autoReplyRules, ['priority'], ['desc'])
  for (const rule of autoReplyRulesSorted) {
    // 条件校验
    if (rule.giftId && `${gift.giftId}` !== `${rule.giftId}`) continue
    if (rule.giftNumber && gift.giftNumber <= rule.giftNumber) continue
    if (rule.onlyGold && gift.coinType !== 'gold') continue

    // 所有条件通过，发送消息
    // 解析文本
    let text = rule.text
    if (!text) break
    text = text.replace('{user.name}', gift.name)
    text = text.replace('{gift.name}', gift.giftName)
    await sendMessage({
      roomId,
      message: text,
    }, userCookie)
    // 已发送不再向下查询

    // 记录被回复的uid，一段时间内不再回复
    sendUserCache[uid] = {
      sendAt: Date.now(),
      name: gift.name
    }
    break
  }
})