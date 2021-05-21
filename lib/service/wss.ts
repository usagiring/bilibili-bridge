import http from 'http'
import WebSocket from 'ws'
import { EVENTS } from './const'
import global from './global'

export interface SocketPayload {
  cmd: string
  payload?: any
}
class WSS {
  wss

  init(server) {
    this.wss = new WebSocket.Server({ server })

    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      ws.on('message', (message: string) => {
        const payload = JSON.parse(message)

        // TODO: auth and options
        // TODO: isAlive
        // setInterval, if not auth or not alive then terminate() client
        switch (payload.event) {
          case EVENTS.PING: {
            pong({ ws, payload: payload.payload })
            break
          }
          case EVENTS.UPDATE_SETTING: {
            updateSetting({ payload: payload.payload })
            break
          }
          case EVENTS.MERGE_SETTING: {
            mergeSetting({ payload: payload.payload })
            break
          }
        }
      })
    })

    this.wss.on('error', (err) => {
      console.error(err)
    })
  }

  broadcast(payload: SocketPayload) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload))
      }
    })
  }
}

const wss = new WSS()

export default wss


// send to client
// event.on(EVENTS.WS_MESSAGE, (payload) => {
//   wss.send(JSON.stringify(payload))
// })

function pong({ ws, payload }) {
  const msg = {
    event: 'PONG',
    payload: payload
  }
  ws.send(JSON.stringify(msg))
}

function updateSetting({ payload }) {
  // unmask
  const setting = global.set(payload.path, payload.data)
  wss.broadcast(setting)
}

function mergeSetting({ payload }) {
  const setting = global.merge(payload)
  wss.broadcast(setting)
}