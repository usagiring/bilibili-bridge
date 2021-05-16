import global from '../service/global'
import { getGiftConfig } from '../service/bilibili-sdk'
import path from 'path'
import fs from 'fs'

const routes = [
    {
        verb: 'get',
        uri: '/gifts/config',
        middlewares: [get],
    },
    {
        verb: 'put',
        uri: '/gifts/refresh',
        middlewares: [refresh],
        validator: {
            type: 'object',
            properties: {
                roomId: { type: 'number' }
            }
        }
    }
]

async function get(ctx) {
    ctx.body = global.get('giftConfig')
}

async function refresh(ctx) {
    const { roomId } = ctx.__body
    const giftConfig = await getGiftConfig(roomId || 1)

    const giftConfigMap = giftConfig.reduce((map, gift) => {
        return Object.assign(map, {
            [gift.id]: {
                webp: gift.webp,
                name: gift.name,
                price: gift.price
            }
        })
    }, {})
    const cwd = global.get('cwd')
    fs.writeFileSync(path.join(cwd, 'gift_config'), JSON.stringify(giftConfigMap))
}


export default routes