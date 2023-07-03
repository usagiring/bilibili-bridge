import util from 'util'
import { inflate } from 'pako'
import WebSocket from 'ws'
import event from '../event'
import { EVENTS } from '../const'
import decompress from 'brotli/decompress'

const URI = "wss://broadcastlv.chat.bilibili.com:2245/sub"

interface ConnectOption {
  uid?: number
  roomId: number
}

class WSClient {
  ws: WebSocket
  HEART_BEAT_TIMER
  options: ConnectOption
  autoReConnect = true

  constructor(options?: ConnectOption) {
    this.options = options
  }

  async connect(options?: ConnectOption) {
    this.options = options
    if (!this.options) {
      throw new Error('options missed')
    }
    const self = this
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('room connected..., nothing todo.')
      return
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('room connecting..., nothing todo.')
      return
    }

    const ws = new WebSocket(URI)
    ws.binaryType = "arraybuffer"

    this.ws = ws

    const { uid = 0, roomId } = this.options
    this.autoReConnect = true
    console.log(`room connect, roomId: ${roomId}`)

    // const authParams = {
    //   uid,
    //   roomid: roomId,
    //   protover: 2,
    //   platform: "web",
    //   clientver: "1.5.15"
    // }

    const authParams = {
      uid,
      roomid: roomId,
      protover: 3,
      platform: "web",
      type: 2,
      buvid: ''
    }

    return new Promise((resolve, reject) => {
      ws.on('open', function open() {
        const data = JSON.stringify(authParams)
        const byte = convertToArrayBuffer(data, 7)
        ws.send(byte)
        resolve(event)
      })

      ws.on('message', (evt) => {
        const result = convertToObject(evt)

        if (result.op === 3) {
          event.emit(EVENTS.NINKI, result.body)
        }
        if (Array.isArray(result.body)) {
          result.body.forEach(function (item) {
            event.emit(EVENTS.MESSAGE, item)
          })
        }

        if (result.op === 8) {
          this.heartbeat()
        }
      })


      ws.on('close', function (e) {
        console.log('close', e)
        clearInterval(self.HEART_BEAT_TIMER)

        // 报错重连
        if (self.autoReConnect) {
          self.connect(options)
        }
      })

      ws.on('error', function (err) {
        console.error('error', err)
        clearInterval(self.HEART_BEAT_TIMER)

        // 报错重连
        if (self.autoReConnect) {
          self.connect(options)
        }
      })
    })
  }

  // 手动关闭
  async close() {
    this.autoReConnect = false
    if (!this.ws) return
    // error code not work...
    this.ws.close(4001, 'manual close')
  }

  reconnect() {
    if (!this.ws) return
    this.ws.close(4002, 'close for reconnect')
  }

  isConnected() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return true
    }
    return false
  }

  heartbeat() {
    const self = this
    clearInterval(this.HEART_BEAT_TIMER)
    this.HEART_BEAT_TIMER = setInterval(() => {
      self.ws.send(convertToArrayBuffer({}, 2))
    }, 30000)
  }
}

export default WSClient

const wsBinaryHeaderList = [
  {
    name: "Header Length",
    key: "headerLen",
    bytes: 2,
    offset: 4,
    value: 16
  },
  {
    name: "Protocol Version",
    key: "ver",
    bytes: 2,
    offset: 6,
    value: 1
  },
  {
    name: "Operation",
    key: "op",
    bytes: 4,
    offset: 8,
    value: 1
  },
  {
    name: "Sequence Id",
    key: "seq",
    bytes: 4,
    offset: 12,
    value: 1
  }
]

// function stringToByte(str) {
//   var bytes = [];
//   var len, c;
//   len = str.length;
//   for (var i = 0; i < len; i++) {
//     c = str.charCodeAt(i);
//     if (c >= 0x010000 && c <= 0x10ffff) {
//       bytes.push(((c >> 18) & 0x07) | 0xf0);
//       bytes.push(((c >> 12) & 0x3f) | 0x80);
//       bytes.push(((c >> 6) & 0x3f) | 0x80);
//       bytes.push((c & 0x3f) | 0x80);
//     } else if (c >= 0x000800 && c <= 0x00ffff) {
//       bytes.push(((c >> 12) & 0x0f) | 0xe0);
//       bytes.push(((c >> 6) & 0x3f) | 0x80);
//       bytes.push((c & 0x3f) | 0x80);
//     } else if (c >= 0x000080 && c <= 0x0007ff) {
//       bytes.push(((c >> 6) & 0x1f) | 0xc0);
//       bytes.push((c & 0x3f) | 0x80);
//     } else {
//       bytes.push(c & 0xff);
//     }
//   }
//   return bytes;
// }

function convertToObject(arraybuffer) {
  const dataview = new DataView(arraybuffer)
  const output: any = {
    body: []
  }
  output.packetLen = dataview.getInt32(0)

  wsBinaryHeaderList.forEach(function (item) {
    4 === item.bytes
      ? (output[item.key] = dataview.getInt32(item.offset))
      : 2 === item.bytes && (output[item.key] = dataview.getInt16(item.offset))
  })

  output.packetLen < arraybuffer.byteLength &&
    convertToObject(arraybuffer.slice(0, output.packetLen))

  const decoder = getDecoder()

  if (output.op && 5 === output.op) {
    for (
      let i = 0, o = output.packetLen, u = 0, c = "";
      i < arraybuffer.byteLength;
      i += o
    ) {
      o = dataview.getInt32(i)
      u = dataview.getInt16(i + 4)
      try {
        if (output.ver === 3) {
          const l = arraybuffer.slice(i + u, i + o)
          // const f = inflate(l)
          const f = decompress(new Uint8Array(l))
          c = convertToObject(f.buffer).body
        } else {
          c = JSON.parse(decoder.decode(arraybuffer.slice(i + u, i + o)))
        }
        c && output.body.push(c)
      } catch (t) {
        console.error(
          "decode body error:",
          new Uint8Array(arraybuffer),
          output,
          t
        )
      }
    }
  } else {
    // 人气值
    output.op &&
      3 === output.op &&
      (output.body = {
        count: dataview.getInt32(16)
      })
  }
  return output
}

function convertToArrayBuffer(data, t) {
  const encoder = getEncoder()
  const buffer = new ArrayBuffer(16)
  const dataview = new DataView(buffer, 0)
  const encode = encoder.encode(data)

  return (
    dataview.setInt32(0, 16 + encode.byteLength),
    (wsBinaryHeaderList[2].value = t),
    wsBinaryHeaderList.forEach(function (e) {
      4 === e.bytes
        ? dataview.setInt32(e.offset, e.value)
        : 2 === e.bytes && dataview.setInt16(e.offset, e.value)
    }),
    mergeArrayBuffer(buffer, encode)
  )
}

function mergeArrayBuffer(e, t) {
  const n = new Uint8Array(e)
  const i = new Uint8Array(t)
  const r = new Uint8Array(n.byteLength + i.byteLength)
  r.set(n, 0)
  r.set(i, n.byteLength)
  return r.buffer
}

function getDecoder() {
  return new util.TextDecoder()
  // return window.TextDecoder
  //   ? new window.TextDecoder()
  //   : {
  //     decode: function (e) {
  //       return decodeURIComponent(
  //         window.escape(String.fromCharCode.apply(String, new Uint8Array(e)))
  //       );
  //     }
  //   };
}

function getEncoder() {
  return new util.TextEncoder()
  // return window.TextEncoder
  //   ? new window.TextEncoder()
  //   : {
  //     encode: function (e) {
  //       for (
  //         var t = new ArrayBuffer(e.length),
  //         n = new Uint8Array(t),
  //         i = 0,
  //         r = e.length;
  //         i < r;
  //         i++
  //       ) {
  //         n[i] = e.charCodeAt(i);
  //       }
  //       return t;
  //     }
  //   };
}
