import global from '../global'
import { getGiftConfig } from '../bilibili/sdk'

export default {
  getConfig
}

export async function getConfig({ roomId }) {
  const result = await getGiftConfig(roomId)
  const gifts = result.data.list

  const giftConfigMap = gifts.reduce((map, gift) => {
    return Object.assign(map, {
      [gift.id]: {
        webp: gift.webp,
        name: gift.name,
        price: gift.price
      }
    })
  }, {})

  global.set('giftConfig', giftConfigMap)
  return giftConfigMap
}