import BilibiliRecorder from "@tokine/bilibili-recorder"
import { CMD } from "../const"
import state from '../state'

const recorder = new BilibiliRecorder({
  onRecordRate: ({
    id,
    bps,
    totalSize,
    roomId,
  }) => {
    const data = {
      cmd: CMD.RECORD_RATE,
      payload: {
        id,
        bps,
        totalSize,
        roomId,
      },
    }
    wss.broadcast(data)
  },

  onRecordEnd: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMD.RECORD_END,
      payload: {
        id,
        roomId,
      },
    }
    wss.broadcast(data)
  },

  onRecordError: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMD.RECORD_ERROR,
      payload: {
        id,
        roomId,
      },
    }
    wss.broadcast(data)
  },

  onRecordClose: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMD.RECORD_CLOSE,
      payload: {
        id,
        roomId,
      },
    }
    wss.broadcast(data)
  },
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