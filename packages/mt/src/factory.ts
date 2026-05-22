/**
 * 机器翻译工厂 & 实例池
 *
 * - createTranslator()       每次调用创建新实例，调用方自行管理生命周期
 * - TranslatorPool           键值实例池，适用于多端（不同 appKey）并发场景
 */

import type { Provider, ITranslator, TranslatorConfig } from './types';
import { AliCloudTranslator } from './providers/alicloud';
import { TencentCloudTranslator } from './providers/tencentcloud';

const translatorCtors: Record<Provider, new (config: TranslatorConfig) => ITranslator> = {
  alicloud: AliCloudTranslator,
  tencentcloud: TencentCloudTranslator,
};

// ── 工厂：每次创建全新实例 ──

/**
 * 创建翻译器（每次调用返回新实例）
 *
 * @example
 *   const mt = createTranslator('alicloud', { accessKeyId, accessKeySecret })
 *   const result = await mt.translate({ text: '你好', from: 'zh', to: 'en' })
 */
export function createTranslator(provider: Provider, config: TranslatorConfig): ITranslator {
  const Ctor = translatorCtors[provider];
  if (!Ctor) throw new Error(`不支持的翻译服务: ${provider}`);
  return new Ctor(config);
}

// ── 实例池：多端场景的键值管理 ──

export interface PoolEntry<T = ITranslator> {
  key: string;
  instance: T;
  provider: Provider;
  createdAt: number;
}

/**
 * 翻译器实例池
 *
 * 适用场景：多端并发，每个端独立 credentials & 生命周期
 *
 * @example
 *   const pool = new TranslatorPool()
 *
 *   const mt1 = pool.getOrCreate('room_123', 'alicloud', { accessKeyId: '...', accessKeySecret: '...' })
 *   const mt2 = pool.getOrCreate('room_456', 'tencentcloud', { accessKeyId: '...', accessKeySecret: '...' })
 *
 *   pool.remove('room_123')
 */
export class TranslatorPool {
  private pool = new Map<string, PoolEntry>();

  /** 获取已存在的实例，不存在则创建 */
  getOrCreate(key: string, provider: Provider, config: TranslatorConfig): ITranslator {
    const entry = this.pool.get(key);
    if (entry) return entry.instance;

    const instance = createTranslator(provider, config);
    this.pool.set(key, {
      key,
      instance,
      provider,
      createdAt: Date.now(),
    });
    return instance;
  }

  /** 获取已存在的实例（不创建） */
  get(key: string): ITranslator | undefined {
    return this.pool.get(key)?.instance;
  }

  /** 移除指定条目 */
  remove(key: string): boolean {
    return this.pool.delete(key);
  }

  /** 清空所有实例 */
  clear(): void {
    this.pool.clear();
  }

  /** 列出所有池中实例 */
  list(): PoolEntry[] {
    return Array.from(this.pool.values());
  }

  /** 池中实例数量 */
  get size(): number {
    return this.pool.size;
  }
}
