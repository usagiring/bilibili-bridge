/** 翻译认证/连接配置 */
export interface TranslatorConfig {
  /** AccessKey / SecretId */
  accessKeyId: string;
  /** AccessKey Secret / SecretKey */
  accessKeySecret: string;
  /** 地域（腾讯云用） */
  region?: string;
}

/** 通用翻译请求参数 */
export interface TranslateRequest {
  /** 待翻译文本 */
  text: string;
  /** 源语言代码，如 'zh', 'en', 'ja', 'auto' */
  from: string;
  /** 目标语言代码 */
  to: string;
  /** 翻译场景，如 'general', 'title', 'description' */
  scene?: string;
}

/** 通用翻译结果 */
export interface TranslateResult {
  /** 翻译后的文本 */
  translated: string;
  /** 源语言（当 from 为 'auto' 时返回检测结果） */
  detectedLanguage?: string;
  /** 原始响应数据 */
  raw?: any;
}

/** 语言检测结果 */
export interface DetectLanguageResult {
  /** 检测到的语言代码 */
  language: string;
  /** 原始响应数据 */
  raw?: any;
}

/**
 * 机器翻译统一接口
 *
 * 阿里云：alimt20181012 TranslateGeneral / GetDetectLanguage
 * 腾讯云：tmt TextTranslate / LanguageDetect
 */
export interface ITranslator {
  /** 通用翻译 */
  translate(params: TranslateRequest): Promise<TranslateResult>;
  /** 语言检测 */
  detectLanguage(params: { text: string }): Promise<DetectLanguageResult>;
}

/** 支持的云厂商 */
export type Provider = 'alicloud' | 'tencentcloud';
