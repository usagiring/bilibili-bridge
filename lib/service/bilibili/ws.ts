import util from 'util'
import { inflate } from 'pako'
import zlib from 'zlib'
import WebSocket from 'ws'
import event from '../event'
import { EVENTS } from '../const'

const WS_OP_MESSAGE = 5
const WS_OP_CONNECT_SUCCESS = 8
const WS_OP_HEARTBEAT_REPLY = 3
const WS_PACKAGE_HEADER_TOTAL_LENGTH = 16
const WS_HEADER_OFFSET = 4
const WS_OP_USER_AUTHENTICATION = 7
const WS_PACKAGE_OFFSET = 0
const WS_BODY_PROTOCOL_VERSION_BROTLI = 3
const WS_VERSION_OFFSET = 6
const WS_HEADER_DEFAULT_VERSION = 1
const WS_OPERATION_OFFSET = 8
const WS_HEADER_DEFAULT_OPERATION = 1
const WS_HEADER_DEFAULT_SEQUENCE = 1
const WS_SEQUENCE_OFFSET = 12
const WS_BODY_PROTOCOL_VERSION_NORMAL = 0


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

    const authParams = {
      uid,
      roomid: roomId,
      protover: 3,
      // from: 7
      // aid: "1.5.15"
    }

    return new Promise((resolve, reject) => {
      ws.on('open', function open() {
        const byte = convertToArrayBuffer(JSON.stringify(authParams), WS_OP_USER_AUTHENTICATION)
        ws.send(byte)
      })

      ws.on('message', (e: ArrayBuffer) => {
        e = new Uint8Array(e).buffer
        console.log(e instanceof ArrayBuffer)
        console.log(e)
        // var buf = new ArrayBuffer(e)
        const result = convertToObject(e)

        if (result.op === 3) {
          event.emit(EVENTS.NINKI, result.body)
        }
        if (Array.isArray(result.body)) {
          result.body.forEach(function (item) {
            event.emit(EVENTS.DANMAKU, item)
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
    offset: WS_HEADER_OFFSET,
    value: WS_PACKAGE_HEADER_TOTAL_LENGTH
  },
  {
    name: "Protocol Version",
    key: "ver",
    bytes: 2,
    offset: WS_VERSION_OFFSET,
    value: WS_HEADER_DEFAULT_VERSION
  },
  {
    name: "Operation",
    key: "op",
    bytes: 4,
    offset: WS_OPERATION_OFFSET,
    value: WS_HEADER_DEFAULT_OPERATION
  },
  {
    name: "Sequence Id",
    key: "seq",
    bytes: 4,
    offset: WS_SEQUENCE_OFFSET,
    value: WS_HEADER_DEFAULT_SEQUENCE
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

function convertToObject(e: ArrayBuffer) {
  const t = new DataView(e)
  const n: any = { body: [] }
  n.packetLen = t.getInt32(WS_PACKAGE_OFFSET)
  wsBinaryHeaderList.forEach(function (e) {
    4 === e.bytes ? n[e.key] = t.getInt32(e.offset) : 2 === e.bytes && (n[e.key] = t.getInt16(e.offset))
  })
  n.packetLen < e.byteLength && convertToObject(e.slice(0, n.packetLen))

  const decoder = getDecoder()

  if (!n.op || WS_OP_MESSAGE !== n.op && n.op !== WS_OP_CONNECT_SUCCESS) {
    // 人气值
    n.op && WS_OP_HEARTBEAT_REPLY === n.op && (n.body = { count: t.getInt32(WS_PACKAGE_HEADER_TOTAL_LENGTH) })
  } else {
    for (var r = WS_PACKAGE_OFFSET, s = n.packetLen, a = 0, u = ""; r < e.byteLength; r += s) {
      s = t.getInt32(r), a = t.getInt16(r + WS_HEADER_OFFSET);
      console.log(r, s, a)
      try {
        if (n.ver === WS_BODY_PROTOCOL_VERSION_NORMAL) {
          // const l = e.slice(r + a, r + s)
          // console.log(e)
          // const c = decoder.decode(e.slice(r + a, r + s));
          // console.log(c)
          // u = 0 !== c.length ? JSON.parse(c) : null

        } else if (n.ver === WS_BODY_PROTOCOL_VERSION_BROTLI) {
          const l = e.slice(r + a, r + s)
          // const h = inflate(l)
          const h = zlib.brotliDecompressSync(new Uint8Array(l));
          u = convertToObject(h.buffer).body
        }
        u && n.body.push(u)
      } catch (t) {
        console.error("decode body error:", new Uint8Array(e), n, t)
      }
    }
  }

  return n
}

function convertToArrayBuffer(e, t) {
  const encoder = getEncoder()
  const n = new ArrayBuffer(WS_PACKAGE_HEADER_TOTAL_LENGTH)
  const r = new DataView(n, WS_PACKAGE_OFFSET)
  const s = encoder.encode(e)

  return (
    r.setInt32(WS_PACKAGE_OFFSET, WS_PACKAGE_HEADER_TOTAL_LENGTH + s.byteLength),
    wsBinaryHeaderList[2].value = t,
    wsBinaryHeaderList.forEach(function (e) { 4 === e.bytes ? r.setInt32(e.offset, e.value) : 2 === e.bytes && r.setInt16(e.offset, e.value) }),
    mergeArrayBuffer(n, s)
  )
}

function mergeArrayBuffer(e, t) {
  const n = new Uint8Array(e)
  const o = new Uint8Array(t)
  const r = new Uint8Array(n.byteLength + o.byteLength)
  return r.set(n, 0), r.set(o, n.byteLength), r.buffer
}

function getDecoder() {
  return new util.TextDecoder
  // return {
  //     decode: function (e) {
  //       return decodeURIComponent(
  //         escape(String.fromCharCode.apply(String, new Uint8Array(e)))
  //       );
  //     }
  //   }
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
  return new util.TextEncoder
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
