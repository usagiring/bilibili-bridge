/**
 * @tokine/mt — 多厂商机器翻译统一接口
 *
 * 使用方式：
 *   import { createTranslator, TranslatorPool } from '@tokine/mt'
 *
 *   // 创建翻译器
 *   const mt = createTranslator('alicloud', { accessKeyId, accessKeySecret })
 *   const result = await mt.translate({ text: '你好', from: 'zh', to: 'en' })
 *   console.log(result.translated) // "Hello"
 *
 *   // 多端场景
 *   const pool = new TranslatorPool()
 *   const mt1 = pool.getOrCreate('room_123', 'alicloud', { accessKeyId: '...', accessKeySecret: '...' })
 */

// ── 统一接口（推荐） ──
export { createTranslator, TranslatorPool } from './src/factory'
export type { PoolEntry } from './src/factory'
export type {
  Provider,
  ITranslator,
  TranslatorConfig,
  TranslateRequest,
  TranslateResult,
  DetectLanguageResult,
} from './src/types'
export { AliCloudTranslator } from './src/providers/alicloud'
export { TencentCloudTranslator } from './src/providers/tencentcloud'