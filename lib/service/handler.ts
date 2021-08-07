import { orderBy } from 'lodash'
import cookie from 'cookie'
import event from './event'
import global from './global'
import { CMDS, EVENTS } from './const'
import wss, { SocketPayload } from './wss'
// import giftService from './'
import { sendMessage } from './bilibili/sdk'
import tts from './tts'

interface Message {
    type: 'comment' | 'gift' | 'interact' | 'superchat'
    uid: number
    uname: string
    medalName?: string
    role?: number
    content?: string
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
    }
    return result
}

let isReadySpeak = true
// [uid]: { sendAt, name }
let sendUserCache = {}
setInterval(() => {
    sendUserCache = {}
}, 60 * 1000 * 10) // TODO config

event.on(EVENTS.AUTO_REPLY, async (message) => {
    const autoReplyRules = global.get('autoReplyRules')
    const roomId = global.get('roomId')
    const isConnected = global.get('isConnected')
    if (!roomId || !isConnected || !autoReplyRules || !autoReplyRules.length) return

    const cacheKey = message.giftId ? `${message.uid}:${message.giftId}` : `${message.uid}`
    if (sendUserCache[cacheKey] && sendUserCache[cacheKey].sendAt > Date.now() - 60 * 1000) return

    const autoReplyRulesSorted: Rule[] = orderBy(autoReplyRules, ['priority'], ['desc']).filter(rule => rule.type === message.type)
    for (const rule of autoReplyRulesSorted) {
        const isPass = await isPassed(message, rule)
        if (!isPass) continue

        // 执行逻辑
        let text = rule.text
        if (!text) continue
        text = text.replace('{user.name}', message.uname)
        text = text.replace('{gift.name}', message.giftName)
        text = text.replace('{comment.content}', message.content)
        text = text.replace('{superchat.content}', message.content)

        for (const tag of rule.tags) {
            const userCookie = global.get('userCookie')
            if (tag.key === 'TEXT_REPLY' && userCookie) {
                const roomId = global.get('roomId')
                const cookies = cookie.parse(userCookie)
                const me = cookies.DedeUserID

                // 当前房间主播ID
                const roomUserId = global.get('roomUserId')

                // 仅在自己直播间生效
                if (`${me}` !== `${roomUserId}`) continue

                sendMessage({
                    roomId,
                    message: text,
                }, userCookie)

                // 记录被回复的uid，一段时间内不再回复
                sendUserCache[cacheKey] = {
                    sendAt: Date.now(),
                    name: message.uname
                }
            }

            if (tag.key === 'SPEAK_REPLY' && isReadySpeak) {
                isReadySpeak = false
                const { voice, speed } = tag.data
                tts(text, {
                    voice,
                    speed
                })
                    .then(() => {
                        isReadySpeak = true
                    })

                // 记录被回复的uid，一段时间内不再回复
                sendUserCache[cacheKey] = {
                    sendAt: Date.now(),
                    name: message.uname
                }
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
            if (!filter && message.content) {
                const regexp = new RegExp(filter)
                if (!regexp.test(message.content)) {
                    return false
                }
            }
        }
        if (tag.key === 'GIFT') {
            if(!Number.isFinite(message.giftId)) return false
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