/**
 * TencentCloud 机器翻译适配器
 * 对接腾讯云 TMT SDK，实现 ITranslator 接口
 *
 * 使用前需安装依赖：
 *   npm install tencentcloud-sdk-nodejs-tmt
 *
 * 文档：https://cloud.tencent.com/document/product/551/15619
 */

import type { ITranslator, TranslatorConfig, TranslateRequest, TranslateResult, DetectLanguageResult } from '../types'

const DEFAULT_REGION = 'ap-shanghai'

export class TencentCloudTranslator implements ITranslator {
  private config: TranslatorConfig & { region: string }

  constructor(config: TranslatorConfig) {
    this.config = { ...config, region: config.region || DEFAULT_REGION }
  }

  async translate(params: TranslateRequest): Promise<TranslateResult> {
    // 实际对接需引入 tencentcloud-sdk-nodejs-tmt
    //
    // import * as tencentcloud from 'tencentcloud-sdk-nodejs-tmt';
    // const TmtClient = tencentcloud.tmt.v20180321.Client;
    //
    // const client = new TmtClient({
    //   credential: {
    //     secretId: this.config.accessKeyId,
    //     secretKey: this.config.accessKeySecret,
    //   },
    //   region: this.config.region,
    // });
    //
    // const result = await client.TextTranslate({
    //   SourceText: params.text,
    //   Source: params.from,
    //   Target: params.to,
    //   ProjectId: 0,
    // });
    //
    // return {
    //   translated: result.TargetText,
    //   raw: result,
    // };

    console.warn('[TencentCloud] 机器翻译需接入 tmt SDK，目前为 stub')
    return {
      translated: '',
      raw: null,
    }
  }

  async detectLanguage(params: { text: string }): Promise<DetectLanguageResult> {
    // 实际对接:
    // const result = await client.LanguageDetect({ Text: params.text, ProjectId: 0 });
    // return { language: result.Lang, raw: result };

    console.warn('[TencentCloud] 语言检测需接入 tmt SDK，目前为 stub')
    return {
      language: '',
      raw: null,
    }
  }
}
