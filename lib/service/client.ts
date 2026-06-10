import crypto from 'crypto'
import { DEFAULT_DM_STYLE } from './const'
import state, { Client } from './state'
import { omit } from 'lodash'

export function getClient(clientId: string): Client {
  const client = state.clients.find((c: any) => c.id === clientId)
  if (!client) throw new Error(`client not found: ${clientId}`)
  return client
}

export function createClient() {
  const id = crypto.randomUUID()
  const client = {
    id,
    style: DEFAULT_DM_STYLE,
    rooms: [],
    user: null,
    ASR: { instance: null },
    MT: { instance: null },
  }

  state.clients.push(client)

  return client
}

/**
 * 剔除运行时的实例引用，返回可持久化到 DB 的纯数据对象
 */
export function omitInstance(client: Client) {
  return {
    id: client.id,
    style: client.style,
    rooms: client.rooms,
    user: client.user,
    asr: client.ASR ? omit(client.ASR, 'instance') : null,
    mt: client.MT ? omit(client.MT, 'instance') : null,
  }
}
