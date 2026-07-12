import axios, { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from "axios"
import * as fs from 'fs'

const CancelToken = axios.CancelToken

const BASE_LIVE_URL = 'https://api.live.bilibili.com'
const DOWNLOAD_TIMER_MS = 1000

export interface RecordRateData {
  bps: number
  totalSize: number
  roomId: string
}

export interface RecordEndData {
  roomId: string
}

export interface RecordErrorData {
  roomId: string
}

export interface RecordCloseData {
  roomId: string
}

export interface RecordEvents {
  rate: (data: RecordRateData) => void
  end: (data: RecordEndData) => void
  error: (data: RecordErrorData) => void
  close: (data: RecordCloseData) => void
}

export interface RecordParams {
  roomId: string
  output?: string
  qn?: number
  platform?: string
  axiosRequestConfig?: AxiosRequestConfig
}

class BilibiliRecorder {
  axiosInstance: AxiosInstance
  private listeners: { [K in keyof RecordEvents]?: RecordEvents[K][] } = {}

  roomId: string
  output?: string
  qn?: number
  platform?: string
  cancelTokenSource?: CancelTokenSource

  constructor(params: RecordParams) {
    this.roomId = params.roomId
    this.output = params.output
    this.qn = params.qn
    this.platform = params.platform

    const defaultAxiosOptions = {
      headers: {
        origin: 'https://live.bilibili.com',
        referer: 'https://live.bilibili.com/',
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      },
    }

    this.axiosInstance = axios.create(Object.assign({}, defaultAxiosOptions, params.axiosRequestConfig || {}))
  }

  /** 注册事件监听器 */
  on<K extends keyof RecordEvents>(event: K, listener: RecordEvents[K]): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event]!.push(listener)
  }

  /** 触发事件 */
  private emit<K extends keyof RecordEvents>(event: K, data: Parameters<RecordEvents[K]>[0]): void {
    const listeners = this.listeners[event]
    if (listeners) {
      for (const listener of listeners) {
        try {
          ;(listener as any)(data)
        } catch {
          // ignore listener errors
        }
      }
    }
  }

  async start(): Promise<void> {
    const now = Date.now()
    this.cancelTokenSource = CancelToken.source()

    const { roomId, output, qn, platform } = this
    if (!roomId) throw new Error('roomId is required.')
    const playUrl = await this.getRandomPlayUrl({ roomId, qn, platform })

    console.log({ roomId, output, qn, playUrl })
    const liveStream = await this.getLiveStream({ playUrl })
    const writeStream = fs.createWriteStream(output || `${roomId}_${now}.flv`)

    const bufferSize = {
      current: 0,
      preTick: 0,
    }

    const dowloadTimer = setInterval(() => {
      const delta = bufferSize.current - bufferSize.preTick
      const bps = delta / (DOWNLOAD_TIMER_MS / 1000)
      bufferSize.preTick = bufferSize.current

      this.emit('rate', {
        bps,
        totalSize: bufferSize.current,
        roomId,
      })
    }, DOWNLOAD_TIMER_MS)

    liveStream.on("data", (chunk: any) => {
      bufferSize.current = bufferSize.current + chunk.length
      writeStream.write(Buffer.from(chunk))
    })

    liveStream.on("end", () => {
      writeStream.end()
      delete this.cancelTokenSource
      clearInterval(dowloadTimer)

      this.emit('end', { roomId })
    })

    liveStream.on("error", (_e: any) => {
      writeStream.end()
      delete this.cancelTokenSource
      clearInterval(dowloadTimer)

      this.emit('error', { roomId })
    })

    liveStream.on("close", () => {
      delete this.cancelTokenSource
      writeStream.end()
      clearInterval(dowloadTimer)

      this.emit('close', { roomId })
    })
  }

  async cancel() {
    if (!this.cancelTokenSource) return 
    this.cancelTokenSource.cancel('Operation canceled by the user.')
  }

  async getPlayUrl({
    roomId,
    platform,
    qn,
  }: {
    roomId: string
    platform?: string
    qn?: number
  }) {
    const url = `${BASE_LIVE_URL}/room/v1/Room/playUrl?cid=${roomId}&qn=${qn || 0}&platform=${platform || 'web'}`
    const res = await this.axiosInstance.get(url)
    return res.data
  }

  async getRandomPlayUrl(param: { roomId: string; qn?: number; platform?: string }) {
    const result = await this.getPlayUrl(param)
    const urlsLength = result.data.durl.length
    return result.data.durl[Math.floor(Math.random() * urlsLength)].url
  }

  async getLiveStream({
    playUrl,
  }: {
    playUrl: string
  }) {
    const res = await this.axiosInstance.get(playUrl, {
      responseType: "stream",
      cancelToken: this.cancelTokenSource?.token,
    })
    return res.data
  }
}

export default BilibiliRecorder
