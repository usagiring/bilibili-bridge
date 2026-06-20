import { Context } from 'koa'
import state from './state'

class SSEService {
  private heartBeatTimer: ReturnType<typeof setInterval> | null = null
  private readonly HEARTBEAT_MS = 30_000

  private get sseClients() {
    return state.sseClients!
  }

  /**
   * 注册 SSE 客户端连接
   * 同一个 clientId 允许多个连接并存
   */
  register(ctx: Context, clientId: string): void {
    // 设置 SSE 响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    ctx.status = 200
    ctx.res.flushHeaders()

    const entry = { clientId, ctx, lastAlive: Date.now() }
    this.sseClients.push(entry)

    this.startHeartbeat()

    console.log(`[SSE] client connected: ${clientId}, sseTotal: ${this.sseCount}`)

    this.send(clientId, { type: 'connected', clientId })

    ctx.req.on('close', () => {
      const idx = this.sseClients.indexOf(entry)
      if (idx !== -1) this.sseClients.splice(idx, 1)
      console.log(`[SSE] client disconnected: ${clientId}, sseTotal: ${this.sseCount}`)
      if (this.sseCount === 0) this.stopHeartbeat()
    })
  }

  /** 断开指定客户端的所有 SSE 连接 */
  disconnect(clientId: string): void {
    for (let i = this.sseClients.length - 1; i >= 0; i--) {
      if (this.sseClients[i].clientId === clientId) {
        try { this.sseClients[i].ctx.res.end() } catch { /* ignore */ }
        this.sseClients.splice(i, 1)
      }
    }
  }

  /** 向指定客户端的所有连接发送消息 */
  send(clientId: string, data: Record<string, unknown>): boolean {
    const targets = this.sseClients.filter((e) => e.clientId === clientId)
    if (!targets.length) return false

    let sent = false
    targets.forEach((entry) => {
      try {
        entry.ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
        entry.lastAlive = Date.now()
        sent = true
      } catch {
        this.remove(entry)
      }
    })
    return sent
  }

  /** 向所有 SSE 连接的客户端广播消息 */
  broadcast(data: Record<string, unknown>): void {
    this.sseClients.slice().forEach((entry) => {
      try {
        entry.ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
        entry.lastAlive = Date.now()
      } catch {
        this.remove(entry)
      }
    })
  }

  get sseCount(): number {
    return this.sseClients.length
  }

  isConnected(clientId: string): boolean {
    return this.sseClients.some((e) => e.clientId === clientId)
  }

  private startHeartbeat(): void {
    if (this.heartBeatTimer) return
    this.heartBeatTimer = setInterval(() => {
      this.sseClients.slice().forEach((entry) => {
        try {
          entry.ctx.res.write(': heartbeat\n\n')
          entry.lastAlive = Date.now()
        } catch {
          try { entry.ctx.res.end() } catch { /* ignore */ }
          this.remove(entry)
        }
      })
      if (this.sseClients.length === 0) this.stopHeartbeat()
    }, this.HEARTBEAT_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
      this.heartBeatTimer = null
    }
  }

  private remove(entry: { ctx: any }): void {
    const idx = this.sseClients.indexOf(entry as any)
    if (idx !== -1) this.sseClients.splice(idx, 1)
  }
}

export const sse = new SSEService()
export default sse
