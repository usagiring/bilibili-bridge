/**
 * @tokine/asr — 多厂商语音识别统一接口
 *
 * 使用方式：
 *   import { createRecognizer, createRecognizerOnce } from '@tokine/asr'
 *
 *   // 实时流式识别
 *   const asr = createRecognizer('alicloud')      // 或 'tencentcloud'
 *   await asr.initial({ appKey, accessKeyId, accessKeySecret })
 *   await asr.start()
 *   asr.on('changed', (result) => console.log(result.text))
 *   asr.sendAudio(audioBuffer)
 *
 *   // 一句话识别
 *   const sr = createRecognizerOnce('alicloud')
 *   const token = await sr.getToken({ accessKeyId, accessKeySecret })
 *   const instance = sr.initial({ appKey, token })
 */

// ── 统一接口（推荐） ──
export { createRecognizer, createRecognizerOnce, RecognizerPool } from './src/factory'
export type { PoolEntry } from './src/factory'
// export { setFfmpegPath, getAudioStream } from './src/ffmpeg'
export type {
  Provider,
  ISpeechRecognizer,
  ISpeechRecognizerOnce,
  AsrConfig,
  SrConfig,
  AsrEvent,
  SrEvent,
  AsrResult,
} from './src/types'
export { AliCloudRecognizer, AliCloudRecognizerOnce } from './src/providers/alicloud'
export { TencentCloudRecognizer, TencentCloudRecognizerOnce } from './src/providers/tencentcloud'