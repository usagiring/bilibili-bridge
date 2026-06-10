/**
 * AliCloud 语音识别适配器
 * 对接阿里云 NLS SDK，实现 ISpeechRecognizer / ISpeechRecognizerOnce 接口
 */

import { SpeechTranscription } from 'alibabacloud-nls'
import { SpeechRecognition } from 'alibabacloud-nls'
import RPCClient from '@alicloud/pop-core'
import type {
  ISpeechRecognizer,
  ISpeechRecognizerOnce,
  AsrConfig,
  SrConfig,
  AsrEvent,
  SrEvent,
  AsrResult,
} from '../types'

// ── 实时流式语音识别 ──

const DEFAULT_HOST = 'nls-gateway.aliyuncs.com'

// ── 阿里云 Token 客户端 ──

class AliTokenClient {
  private client: RPCClient

  constructor({ accessKeyId, accessKeySecret }: { accessKeyId: string; accessKeySecret: string }) {
    this.client = new RPCClient({
      accessKeyId,
      accessKeySecret,
      endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
      apiVersion: '2019-02-28',
    })
  }

  async getToken(): Promise<string> {
    const result: any = await this.client.request('CreateToken', {})
    return result.Token.Id
  }
}

export class AliCloudRecognizer implements ISpeechRecognizer {
  private instance: any = null

  async initial(config: AsrConfig): Promise<void> {
    const { appKey, accessKeyId, accessKeySecret, endpoint } = config
    const host = endpoint || DEFAULT_HOST

    const aliClient = new AliTokenClient({ accessKeyId, accessKeySecret })
    const token = await aliClient.getToken()

    this.instance = new SpeechTranscription({
      url: `wss://${host}/ws/v1`,
      token,
      appkey: appKey,
    })

    // 内置日志
    this.instance.on('started', (msg: string) => console.log('[AliCloud] started:', msg))
    this.instance.on('completed', (msg: string) => console.log('[AliCloud] completed:', msg))
    this.instance.on('closed', () => console.log('[AliCloud] closed'))
    this.instance.on('failed', (msg: string) => console.log('[AliCloud] failed:', msg))
  }

  async start(): Promise<void> {
    if (!this.instance) throw new Error('AliCloudRecognizer 未初始化，请先调用 initial()')

    const defaultParams = this.instance.defaultStartParams()
    await this.instance.start(
      {
        ...defaultParams,
        format: 'pcm',
        sample_rate: 16000,
        enable_intermediate_result: true,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true,
      },
      true,
      6000,
    )
  }

  async close(): Promise<void> {
    await this.instance?.close()
    this.instance = null
  }

  sendAudio(data: Buffer): void {
    this.instance?.sendAudio(data)
  }

  on(event: AsrEvent, handler: (result: AsrResult) => void): void {
    this.instance?.on(event, (msg: string) => {
      handler(JSON.parse(msg))
    })
  }

  get(): any {
    return this.instance
  }
}

// ── 一句话识别 ──

const SR_HOST = 'nls-gateway.aliyuncs.com'

export class AliCloudRecognizerOnce implements ISpeechRecognizerOnce {
  async getToken(config: Omit<AsrConfig, 'appKey'>): Promise<string> {
    const { accessKeyId, accessKeySecret } = config
    const aliClient = new AliTokenClient({ accessKeyId, accessKeySecret })
    return aliClient.getToken()
  }

  initial(config: SrConfig): any {
    const { appKey, token } = config
    return new SpeechRecognition({
      url: `wss://${SR_HOST}/ws/v1`,
      appkey: appKey,
      token,
    })
  }
}
