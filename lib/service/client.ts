import state from './state'

/** 从 state.clients 获取或创建指定 clientId 的客户端对象 */
export function getClient(clientId: string) {
  const s = state as any
  if (!s.clients) { s.clients = [] }
  let client = s.clients.find((c: any) => c.id === clientId)
  if (!client) {
    client = {
      id: clientId,
      SSEClient: null,
      ASR: { instance: null },
      MT: { instance: null },
    }
    s.clients.push(client)
  }
  return client
}
