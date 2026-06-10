import axios, { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from "axios"
import * as fs from 'fs'

const CancelToken = axios.CancelToken

const BASE_LIVE_URL = 'https://api.live.bilibili.com'
const DOWNLOAD_TIMER_MS = 2000

// ── 事件类型 ──

export interface RecordRateData {
  id: string
  bps: number
  totalSize: number
  roomId: string
  clientId?: string
}

export interface RecordEndData {
  id: string
  clientId?: string
  roomId: string
}

export interface RecordErrorData {
  id: string
  roomId: string
  clientId?: string
}

export interface RecordCloseData {
  id: string
  roomId: string
  clientId?: string
}

export interface RecordEvents {
  rate: (data: RecordRateData) => void
  end: (data: RecordEndData) => void
  error: (data: RecordErrorData) => void
  close: (data: RecordCloseData) => void
}

// ── 配置 ──

interface Option {
  axiosRequestConfig?: AxiosRequestConfig
}

interface RecordParam {
  clientId?: string
  roomId: string
  output: string
  qn?: number,
  platform?: string
  axiosRequestConfig?: AxiosRequestConfig
}

// ── 核心类 ──

class BilibiliRecorder {
  axiosInstance: AxiosInstance
  sourceMap!: { [x: string]: CancelTokenSource }
  private _listeners: { [K in keyof RecordEvents]?: RecordEvents[K][] } = {}

  constructor(option: Option = {}) {
    const defaultAxiosOptions = {
      headers: {
        origin: 'https://live.bilibili.com',
        referer: 'https://live.bilibili.com/',
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
      },
    }
    this.axiosInstance = axios.create(Object.assign({}, defaultAxiosOptions, option.axiosRequestConfig || {}))
  }

  /** 注册事件监听器 */
  on<K extends keyof RecordEvents>(event: K, listener: RecordEvents[K]): void {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event]!.push(listener)
  }

  /** 触发事件 */
  private emit<K extends keyof RecordEvents>(event: K, data: Parameters<RecordEvents[K]>[0]): void {
    const listeners = this._listeners[event]
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

  async record(param: RecordParam) {
    const now = Date.now()
    const id = String(now)
    this.sourceMap = this.sourceMap ? { ...this.sourceMap, [id]: CancelToken.source() } : { [id]: CancelToken.source() }

    const { roomId, clientId, output, qn, axiosRequestConfig } = param
    if (!roomId) throw new Error('roomId is required.')
    const playUrl = await this.getRandomPlayUrl(param)

    const writeStream = fs.createWriteStream(output || `${roomId}_${now}.flv`)
    const liveStream = await this.getLiveStream({ playUrl, id, axiosRequestConfig })
    const bufferSize = {
      current: 0,
      preTick: 0,
    }

    const dowloadTimer = setInterval(() => {
      const delta = bufferSize.current - bufferSize.preTick
      const bps = delta / (DOWNLOAD_TIMER_MS / 1000)
      bufferSize.preTick = bufferSize.current

      this.emit('rate', {
        id,
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
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)

      this.emit('end', { id, clientId, roomId })
    })

    liveStream.on("error", (e: any) => {
      writeStream.end()
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)

      this.emit('error', { id, clientId, roomId })
    })

    liveStream.on("close", () => {
      delete this.sourceMap[id]
      writeStream.end()
      clearInterval(dowloadTimer)

      this.emit('close', { id, clientId, roomId })
    })

    // TODO return stream ?
    return {
      id,
    }
  }

  async cancelRecord(id?: string) {
    const _id = id || Object.keys(this.sourceMap)[0]
    console.log(`cancel live stream. id: ${_id}`)
    if (!_id) {
      throw new Error('not found')
    }
    this.sourceMap[_id].cancel('Operation canceled by the user.')
  }

  async getPlayUrl({
    roomId,
    platform,
    qn,
    axiosRequestConfig = {},
  }: RecordParam) {
    if (!roomId) {
      throw new Error('not found roomId.')
    }

    const url = `${BASE_LIVE_URL}/room/v1/Room/playUrl?cid=${roomId}&qn=${qn || 0}&platform=${platform || 'web'}`
    const res = await this.axiosInstance.get(url, axiosRequestConfig)
    return res.data
  }

  async getRandomPlayUrl(param: RecordParam) {
    const result = await this.getPlayUrl(param)
    const urlsLength = result.data.durl.length
    return result.data.durl[Math.floor(Math.random() * urlsLength)].url
  }

  async getLiveStream({
    playUrl,
    id,
    axiosRequestConfig = {},
  }: {
    playUrl: string
    id?: string
    axiosRequestConfig?: AxiosRequestConfig
  }) {
    const _id = id || Object.keys(this.sourceMap)[0]
    if (!_id) {
      throw new Error('not found')
    }
    const res = await this.axiosInstance.get(playUrl, {
      ...axiosRequestConfig,
      responseType: "stream",
      cancelToken: this.sourceMap[_id].token,
    })
    return res.data
  }
}

export default BilibiliRecorder
