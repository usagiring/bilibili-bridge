import event from './event'
import global from './global'
import { CMDS, EVENTS } from './const'
import wss, { SocketPayload } from './wss'
import { getGiftConfig } from './bilibili-sdk'

event.on(EVENTS.GET_GIFT_CONFIG, async ({ roomId }) => {
  // TODO 
  const result = await getGiftConfig(roomId)
  console.log(result)
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

  const data: SocketPayload = {
    cmd: CMDS.GIFT_CONFIG,
    payload: giftConfigMap
  }
  wss.broadcast(data)
})