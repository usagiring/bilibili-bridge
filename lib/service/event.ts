/**
 * 类型安全的 Pub/Sub 事件总线
 * - subscribe / unsubscribe / publish: 推荐使用的核心 API
 * - on / off / emit / once: EventEmitter 兼容别名
 */

type EventHandler<T = any> = (payload: T) => void | Promise<void>;

class PubSub<TEvents extends Record<string, any> = Record<string, any>> {
  private handlers = new Map<keyof TEvents, Set<EventHandler<any>>>()

  // ── 核心 API ──

  /** 订阅事件，返回取消订阅函数 */
  subscribe<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.unsubscribe(event, handler)
  }

  /** 取消订阅 */
  unsubscribe<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): void {
    this.handlers.get(event)?.delete(handler)
  }

  /** 发布事件（异步，等待所有订阅者执行完毕） */
  async publish<K extends keyof TEvents>(
    event: K,
    payload: TEvents[K],
  ): Promise<void> {
    const handlers = this.handlers.get(event)
    if (!handlers || handlers.size === 0) return

    const promises: Promise<void>[] = []
    for (const handler of handlers) {
      try {
        const result = handler(payload)
        if (result instanceof Promise) {
          promises.push(
            result.catch((err) => {
              console.error(
                `[PubSub] 异步处理器错误 [${String(event)}]:`,
                err,
              )
            }),
          )
        }
      } catch (err) {
        console.error(`[PubSub] 同步处理器错误 [${String(event)}]:`, err)
      }
    }
    await Promise.all(promises)
  }

  // ── EventEmitter 兼容别名 ──

  /** EventEmitter 兼容：订阅事件，返回 this 以支持链式调用 */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): this {
    this.subscribe(event, handler)
    return this
  }

  /** EventEmitter 兼容：取消订阅 */
  off<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): this {
    this.unsubscribe(event, handler)
    return this
  }

  /** EventEmitter 兼容：发布事件 */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    this.publish(event, payload)
  }

  /** 订阅一次性事件 */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): this {
    const wrapper: EventHandler<TEvents[K]> = (payload) => {
      this.unsubscribe(event, wrapper)
      return handler(payload)
    }
    this.subscribe(event, wrapper)
    return this
  }

  // ── 工具方法 ──

  /** 移除指定事件的所有订阅者，不传事件名则清空全部 */
  clear<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }

  /** 获取某个事件的订阅者数量 */
  subscriberCount<K extends keyof TEvents>(event: K): number {
    return this.handlers.get(event)?.size ?? 0
  }

  /** 获取所有已注册的事件名 */
  get eventNames(): (keyof TEvents)[] {
    return Array.from(this.handlers.keys())
  }
}

// ── 应用事件类型定义 ──
// 在此扩展你的事件及对应的 payload 类型
interface AppEvents {
  PING: void;
  NINKI: any;
  DANMAKU: any;
  GET_GIFT_CONFIG: any;
  MESSAGE: any;
  AUTO_REPLY: any;
  DANMAKU_COMMAND: any;
  AUDIO: any;
}

const event = new PubSub<AppEvents>()

export { PubSub, type AppEvents, type EventHandler }
export default event