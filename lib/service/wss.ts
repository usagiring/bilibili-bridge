import http from 'http'
import WebSocket from 'ws'
import { EVENTS } from './const'
import runtime from './runtime'

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
          case EVENTS.AUDIO: {
            audio(payload.data)
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


function audio(data) {
  const asr = runtime.get('asrInstance')
  if (!asr) return

  const buffer = new Int16Array(JSON.parse(data))
  // const c = Buffer.from(b)
  const result = asr.sendAudio(buffer)
  if (!result) {
    console.log('result: ', result)
    asr.close()
  }
}