
import path from 'path'
import sherpa_onnx from 'sherpa-onnx-node'  
import sse from './sse'
import { CMD } from './const'

const MODEL_PATH = process.env.MODEL_PATH

interface ModelConfig { 
  name: string
}

interface VadConfig { 
  minSpeechDuration?: number
  minSilenceDuration?: number
  maxSpeechDuration?: number
}

interface Config {
  clientId: string
  roomId: string
  model: ModelConfig
  vad?: VadConfig
}

class SherpaOnnx {
  clientId: string
  roomId: string
  private vad
  private recognizer

  constructor(config: Config) {
    this.clientId = config.clientId
    this.roomId = config.roomId
    this.recognizer = this.createRecognizer(config.model)
    this.vad = this.createVad(config.vad)
  }

  createRecognizer(cfg: ModelConfig) {
    let modelPath = ''
    let tokenPath = ''

    const config: any = {
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        tokens: '',
        numThreads: 2,
        provider: 'cpu',
      },
    }

    if (cfg.name.includes('sherpa-onnx-sense-voice')) {
      modelPath = path.join(MODEL_PATH || `${process.cwd()}/models`, `${cfg.name}/model.int8.onnx`)
      tokenPath = path.join(MODEL_PATH || `${process.cwd()}/models`, `${cfg.name}/tokens.txt`)
      const senseVoice = {
        model: modelPath,
        language: '',
        useInverseTextNormalization: 1,
      }
      config.modelConfig.senseVoice = senseVoice
      config.modelConfig.tokens = tokenPath
    } else {
      throw new Error('模型配置错误')
    }

    return new sherpa_onnx.OfflineRecognizer(config)
  }

  createVad(cfg: VadConfig) {
    // const vadModel = path.join(process.cwd(), 'models/silero_vad.onnx')
    const vadModel = path.join(MODEL_PATH || `${process.cwd()}/models`, 'ten-vad.onnx')
    const config = {
      tenVad: {
      // sileroVad: {
        model: vadModel, // 必须确保这个绝对路径文件真实存在
        threshold: 0.4, // 语音置信度阈值
        minSpeechDuration: cfg.minSpeechDuration || 0.1, // 最短语音时间（秒）
        minSilenceDuration: cfg.minSilenceDuration || 0.1, // 静音断句时间（秒）
        maxSpeechDuration: cfg.maxSpeechDuration || 10,
        windowSize: 512, // 窗口大小，只能是 512, 1024, 1536 等
      },
      sampleRate: 16000,
      numThreads: 1,
      bufferSizeInSeconds: 60,
    }
    const bufferSizeInSeconds = 60
    return new sherpa_onnx.Vad(config, bufferSizeInSeconds)
  }

  decode(buffer: Float32Array): void {
    if (!this.vad || !this.recognizer) return

    // 1. 将音频数据送入 VAD 引擎
    this.vad.acceptWaveform(buffer)

    // 2. 顺着 VAD 引擎的内部状态机队列读取就绪的语音段
    while (!this.vad.isEmpty()) {
      // enableExternalBuffer=false：Electron 环境不支持 external ArrayBuffer
      const segment = this.vad.front(false)
      this.vad.pop()
    
      const stream = this.recognizer.createStream()
      stream.acceptWaveform({
        samples: segment.samples,
        sampleRate: this.recognizer.config.featConfig.sampleRate,
      })
      this.recognizer.decode(stream)

      const result = this.recognizer.getResult(stream) as { text: string }

      // 如果识别出了文本，通过 SSE 发送给客户端
      if (result?.text?.length > 0) {
        const text = result.text.toLowerCase().trim()
        sse.send({ 
          clientId: this.clientId, 
          event: CMD.SPEECH_TO_TEXT, 
          data: { 
            roomId: this.roomId,
            text,
          }, 
        })
      }
    }
  }
}

export default SherpaOnnx
