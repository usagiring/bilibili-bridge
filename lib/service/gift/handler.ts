import event from '../event'
import { CMDS, EVENTS } from '../const'
import wss, { SocketPayload } from '../wss'
import giftService from './'

event.on(EVENTS.GET_GIFT_CONFIG, async ({ roomId }) => {
  const giftConfigMap = giftService.getConfig({ roomId })

  const data: SocketPayload = {
    cmd: CMDS.GIFT_CONFIG,
    payload: giftConfigMap
  }
  wss.broadcast(data)
})
