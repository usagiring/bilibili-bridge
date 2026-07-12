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

// TODO: IF CLOUD AUTH
export function getUserCookie({
  clientId,
}): string | null {
  const client = getClient(clientId)
  return client.config?.user?.cookie || null
}

export function getRoom({ clientId, roomId }): Room | null {
  const clientConfig = getClient(clientId)
  return clientConfig?.config?.rooms?.find(r => r.id === roomId) || null
}