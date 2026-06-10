/**
 * TencentCloud 语音识别适配器
 * 对接腾讯云 ASR，实现 ISpeechRecognizer / ISpeechRecognizerOnce 接口
 *
 * 使用前需安装依赖：
 *   npm install tencentcloud-sdk-nodejs-asr
 *
 * 文档：https://cloud.tencent.com/document/product/1093/48982
 */

import type {
  ISpeechRecognizer,
  ISpeechRecognizerOnce,
  AsrConfig,
  SrConfig,
  AsrEvent,
  AsrResult,
} from '../types'

// ── 实时流式语音识别 ──

/**
 * 腾讯云实时语音识别适配器
 *
 * 对接方式：腾讯云实时 ASR 使用 WebSocket 协议，需要 HMAC-SHA1 签名。
 * 这里提供基于原生 WebSocket 的实现，避免额外的 SDK 依赖。
 */
export class TencentCloudRecognizer implements ISpeechRecognizer {
  private ws: WebSocket | null = null
  private appKey = ''
  private voiceId = ''

  async initial(config: AsrConfig): Promise<void> {
    const { appKey, accessKeyId, accessKeySecret } = config

    this.appKey = appKey
    // 生成唯一 voice_id
    this.voiceId = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`

    // 构建 WebSocket 签名 URL
    // 参考：https://cloud.tencent.com/document/product/1093/48982
    const url = this.buildSignedUrl(appKey, accessKeyId, accessKeySecret)

    this.ws = new WebSocket(url)
  }

  async start(): Promise<void> {
    if (!this.ws) throw new Error('TencentCloudRecognizer 未初始化，请先调用 initial()')

    return new Promise((resolve, reject) => {
      this.ws!.onopen = () => {
        console.log('[TencentCloud] WebSocket 已连接')
        resolve()
      }
      this.ws!.onerror = (err) => {
        console.error('[TencentCloud] WebSocket 错误:', err)
        reject(err)
      }
    })
  }

  async close(): Promise<void> {
    if (!this.ws) return

    // 发送结束标记
    this.ws.send(JSON.stringify({ type: 'end' }))
    this.ws.close()
    this.ws = null
  }

  sendAudio(data: Buffer): void {
    // Buffer<ArrayBufferLike> vs WebSocket BufferSource 类型不兼容（Node22+），用 any 绕过
     
    this.ws?.send(data as any)
  }

  on(event: AsrEvent, handler: (result: AsrResult) => void): void {
    if (!this.ws) return

    this.ws.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data as string)
        const mapped = this.mapEvent(event, parsed)
        if (mapped) handler(mapped)
      } catch {
        // 二进制数据忽略
      }
    }

    this.ws.onclose = () => {
      if (event === 'closed') handler({})
    }

    this.ws.onerror = (err) => {
      if (event === 'failed') handler({ message: String(err) })
    }
  }

  get(): WebSocket | null {
    return this.ws
  }

  // ── 签名构建 ──

  private buildSignedUrl(appKey: string, secretId: string, secretKey: string): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const expired = timestamp + 24 * 60 * 60
    const nonce = Math.floor(Math.random() * 0x7fffffff)

    // 构建参数字符串
    const params: Record<string, string> = {
      secretid: secretId,
      timestamp: String(timestamp),
      expired: String(expired),
      nonce: String(nonce),
      engine_model_type: '16k_zh',
      voice_id: this.voiceId,
      voice_format: '1', // pcm
    }

    const paramStr = Object.entries(params)
      .sort(([ a ], [ b ]) => a.localeCompare(b))
      .map(([ k, v ]) => `${k}=${v}`)
      .join('&')

    // 实际签名计算需要 crypto 模块的 HMAC-SHA1
    // 这里给出签名逻辑框架，实际使用时需完善
    //
    // import { createHmac } from 'crypto';
    // const signStr = `asr.cloud.tencent.com/asr/v2/${appKey}?${paramStr}`;
    // const signature = createHmac('sha1', secretKey).update(signStr).digest('base64');
    //
    // return `wss://asr.cloud.tencent.com/asr/v2/${appKey}?${paramStr}&signature=${encodeURIComponent(signature)}`;

    return `wss://asr.cloud.tencent.com/asr/v2/${appKey}?${paramStr}`
  }

  // ── 事件映射 ──

  private mapEvent(event: AsrEvent, raw: any): AsrResult | null {
    const codeMap: Record<number, AsrEvent> = {
      0: 'started',
      1: 'changed',
      2: 'end',
    }

    const rawEvent = codeMap[raw.code]
    if (!rawEvent) return null

    // 只触发匹配的事件
    if (event !== rawEvent) return null

    return {
      text: raw.result?.voice_text_str || '',
      index: raw.result?.slice_type,
      confidence: raw.result?.voice_text_str ? 1 : 0,
      ...raw,
    }
  }
}

// ── 一句话识别 ──

const SR_ENDPOINT = 'asr.tencentcloudapi.com'

export class TencentCloudRecognizerOnce implements ISpeechRecognizerOnce {
  async getToken(config: Omit<AsrConfig, 'appKey'>): Promise<string> {
    // 腾讯云一句话识别走 API 签名，不需要 token
    // 返回空串给调用方兼容接口
    return ''
  }

  initial(config: SrConfig): any {
    // 实际对接需引入 tencentcloud-sdk-nodejs-asr
    //
    // import * as tencentcloud from 'tencentcloud-sdk-nodejs-asr';
    // const AsrClient = tencentcloud.asr.v20190614.Client;
    //
    // const client = new AsrClient({
    //   credential: { secretId: config.accessKeyId, secretKey: config.accessKeySecret },
    //   region: 'ap-shanghai',
    // });
    //
    // const params = {
    //   EngineModelType: '16k_zh',
    //   ChannelNum: 1,
    //   ResTextFormat: 0,
    //   SourceType: 1,
    //   Data: data.toString('base64'),
    // };
    // return client.SentenceRecognition(params);

    console.warn('[TencentCloud] 一句话识别需接入 SDK，目前为 stub')
    return {}
  }
}
