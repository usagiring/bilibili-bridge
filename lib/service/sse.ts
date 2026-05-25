import { Context } from 'koa'
import state from './state'

class SSEService {
  /**
   * 获取或初始化 clients 数组
   */
  private get clients(): any[] {
    if (!(state as any).clients) {
      (state as any).clients = []
    }
    return (state as any).clients
  }

  /**
   * 注册 SSE 客户端连接
   * 调用后持续保持连接，直到客户端断开
   */
  register(ctx: Context, clientId: string): void {
    // 设置 SSE 响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
    })
    ctx.status = 200

    // 立即发送头部，建立连接
    ctx.res.flushHeaders()

    // 在 state.clients 中查找或创建客户端
    let client = this.clients.find(c => c.id === clientId)
    if (!client) {
      client = { id: clientId }
      this.clients.push(client)
    }

    // 如果有旧的 SSE 连接，先关闭
    if (client.SSEClient) {
      try { client.SSEClient.ctx.res.end() } catch { /* ignore */ }
    }

    client.SSEClient = { ctx }

    console.log(`[SSE] client connected: ${clientId}, sseTotal: ${this.sseCount}`)

    // 发送连接成功事件
    this.send(clientId, { type: 'connected', clientId })

    // 监听断开，清理 SSEClient 引用（保留 client 对象其他数据）
    ctx.req.on('close', () => {
      if (client.SSEClient?.ctx === ctx) {
        delete client.SSEClient
      }
      console.log(`[SSE] client disconnected: ${clientId}, sseTotal: ${this.sseCount}`)
    })
  }

  /**
   * 向指定客户端发送消息
   */
  send(clientId: string, data: Record<string, unknown>): boolean {
    const client = this.clients.find(c => c.id === clientId)
    if (!client?.SSEClient) return false

    try {
      client.SSEClient.ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
      return true
    } catch {
      delete client.SSEClient
      return false
    }
  }

  /**
   * 向所有 SSE 连接的客户端广播消息
   */
  broadcast(data: Record<string, unknown>): void {
    this.clients.forEach((client) => {
      if (client.SSEClient) {
        this.send(client.id, data)
      }
    })
  }

  /** 获取当前 SSE 连接数 */
  get sseCount(): number {
    return this.clients.filter(c => !!c.SSEClient).length
  }

  /** 检查客户端 SSE 是否已连接 */
  isConnected(clientId: string): boolean {
    const client = this.clients.find(c => c.id === clientId)
    return !!client?.SSEClient
  }
}

export const sse = new SSEService()
export default sse
