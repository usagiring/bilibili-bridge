import BilibiliRecorder from "@tokine/bilibili-recorder"
import wss, { SocketPayload } from "../wss"
import { CMDS } from "../const"
import state from '../state'

const recorder = new BilibiliRecorder({
  onRecordRate: ({
    id,
    bps,
    totalSize,
    roomId
  }) => {
    const data: SocketPayload = {
      cmd: CMDS.RECORD_RATE,
      payload: {
        id,
        bps,
        totalSize,
        roomId
      }
    }
    wss.broadcast(data)
  },

  onRecordEnd: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMDS.RECORD_END,
      payload: {
        id,
        roomId
      }
    }
    wss.broadcast(data)
  },

  onRecordError: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMDS.RECORD_ERROR,
      payload: {
        id,
        roomId,
      }
    }
    wss.broadcast(data)
  },

  onRecordClose: ({
    id,
    roomId,
  }) => {
    state.unset(`recordMap.${roomId}`)
    const data: SocketPayload = {
      cmd: CMDS.RECORD_CLOSE,
      payload: {
        id,
        roomId,
      }
    }
    wss.broadcast(data)
  },
})


export async function record({
  roomId,
  output,
  qn,
  platform,
  cookie
}: {
  roomId: string
  output: string
  qn?: number
  platform?: string
  cookie?: string
}) {
  const { id } = await recorder.record({
    roomId,
    output,
    qn,
    platform,
    axiosRequestConfig: {
      headers: {
        cookie
      }
    }
  })

  return { id }
}

export async function cancel({ id }) {
  await recorder.cancelRecord(id)
}