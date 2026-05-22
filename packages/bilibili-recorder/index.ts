import axios, { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from "axios"
import * as fs from 'fs'

const CancelToken = axios.CancelToken

const BASE_LIVE_URL = 'https://api.live.bilibili.com'
const DOWNLOAD_TIMER_MS = 2000

interface Option {
  onRecordRate?: Function
  onRecordEnd?: Function
  onRecordError?: Function
  onRecordClose?: Function
  axiosRequestConfig?: AxiosRequestConfig
}

interface RecordParam {
  roomId: string
  output: string
  qn?: number,
  platform?: string
  axiosRequestConfig?: AxiosRequestConfig
}

class BilibiliRecorder {
  onRecordRate?: Function
  onRecordEnd?: Function
  onRecordError?: Function
  onRecordClose?: Function
  axiosInstance: AxiosInstance
  sourceMap: { [x: string]: CancelTokenSource }

  constructor(option: Option) {
    this.onRecordRate = option?.onRecordRate
    this.onRecordEnd = option?.onRecordEnd
    this.onRecordError = option?.onRecordError
    this.onRecordClose = option?.onRecordClose

    const defaultAxiosOptions = {
      headers: {
        origin: 'https://live.bilibili.com',
        // Host: 'api.live.bilibili.com',
        referer: 'https://live.bilibili.com/',
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
      },
    }
    this.axiosInstance = axios.create(Object.assign({}, defaultAxiosOptions, option.axiosRequestConfig || {}))
  }

  async record(param: RecordParam) {
    const now = Date.now()
    const id = String(now)
    this.sourceMap = this.sourceMap ? { ...this.sourceMap, [id]: CancelToken.source() } : { [id]: CancelToken.source() }

    const { roomId, output, qn, axiosRequestConfig } = param
    if (!roomId) throw new Error('roomId is required.')
    const playUrl = await this.getRandomPlayUrl(param)

    const writeStream = fs.createWriteStream(output || `${roomId}_${now}.flv`)
    const liveStream = await this.getLiveStream({ playUrl, id, axiosRequestConfig })
    const bufferSize = {
      current: 0,
      preTick: 0
    }

    const dowloadTimer = setInterval(() => {
      const delta = bufferSize.current - bufferSize.preTick
      const bps = delta / (DOWNLOAD_TIMER_MS / 1000)
      bufferSize.preTick = bufferSize.current
      // this.emitter.emit(`${id}-download-rate`, { bps, totalSize: bufferSize.current })

      if (this.onRecordRate) {
        this.onRecordRate({
          id,
          bps,
          totalSize: bufferSize.current,
          roomId: roomId,
        })
      }
    }, DOWNLOAD_TIMER_MS)

    liveStream.on("data", (chunk) => {
      bufferSize.current = bufferSize.current + chunk.length
      writeStream.write(Buffer.from(chunk))
    })

    liveStream.on("end", () => {
      // this.emitter.emit(`${id}-download-end`)
      writeStream.end()
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)

      if (this.onRecordEnd) {
        this.onRecordEnd({
          id,
          roomId: roomId,
        })
      }
    })

    liveStream.on("error", (e) => {
      // this.emitter.emit(`${id}-download-error`)
      writeStream.end()
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)

      if (this.onRecordError) {
        this.onRecordError({
          id,
          roomId: roomId,
        })
      }
    })

    liveStream.on("close", () => {
      // this.emitter.emit(`${id}-download-close`)
      delete this.sourceMap[id]
      writeStream.end()
      clearInterval(dowloadTimer)

      if (this.onRecordClose) {
        this.onRecordClose({
          id,
          roomId: roomId,
        })
      }
    })

    // TODO return stream ?
    return {
      id
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
    axiosRequestConfig = {}
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
    axiosRequestConfig = {}
  }: {
    playUrl: string
    id?: string
    axiosRequestConfig: AxiosRequestConfig
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
