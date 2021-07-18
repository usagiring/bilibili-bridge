import { orderBy } from 'lodash'
import cookie from 'cookie'
import event from '../event'
import global from '../global'
import { CMDS, EVENTS } from '../const'
import wss, { SocketPayload } from '../wss'
import giftService from './'
import { sendMessage } from '../bilibili/sdk'
import tts from '../tts'

event.on(EVENTS.GET_GIFT_CONFIG, async ({ roomId }) => {
  const giftConfigMap = giftService.getConfig({ roomId })

  const data: SocketPayload = {
    cmd: CMDS.GIFT_CONFIG,
    payload: giftConfigMap
  }
  wss.broadcast(data)
})

let isReadySpeak = true
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
  if (!roomId || !isConnected || !autoReplyRules || !autoReplyRules.length) return
  const cacheKey = `${uid}:${gift.giftId}`
  if (sendUserCache[cacheKey] && sendUserCache[cacheKey].sendAt > Date.now() - 60 * 1000) return

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

    if (userCookie && rule.isTextReply) {
      const cookies = cookie.parse(userCookie)
      const me = cookies.DedeUserID
      const onlyMyselfRoom = global.get('onlyMyselfRoom')
      const roomUserId = global.get('roomUserId')
      if (onlyMyselfRoom && `${me}` !== `${roomUserId}`) return

      await sendMessage({
        roomId,
        message: text,
      }, userCookie)
    }

    // 读完一条再读下一条
    if (isReadySpeak && rule.isSpeakReply) {
      isReadySpeak = false
      tts(text)
        .then(() => {
          isReadySpeak = true
        })
    }

    // 记录被回复的uid + giftId，一段时间内不再回复
    sendUserCache[cacheKey] = {
      sendAt: Date.now(),
      name: gift.name
    }

    // 已发送不再向下查询
    break
  }
})