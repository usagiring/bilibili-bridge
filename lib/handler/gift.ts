import event from '../service/event'
import global from '../service/global'
import { CMDS, EVENTS } from '../service/const'
import wss, { SocketPayload } from '../service/wss'
import { getGiftConfig } from '../service/bilibili-sdk'

event.on(EVENTS.GET_GIFT_CONFIG, async ({ roomId }) => {
  // TODO 
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

  const data: SocketPayload = {
    cmd: CMDS.GIFT_CONFIG,
    payload: giftConfigMap
  }
  wss.broadcast(data)
})