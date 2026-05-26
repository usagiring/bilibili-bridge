/**
 * AliCloud 机器翻译适配器
 * 对接阿里云 alimt20181012 SDK，实现 ITranslator 接口
 */

import alimt20181012, * as $alimt20181012 from '@alicloud/alimt20181012'
import * as $OpenApi from '@alicloud/openapi-client'
import type { ITranslator, TranslatorConfig, TranslateRequest, TranslateResult, DetectLanguageResult } from '../types'

const DEFAULT_ENDPOINT = 'mt.cn-hangzhou.aliyuncs.com'

export class AliCloudTranslator implements ITranslator {
  private client: alimt20181012

  constructor(config: TranslatorConfig) {
    const { accessKeyId, accessKeySecret, region } = config

    const openApiConfig = new $OpenApi.Config({
      accessKeyId,
      accessKeySecret,
    })
    openApiConfig.endpoint = region
      ? `mt.${region}.aliyuncs.com`
      : DEFAULT_ENDPOINT

    this.client = new alimt20181012(openApiConfig)
  }

  async translate(params: TranslateRequest): Promise<TranslateResult> {
    const { text, from, to, scene = 'general' } = params

    const request = new $alimt20181012.TranslateGeneralRequest({
      formatType: 'text',
      sourceText: text,
      scene,
      sourceLanguage: from,
      targetLanguage: to,
    })

    const result = await this.client.translateGeneral(request)

    return {
      translated: result?.body?.data?.translated ?? '',
      raw: result,
    }
  }

  async detectLanguage(params: { text: string }): Promise<DetectLanguageResult> {
    const request = new $alimt20181012.GetDetectLanguageRequest({
      sourceText: params.text,
    })

    const result = await this.client.getDetectLanguage(request)

    return {
      language: result?.body?.data?.detectedLanguage ?? '',
      raw: result,
    }
  }

  // ── 旧版 API 兼容别名（返回原始 SDK 响应） ──

  /** @deprecated 使用 translate() 替代 */
  async translateGeneral(params: { text: string; from: string; to: string }): Promise<any> {
    const request = new $alimt20181012.TranslateGeneralRequest({
      formatType: 'text',
      sourceText: params.text,
      scene: 'general',
      sourceLanguage: params.from,
      targetLanguage: params.to,
    })
    return this.client.translateGeneral(request)
  }

  /** @deprecated 使用 detectLanguage() 替代 */
  async getDetectLanguage(params: { text: string }): Promise<any> {
    const request = new $alimt20181012.GetDetectLanguageRequest({
      sourceText: params.text,
    })
    return this.client.getDetectLanguage(request)
  }
}
