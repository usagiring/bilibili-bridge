import { orderBy } from 'lodash'
import cookie from 'cookie'
import event from './event'
import global from './state'
import { CMDS, EVENTS } from './const'
// import giftService from './'
import { sendMessage, addSilentUser, searchUser } from './bilibili/sdk'
import type { SendMessage } from './bilibili/sdk'
// import tts from './tts'
import wss from './wss'

interface Message {
    type: 'comment' | 'gift' | 'interact' | 'superchat'
    uid: number
    uname: string
    medalName?: string
    role?: number
    content?: string
    coinType?: string
    giftId?: string
    giftName?: string
}

interface Rule {
    type: 'comment' | 'gift' | 'interact' | 'superchat'
    text: string
    enable: boolean
    priority: number
    tags: Tag[]
}

interface Tag {
    id: number
    key: 'LEVEL' | 'ROLE' | 'FILTER' | 'GIFT' | 'MEDAL' | 'GOLD' | 'SILVER' | 'TEXT_REPLY' | 'SPEAK_REPLY'
    name: string
    content: string
    data?: { [x: string]: any }
}

export function parseAutoReplyMessage(message, type): Message {
    const result: Message = {
        type: type,
        content: message.content,
        uid: message.uid,
        uname: message.uname,
        role: message.role,
        medalName: message.medalName,
    }
    if (type === 'gift') {
        result.giftId = message.id
        result.giftName = message.name
        result.coinType = message.coinType
    }
    return result
}

// let isReadySpeak = true
// [uid]: { sendAt, name }
// let sendUserCache = {}
// setInterval(() => {
//     sendUserCache = {}
// }, 60 * 1000 * 10) // TODO config

event.on(EVENTS.AUTO_REPLY, async (message: Message) => {
    const autoReplyRules = global.get('autoReplyRules')
    const roomId = global.get('roomId')
    const isConnected = global.get('isConnected')
    if (!roomId || !isConnected || !autoReplyRules || !autoReplyRules.length) return

    // const cacheKey = message.giftId ? `${message.uid}:${message.giftId}` : `${message.uid}`
    // if (sendUserCache[cacheKey] && sendUserCache[cacheKey].sendAt > Date.now() - 60 * 1000) return

    const autoReplyRulesSorted: Rule[] = orderBy(autoReplyRules, ['priority'], ['desc']).filter(rule => rule.type === message.type)
    for (const rule of autoReplyRulesSorted) {
        const isPass = await isPassed(message, rule)
        if (!isPass) continue

        // 执行逻辑
        let text = rule.text
        if (!text) continue
        text = text.replace('{user.name}', message.uname)
        text = text.replace('{user}', message.uname)

        text = text.replace('{gift.name}', message.giftName)
        text = text.replace('{gift}', message.giftName)

        text = text.replace('{comment.content}', message.content)
        text = text.replace('{comment}', message.content)

        text = text.replace('{superchat.content}', message.content)
        text = text.replace('{superchat}', message.content)

        let isAtUser = false
        if (text.includes('{@user}')) {
            isAtUser = true
            text = text.replace('{@user}', '')
        }

        for (const tag of rule.tags) {
            const userCookie = global.get('userCookie')
            if (tag.key === 'TEXT_REPLY' && userCookie) {
                const roomId = global.get('roomId')
                const cookies = cookie.parse(userCookie)
                const me = cookies.DedeUserID

                // 当前房间主播ID
                const roomUserId = global.get('roomUserId')

                // 仅在自己直播间生效 或者 开启所有用户回复设置
                if (tag.data?.allowAllUserDanmakuReply || `${me}` === `${roomUserId}`) {
                    // do nothing
                } else {
                    continue
                }

                const data: SendMessage = {
                    roomId,
                    message: text,
                }
                if (isAtUser) {
                    data.replyMid = message.uid
                }
                sendMessage(data, userCookie)

                // 记录被回复的uid，一段时间内不再回复
                // sendUserCache[cacheKey] = {
                //     sendAt: Date.now(),
                //     name: message.uname
                // }
            }

            // if (tag.key === 'SPEAK_REPLY' && isReadySpeak) {
            //     isReadySpeak = false
            //     const { voice, speed } = tag.data
            //     tts(text, {
            //         voice,
            //         speed
            //     })
            //         .then(() => {
            //             isReadySpeak = true
            //         })

            //     // 记录被回复的uid，一段时间内不再回复
            //     sendUserCache[cacheKey] = {
            //         sendAt: Date.now(),
            //         name: message.uname
            //     }
            // }

            if (tag.key === 'SPEAK_REPLY') {
                const { voice, speed } = tag.data
                wss.broadcast({
                    cmd: CMDS.SPEAK,
                    payload: {
                        text,
                        voice,
                        speed,
                    }
                })
            }
        }

        // 匹配到第一条规则之后跳过
        break
    }
})


async function isPassed(message, rule) {
    if (!rule.enable) return false
    for (const tag of rule.tags) {
        if (tag.key === 'LEVEL') {
            // const { level } = tag.data || {}
            // if(level && lel)
        }
        if (tag.key === 'ROLE') {
            const { roles } = tag.data || {}
            // 如果没有role字段表示无法确定身份，不通过
            if (!Number.isFinite(message.role)) return false
            if (roles && roles.length && !roles.includes(message.role)) {
                return false
            }
        }
        if (tag.key === 'FILTER') {
            const { filter } = tag.data || {}
            if (filter && message.content) {
                const regexp = new RegExp(filter)
                if (!regexp.test(message.content)) {
                    return false
                }
            }
        }
        if (tag.key === 'GIFT') {
            if (!Number.isFinite(message.giftId)) return false
            const { giftIds } = tag.data || {}
            if (giftIds && giftIds.length && Number.isFinite(message.giftId)) {
                if (!giftIds.includes(`${message.giftId}`)) {
                    return false
                }
            }
        }
        if (tag.key === 'MEDAL') {
            if (!message.medalName) return false
            const medalName = global.get('medalName')
            if (message.medalName !== medalName) {
                return false
            }
        }
        if (tag.key === 'GOLD') {
            if (message.coinType !== 1) {
                return false
            }
        }
        if (tag.key === 'SILVER') {
            if (message.coinType !== 2) {
                return false
            }
        }
    }

    return true
}

let muteCommandCache = {}
setInterval(() => {
    // TODO
    muteCommandCache = {}
}, 60 * 1000 * 10) // 10min

event.on(EVENTS.DANMAKU_COMMAND, async (comment) => {
    const muteCommandSetting = global.get('muteCommandSetting')
    if (!muteCommandSetting) return
    const userCookie = global.get('userCookie')
    if (!userCookie) return
    const { count, enable, roles, useHintText } = muteCommandSetting
    if (!enable) return

    const { content, roomId, isAdmin, role, uid } = comment
    const keyword = muteCommandSetting.keyword || '#禁言:'
    if (!content.startsWith(keyword)) return
    const username = content.replace(keyword, '').trim()
    // [] = all
    // [1, 2, 3, admin, owner]
    // 当前房间主播ID
    const roomUserId = global.get('roomUserId')
    const isOwner = roomUserId && `${roomUserId}` === `${uid}`
    if (
        roles?.length &&
        !roles.includes(`${role}`) &&
        !(isAdmin && roles.includes('admin')) &&
        !(isOwner && roles.includes('owner'))
    ) {
        return
    }

    if (muteCommandCache[content] && muteCommandCache[content].expiredAt > new Date().getTime()) {
        if (!muteCommandCache[content].uids?.[uid]) {
            muteCommandCache[content].current++
            muteCommandCache[content].uids[uid] = true
        }
    } else {
        muteCommandCache[content] = {
            uids: { [uid]: true },
            expiredAt: new Date().getTime() + 60 * 1000, // 1min
            current: 1,
            count: count,
            isSendHintText: false
        }
    }

    const { current: __current, count: __count, isSendHintText } = muteCommandCache[content]
    if (__current < __count) {
        // sendHintText()
        if (!useHintText) return
        if (isSendHintText) return
        let hintText = muteCommandSetting.hintText
        hintText = hintText.replace('{user}', username)
        hintText = hintText.replace('{count}', __count)
        sendMessage({
            roomId,
            message: hintText,
        }, userCookie)
        muteCommandCache[content].isSendHintText = true
        return
    }

    try {
        const { data } = await searchUser({ name: username }, userCookie)
        const user = data?.items?.[0]
        if (!user) return
        // {
        //  "uid": 0,
        //  "face": "",
        //  "uname": ""
        // }

        // 成功与否都返回 {}
        await addSilentUser({
            roomId,
            tuid: user.uid,
        }, userCookie)

        wss.broadcast({
            cmd: CMDS.DANMAKU_COMMAND_RESULT,
            payload: {
                status: 'success',
                type: 'mute',
                message: 'ok',
                user
            }
        })
    } catch (e) {
        wss.broadcast({
            cmd: CMDS.DANMAKU_COMMAND_RESULT,
            payload: {
                status: 'failed',
                type: 'mute',
                message: e.message,
            }
        })
    }
})