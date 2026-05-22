/** 语音识别事件名 */
export type AsrEvent =
  | 'started'
  | 'changed'
  | 'begin'
  | 'end'
  | 'completed'
  | 'closed'
  | 'failed';

/** 一句话识别事件名 */
export type SrEvent = 'started' | 'changed' | 'completed' | 'closed' | 'failed';

/** 语音识别结果 */
export interface AsrResult {
  /** 句子索引 */
  index?: number;
  /** 识别文本 */
  text?: string;
  /** 识别结果（JSON 字符串） */
  result?: string;
  /** 置信度 */
  confidence?: number;
  /** 原始消息 */
  [key: string]: any;
}

/** 语音识别配置 */
export interface AsrConfig {
  /** 应用 Key / AppId */
  appKey: string;
  /** AccessKey / SecretId */
  accessKeyId: string;
  /** AccessKey Secret / SecretKey */
  accessKeySecret: string;
  /** API 地址（可选） */
  endpoint?: string;
  /** 中间结果开关 */
  enableIntermediateResult?: boolean;
  /** 标点预测 */
  enablePunctuation?: boolean;
  /** ITN 逆文本正则化 */
  enableITN?: boolean;
}

/** 一句话识别配置 */
export interface SrConfig {
  appKey: string;
  /** 直接使用 token 初始化 */
  token: string;
}

/**
 * 实时语音识别统一接口
 * 阿里云：speech-transcription（实时流式）
 * 腾讯云：ASR 实时语音识别
 */
export interface ISpeechRecognizer {
  /** 初始化识别实例 */
  initial(config: AsrConfig): Promise<void>;
  /** 开始识别 */
  start(): Promise<void>;
  /** 关闭识别 */
  close(): Promise<void>;
  /** 发送音频数据 */
  sendAudio(data: Buffer): void;
  /** 注册事件监听 */
  on(event: AsrEvent, handler: (result: AsrResult) => void): void;
  /** 获取原始实例（兼容旧代码） */
  get(): any;
}

/**
 * 一句话识别统一接口
 * 阿里云：SpeechRecognition（文件识别）
 * 腾讯云：一句话识别
 */
export interface ISpeechRecognizerOnce {
  /** 获取 Token */
  getToken(config: Omit<AsrConfig, 'appKey'>): Promise<string>;
  /** 用 Token 初始化 */
  initial(config: SrConfig): any;
}

/** 支持的云厂商 */
export type Provider = 'alicloud' | 'tencentcloud';
