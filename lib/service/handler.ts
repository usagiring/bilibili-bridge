import event from './event'
import { parseCookie } from './util'
import { AutoReplyRule, CMD } from './const'
import { sendMessage, addSilentUser, searchUser } from './bilibili/sdk'
import type { SendMessage } from './bilibili/sdk'
import { getClient } from '../service/client'
import { MessageRow } from '../model/schema.sqlite'
import { sse } from './sse'

const sendRoomCache = new Map()
setInterval(() => {
  sendRoomCache.clear()
}, 60 * 1000 * 10) 

event.on(CMD.AUTO_REPLY, async ({ clientId, message }: { clientId: string; message: MessageRow }) => {
  const clientConfig = getClient(clientId)?.config
  const rule = clientConfig?.autoReplyRule || {}
  const roomId = message.roomId
  if (!roomId) return
  const rules = Object.values(rule).filter(r => r.roomId === message.roomId && r.isEnable)
  if (!rules?.length) return

  rules.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  for (const rule of rules) {
    let text = rule.text
    if (!text) continue

    const isPass = await isPassed({ message, rule, clientId })
    if (!isPass) continue

    // 执行逻辑
    text = text.replace('{user.name}', message.username || '')
    text = text.replace('{user}', message.username || '')

    text = text.replace('{gift.name}', message.gift?.name || '')
    text = text.replace('{gift}', message.gift?.name || '')
    text = text.replace('{gift.count}', message.gift?.count ? `${message.gift.count}` : '')

    text = text.replace('{comment.content}', message.content || '')
    text = text.replace('{comment}', message.content || '')

    text = text.replace('{superchat.content}', message.content || '')
    text = text.replace('{superchat}', message.content || '')

    let isAtUser = false
    if (text.includes('{@user}')) {
      isAtUser = true
      text = text.replace('{@user}', '')
    }

    const actionTags = rule.tags.filter(tag => tag.kind === 'action')
    for (const tag of actionTags) {
      const userCookie = clientConfig?.user?.cookie
      if (tag.key === 'TEXT_REPLY' && userCookie) {
        const cookies = parseCookie(userCookie)
        const me = cookies.DedeUserID

        // 当前Cookie用户不触发，防止无限循环
        if (me === message.userId) return 
        
        const cacheKey = `roomId:${message.roomId}`

        // 一段时间内同一个房间不重复发送，防止触发限流
        const cache = sendRoomCache.get(cacheKey)
        if (cache && cache > Date.now() - 7 * 1000) return 

        // 当前房间主播ID
        const roomUserId = clientConfig.rooms.find(r => r.id === roomId)?.userId

        // 未开启允许所有用户回复 且 非当前直播间主播，不进行操作
        if (!tag.data?.allowAllUserDMReply && `${me}` !== `${roomUserId}`) {
          continue
        }

        // TODO String userId ?
        const data: SendMessage = {
          roomId: Number(roomId),
          message: text,
        }
        if (isAtUser) data.replyMid = Number(message.userId)

        sendMessage(data, userCookie)
        
        sendRoomCache.set(cacheKey, Date.now())
      }

      if (tag.key === 'SPEAK_REPLY') {
        const { voice, speed } = tag.data || {}
        sse.send({ clientId, event: CMD.SPEAK, data: { text, voice, speed } })
      }
    }

    // 匹配到第一条规则之后跳过
    break
  }
})

// 每个条件之间AND关系
async function isPassed({ 
  message,
  rule,
  clientId,
} : {
  message: MessageRow
  rule: AutoReplyRule
  clientId: string
}) {
  if (message.category !== rule.type) return false

  // 如果没有条件，则通过
  const tags = rule.tags?.filter(tag => tag.kind === 'condition')
  if (!tags?.length) return true
  for (const tag of tags) {
    // TODO
    if (tag.key === 'LEVEL') {
      // const { level } = tag.data || {}
      // if(level && lel)
    }
    if (tag.key === 'ROLE') {
      const roles = tag.data?.roles
      if (!roles?.length) return false
      // 如果没有role字段表示无法确定身份，不通过
      if (!message.roles?.length) return false

      const isPass = roles.some(role => message.roles?.includes(role))
      if (!isPass) return false
    }
    if (tag.key === 'FILTER') {
      const filter = tag.data?.filter
      if (!filter || !message.content) return false

      const regexp = new RegExp(filter, 'i')
      const isPass = regexp.test(message.content)
      if (!isPass) return false
    }
    if (tag.key === 'GIFT') {
      if (!message.gift || !message.gift?.id) return false

      const giftIds = tag.data?.giftIds
      if (!giftIds?.length) return false

      const isPass = giftIds.includes(message.gift.id)
      if (!isPass) return false
    }
    if (tag.key === 'MEDAL') {
      if (!message.medal?.name || !message.medal?.level) return false

      const level = message.medal.level
      const minLevel = tag.data?.level || 0

      // 判定牌子等级大于要求等级
      if (level < minLevel) return false

      // 判定牌子属于当前直播间
      let isPass = false
      if (message.medal.roomId) {
        isPass = message.medal.roomId === message.roomId 
      } else if (message.medal.roomUserId) {
        // 礼物只能拿到 roomUserId, 暂不使用
        const clientConfig = getClient(clientId)?.config
        const room = clientConfig.rooms.find(r => r.id === message.roomId)
        const roomUserId = room?.userId
        isPass = message.medal.roomUserId === roomUserId 
      }

      if (!isPass) return false
    }
    if (tag.key === 'PRICE') {
      if (!message.gift || !message.gift?.price) return false
      const minPrice = tag.data?.minPrice || 0
      const totalPrice = message.gift.totalPrice || 0
      const isPass = totalPrice >= minPrice
      if (!isPass) return false
    }
  }

  return true
}

// let muteCommandCache = {}
// setInterval(() => {
//   // TODO
//   muteCommandCache = {}
// }, 60 * 1000 * 10) // 10min

// event.on(CMD.DANMAKU_COMMAND, async (comment) => {
//   const muteCommandSetting = state.get('muteCommandSetting')
//   if (!muteCommandSetting) return
//   const userCookie = state.get('userCookie')
//   if (!userCookie) return
//   const { count, enable, roles, useHintText } = muteCommandSetting
//   if (!enable) return

//   const { content, roomId, isAdmin, role, uid } = comment
//   const keyword = muteCommandSetting.keyword || '#禁言:'
//   if (!content.startsWith(keyword)) return
//   const username = content.replace(keyword, '').trim()
//   // [] = all
//   // [1, 2, 3, admin, owner]
//   // 当前房间主播ID
//   const roomUserId = state.get('roomUserId')
//   const isOwner = roomUserId && `${roomUserId}` === `${uid}`
//   if (
//     roles?.length &&
//     !roles.includes(`${role}`) &&
//     !(isAdmin && roles.includes('admin')) &&
//     !(isOwner && roles.includes('owner'))
//   ) {
//     return
//   }

//   if (muteCommandCache[content] && muteCommandCache[content].expiredAt > new Date().getTime()) {
//     if (!muteCommandCache[content].uids?.[uid]) {
//       muteCommandCache[content].current++
//       muteCommandCache[content].uids[uid] = true
//     }
//   } else {
//     muteCommandCache[content] = {
//       uids: { [uid]: true },
//       expiredAt: new Date().getTime() + 60 * 1000, // 1min
//       current: 1,
//       count,
//       isSendHintText: false,
//     }
//   }

//   const { current: __current, count: __count, isSendHintText } = muteCommandCache[content]
//   if (__current < __count) {
//     // sendHintText()
//     if (!useHintText) return
//     if (isSendHintText) return
//     let hintText = muteCommandSetting.hintText
//     hintText = hintText.replace('{user}', username)
//     hintText = hintText.replace('{count}', __count)
//     sendMessage({
//       roomId,
//       message: hintText,
//     }, userCookie)
//     muteCommandCache[content].isSendHintText = true
//     return
//   }

//   try {
//     const { data } = await searchUser({ name: username }, userCookie)
//     const user = data?.items?.[0]
//     if (!user) return
//     // {
//     //  "uid": 0,
//     //  "face": "",
//     //  "uname": ""
//     // }

//     // 成功与否都返回 {}
//     await addSilentUser({
//       roomId,
//       tuid: user.uid,
//     }, userCookie)

//     wss.broadcast({
//       cmd: CMD.DANMAKU_COMMAND_RESULT,
//       payload: {
//         status: 'success',
//         type: 'mute',
//         message: 'ok',
//         user,
//       },
//     })
//   } catch (e) {
//     wss.broadcast({
//       cmd: CMD.DANMAKU_COMMAND_RESULT,
//       payload: {
//         status: 'failed',
//         type: 'mute',
//         message: (e as Error).message,
//       },
//     })
//   }
// })