import BilibiliRecorder from "@tokine/bilibili-recorder"
import { CMD } from "../const"
import state from '../state'
import sse from '../sse'

const recorder = new BilibiliRecorder()

recorder.on('rate', ({
  id,
  bps,
  totalSize,
  roomId,
  clientId,
}) => {
  sse.send(clientId, {
    cmd: CMD.RECORD_RATE,
    payload: {
      id,
      bps,
      totalSize,
      roomId,
    },
  })
})

recorder.on('end', ({
  id,
  roomId,
  clientId,
}) => {
  sse.send(clientId, {
    cmd: CMD.RECORD_END,
    payload: {
      id,
      roomId,
    },
  })
})

recorder.on('error', ({
  id,
  roomId,
  clientId,
}) => {
  sse.send(clientId, {
    cmd: CMD.RECORD_ERROR,
    payload: {
      id,
      roomId,
    },
  })
})

recorder.on('close', ({
  id,
  roomId,
  clientId,
}) => {
  sse.send(clientId, {
    cmd: CMD.RECORD_CLOSE,
    payload: {
      id,
      roomId,
    },
  })
})

export async function record({
  clientId,
  roomId,
  output,
  qn,
  platform,
  cookie,
}: {
  clientId: string
  roomId: string
  output: string
  qn?: number
  platform?: string
  cookie?: string
}) {
  const { id } = await recorder.record({
    clientId,
    roomId,
    output,
    qn,
    platform,
    axiosRequestConfig: {
      headers: {
        cookie,
      },
    },
  })

  return { id }
}

export async function cancel({ id }) {
  await recorder.cancelRecord(id)
}