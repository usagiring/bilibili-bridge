import crypto from 'crypto'
import { DEFAULT_CONFIG, Room } from './const'
import state, { Client } from './state'
import { cloneDeep } from 'lodash'

export function getClient(clientId: string): Client {
  const client = state.clients.find((c: Client) => c.id === clientId)
  if (!client) throw new Error(`client not found: ${clientId}`)
  return client
}

export function createClient() {
  const id = crypto.randomUUID()
  const client = {
    id,
    config: cloneDeep(DEFAULT_CONFIG),
  }

  return client
}

export function getRoom({
  // clientId,
  roomId,
}): Room {
  // const client = getClient(clientId)

  return {
    id: roomId,
    userId: '',
    liveStatus: 0,
    liveStream: '',

    isAutoReply: false,
    autoReplyRules: [],

    voteOptions: [],
  }
  // return client.config.rooms.find((room: any) => room.id === roomId)
}

// TODO: IF CLOUD AUTH
export function getUserCookie({
  clientId,
}): string | null {
  const client = getClient(clientId)
  return client.config?.user?.cookie || null
}