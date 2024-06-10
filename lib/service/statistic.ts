import jieba from '@node-rs/jieba'
import { dateFormat, parseNumber } from './util'
import { Model as GiftModel } from '../model/gift'
import { Model as CommentModel } from '../model/comment'
import { Model as InteractModel } from '../model/interact'

interface ChartOption {
    times: string[]
    data: number[]
}

interface StatisticResult {
    topSendGiftUser: any
    topCommentUser: any

    totalGold: number
    totalSendGiftUser: number
    totalComment: number

    chart?: ChartOption
}

export default {
    statistic,
    tokenization,
    wordExtract,
    generateCSV,
}

async function statistic({ roomId, start, end }): Promise<StatisticResult> {
    const result: any = {}
    const startDate = new Date(start)
    const endDate = new Date(end)

    const query: any = {
        roomId: Number(roomId),
    }
    if (start) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$gte = startDate.getTime()
    }
    if (end) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$lte = endDate.getTime()
    }

    // --- gift ---
    const giftQuery = {
        ...query,
        coinType: 1,
    }
    const gifts: any[] = await GiftModel.find(giftQuery)
    const userGiftMap = gifts.reduce((map, gift) => {
        gift.totalPrice = (gift.count || 0) * gift.price

        if (map[gift.uid]) {
            map[gift.uid].totalPrice = map[gift.uid].totalPrice + gift.totalPrice
        } else {
            map[gift.uid] = {
                uname: gift.uname,
                totalPrice: gift.totalPrice
            }
        }
        return map
    }, {})
    let totalGold = 0
    let topGold = 0
    let topSendGiftUser = {}
    for (const key in userGiftMap) {
        if (userGiftMap[key].totalPrice > topGold) {
            topSendGiftUser = userGiftMap[key]
            topGold = userGiftMap[key].totalPrice
        }
        totalGold = totalGold + userGiftMap[key].totalPrice
    }

    totalGold = parseNumber(totalGold * 1000)

    result.totalGold = totalGold
    result.topSendGiftUser = topSendGiftUser
    result.totalSendGiftUser = Object.keys(userGiftMap).length

    // --- comment ---
    const comments = await CommentModel.find(
        query,
        { projection: { uid: 1, uname: 1, sendAt: 1 } }
    )
    const userCommentCountMap = comments.reduce((map, comment) => {
        if (map[comment.uid]) {
            map[comment.uid].count++
        } else {
            map[comment.uid] = {
                uname: comment.uname,
                count: 1
            }
        }
        return map
    }, {})

    let topCommentCount = 0
    let topCommentUser = {}
    for (const uid in userCommentCountMap) {
        if (userCommentCountMap[uid].count > topCommentCount) {
            topCommentUser = userCommentCountMap[uid]
            topCommentCount = userCommentCountMap[uid].count
        }
    }

    result.totalComment = comments.length
    result.topCommentUser = topCommentUser

    // for echart 
    const dateDelta = endDate.getTime() - startDate.getTime()
    const tick = Math.ceil(dateDelta / (60 * 1000))
    const times = []
    for (let i = 0; i < tick; i++) {
        const date = new Date(startDate.getTime() + i * 60 * 1000)
        const MM = date.getHours().toString().padStart(2, "0")
        const SS = date.getMinutes().toString().padStart(2, "0")
        times.push(`${MM}:${SS}`)
    }
    const data = new Array(times.length).fill(0)
    for (const comment of comments) {
        // 计算出与开始时间差，除以间隔时间，即index
        const delta = comment.sendAt - startDate.getTime()
        const index = Math.floor(delta / (60 * 1000))
        data[index]++
    }

    result.chart = {}
    result.chart.times = times
    result.chart.data = data

    return result

    // --- interact ---
    // const interacts = await InteractModel.find(
    //     query,
    //     { projection: { uid: 1 } }
    // )
    // const interactUids = interacts.map((interact) => interact.uid)
    // const countMap = commentUids
    //     .concat(giftUids)
    //     .concat(interactUids)
    //     .reduce((map, i) => {
    //         map[i] = 1;
    //         return map;
    //     }, {});
    // this.interactUserCount = Object.keys(countMap).length;
}

async function tokenization({ roomId, start, end }) {
    return
}

async function wordExtract({ roomId, start, end }) {
    const startDate = new Date(start)
    const endDate = new Date(end)

    const query: any = {
        roomId: Number(roomId),
    }
    if (start) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$gte = startDate.getTime()
    }
    if (end) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$lte = endDate.getTime()
    }
    const comments = await CommentModel.find(
        query,
        { projection: { content: 1 } }
    )

    // should save to db ???
    const map = comments.reduce((map, comment) => {
        const keywords = jieba.extract(comment.content, 3)
        keywords.forEach(({ keyword }) => {
            if (map[keyword]) {
                map[keyword]++
            } else {
                map[keyword] = 1
            }
        })
        return map
    }, {})

    return map
}

async function generateCSV({ roomId, start, end }) {
    const startDate = new Date(start)
    const endDate = new Date(end)

    const query: any = {
        roomId: Number(roomId),
    }
    if (start) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$gte = startDate.getTime()
    }
    if (end) {
        query.sendAt = query.sendAt || {}
        query.sendAt.$lte = endDate.getTime()
    }

    // --- gift ---
    const giftQuery = {
        ...query,
        coinType: 1,
    }
    const gifts: any[] = await GiftModel.find(giftQuery)
    // const userGiftMap = gifts.reduce((map, gift) => {
    //     gift.totalPrice = (gift.count || 0) * gift.price

    //     if (map[gift.uid]) {
    //         map[gift.uid].totalPrice = map[gift.uid].totalPrice + gift.totalPrice
    //     } else {
    //         map[gift.uid] = {
    //             uname: gift.uname,
    //             totalPrice: gift.totalPrice
    //         }
    //     }
    //     return map
    // }, {})
    let str = ''
    const header = ['uid', '用户名', '房间号', '礼物名', '礼物数量', '金瓜子', 'sendAt']
    str = str + header.join(',') + '\n'
    gifts.forEach(gift => {
        const line = [
            gift.uid,
            gift.uname,
            gift.roomId,
            gift.name, // getGiftName(gift),
            gift.count,
            parseNumber((gift.price || 0) * (gift.count || 1)),
            dateFormat(gift.sendAt)
        ]
        str = str + line.join(',') + '\n'
    })

    return str

    // function getGiftName(gift) {
    //     const guardMap = {
    //         1: '总督',
    //         2: '提督',
    //         3: '舰长'
    //     }
    //     if (gift.type === 1) {
    //         return gift.name
    //     }
    //     if (gift.type === 2) {
    //         return guardMap[gift.type]
    //     }
    //     if (gift.type === 3) {
    //         return '醒目留言'
    //     }
    // }
}