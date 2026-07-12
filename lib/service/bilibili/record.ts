import BilibiliRecorder, { RecordParams } from "@tokine/bilibili-recorder"
import { CMD } from "../const"
import sse from '../sse'

export interface CreateRecorder { 
  clientId: string 
  roomId: string
  qn: number
  output: string
  cookie?: string
}

export function createRecorder ({
  clientId,
  roomId,
  qn,
  output,
  cookie,
}: CreateRecorder) {
  const param: RecordParams = {
    roomId,
    qn,
    output,
    axiosRequestConfig: {
      headers: {
        cookie,
      },
    },
  }
  const recorder = new BilibiliRecorder(param)

  recorder.on('rate', ({
    bps,
    totalSize,
  }) => {
    sse.send({ 
      clientId,
      event: CMD.RECORD_RATE,
      data: { 
        roomId,
        bps,
        totalSize,
      },
    })
  })

  recorder.on('end', () => {
    sse.send({ 
      clientId,
      event: CMD.RECORD_END,
      data: {
        roomId,
      },
    })
  })

  recorder.on('error', () => {
    sse.send({ 
      clientId,
      event: CMD.RECORD_ERROR,
      data: {
        roomId, 
      },
    })
  })

  recorder.on('close', () => {
    sse.send({ 
      clientId,
      event: CMD.RECORD_CLOSE,
      data: {
        roomId,
      },
    })
  })

  return recorder
}
