// import global from '../global'
import { getGiftConfig } from '../bilibili/sdk'
import runtime from '../runtime'

export default {
  getConfig
}

export async function getConfig({ roomId }) {
  const result = await getGiftConfig(roomId)
  const gifts = result.data.list

  const giftMap = gifts.reduce((map, gift) => {
    return Object.assign(map, {
      [gift.id]: {
        webp: gift.webp,
        name: gift.name,
        price: gift.price
      }
    })
  }, {})

  // global.set('giftConfig', giftMap)

  runtime.set(`connectionPoolMap.${roomId}.giftMap`, giftMap)
  return giftMap
}