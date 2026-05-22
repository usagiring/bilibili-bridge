/**
 * 语音识别工厂 & 实例池
 *
 * - createRecognizer()       每次调用创建新实例，调用方自行管理生命周期
 * - RecognizerPool           键值实例池，适用于多端（多房间/多 appKey）并发场景
 */

import type { Provider, ISpeechRecognizer, ISpeechRecognizerOnce } from './types';
import { AliCloudRecognizer, AliCloudRecognizerOnce } from './providers/alicloud';
import { TencentCloudRecognizer, TencentCloudRecognizerOnce } from './providers/tencentcloud';

const recognizerCtors: Record<Provider, new () => ISpeechRecognizer> = {
  alicloud: AliCloudRecognizer,
  tencentcloud: TencentCloudRecognizer,
};

const recognizerOnceCtors: Record<Provider, new () => ISpeechRecognizerOnce> = {
  alicloud: AliCloudRecognizerOnce,
  tencentcloud: TencentCloudRecognizerOnce,
};

// ── 工厂：每次创建全新实例 ──

/**
 * 创建实时语音识别器（每次调用返回新实例）
 *
 * @example
 *   const asr = createRecognizer('alicloud')
 *   await asr.initial({ appKey, accessKeyId, accessKeySecret })
 *   await asr.start()
 *   asr.sendAudio(audioBuffer)
 *   await asr.close()   // 调用方负责关闭
 */
export function createRecognizer(provider: Provider): ISpeechRecognizer {
  const Ctor = recognizerCtors[provider];
  if (!Ctor) throw new Error(`不支持的语音识别服务: ${provider}`);
  return new Ctor();
}

/**
 * 创建一句话识别器（每次调用返回新实例）
 */
export function createRecognizerOnce(provider: Provider): ISpeechRecognizerOnce {
  const Ctor = recognizerOnceCtors[provider];
  if (!Ctor) throw new Error(`不支持的语音识别服务: ${provider}`);
  return new Ctor();
}

// ── 实例池：多端场景的键值管理 ──

export interface PoolEntry<T = ISpeechRecognizer> {
  key: string;
  instance: T;
  provider: Provider;
  createdAt: number;
}

/**
 * 语音识别实例池
 *
 * 适用场景：多房间并发，每个房间独立 appKey & 生命周期
 *
 * @example
 *   const pool = new RecognizerPool()
 *
 *   // 房间 A 初始化
 *   const asrA = pool.getOrCreate('room_123', 'alicloud')
 *   await asrA.initial({ appKey: 'keyA', ... })
 *
 *   // 房间 B 初始化
 *   const asrB = pool.getOrCreate('room_456', 'tencentcloud')
 *   await asrB.initial({ appKey: 'keyB', ... })
 *
 *   // 房间 A 关了
 *   await pool.close('room_123')
 */
export class RecognizerPool {
  private pool = new Map<string, PoolEntry>();

  /** 获取已存在的实例，不存在则创建 */
  getOrCreate(key: string, provider: Provider): ISpeechRecognizer {
    const entry = this.pool.get(key);
    if (entry) return entry.instance;

    const instance = createRecognizer(provider);
    this.pool.set(key, {
      key,
      instance,
      provider,
      createdAt: Date.now(),
    });
    return instance;
  }

  /** 获取已存在的实例（不创建） */
  get(key: string): ISpeechRecognizer | undefined {
    return this.pool.get(key)?.instance;
  }

  /** 关闭并移除指定实例 */
  async close(key: string): Promise<void> {
    const entry = this.pool.get(key);
    if (!entry) return;
    try {
      await entry.instance.close();
    } catch (e) {
      console.warn(`[RecognizerPool] 关闭 "${key}" 失败:`, e);
    }
    this.pool.delete(key);
  }

  /** 关闭所有实例 */
  async closeAll(): Promise<void> {
    const keys = Array.from(this.pool.keys());
    await Promise.all(keys.map((k) => this.close(k)));
  }

  /** 移除指定条目（不关闭连接） */
  remove(key: string): boolean {
    return this.pool.delete(key);
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
