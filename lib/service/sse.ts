import { Context } from 'koa'
import { getClient } from './client'
import state from './state'

class SSEService {
  /**
   * 注册 SSE 客户端连接
   * 调用后持续保持连接，直到客户端断开
   */
  register(ctx: Context, clientId: string): void {
    const client = getClient(clientId)

    // 设置 SSE 响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    ctx.status = 200
    ctx.res.flushHeaders()

    // 如果有旧的 SSE 连接，先关闭
    if (client.SSEClient) {
      try { client.SSEClient.ctx.res.end() } catch { /* ignore */ }
    }

    client.SSEClient = { ctx }

    console.log(`[SSE] client connected: ${clientId}, sseTotal: ${this.sseCount}`)

    this.send(clientId, { type: 'connected', clientId })

    ctx.req.on('close', () => {
      if (client.SSEClient?.ctx === ctx) {
        delete client.SSEClient
      }
      console.log(`[SSE] client disconnected: ${clientId}, sseTotal: ${this.sseCount}`)
    })
  }

  private get clients(): any[] {
    return ((state as any).clients || []) as any[]
  }

  /** 向指定客户端发送消息 */
  send(clientId: string, data: Record<string, unknown>): boolean {
    const client = getClient(clientId)
    if (!client.SSEClient) return false

    try {
      client.SSEClient.ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
      return true
    } catch {
      delete client.SSEClient
      return false
    }
  }

  /** 向所有 SSE 连接的客户端广播消息 */
  broadcast(data: Record<string, unknown>): void {
    this.clients.forEach((c) => {
      if (c.SSEClient) {
        try { c.SSEClient.ctx.res.write(`data: ${JSON.stringify(data)}\n\n`) } catch { delete c.SSEClient }
      }
    })
  }

  get sseCount(): number {
    return this.clients.filter((c: any) => !!c.SSEClient).length
  }

  isConnected(clientId: string): boolean {
    return !!getClient(clientId).SSEClient
  }
}

export const sse = new SSEService()
export default sse
