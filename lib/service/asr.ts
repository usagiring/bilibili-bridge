
import path from 'path'
import sherpa_onnx from 'sherpa-onnx-node'
// const { OfflineRecognizer } = require('sherpa-onnx')
import sse from './sse'
import { CMD } from './const'

class SherpaOnnx {
  private vad
  private recognizer

  constructor() {
    this.recognizer = this.createRecognizer()
    this.vad = this.createVad()
  }

  createRecognizer() {
    const modelDir = path.join(process.cwd(), 'models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09')
    const recognizerConfig = {
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        senseVoice: {
          model: path.join(modelDir, 'model.int8.onnx'),
          language: '',
          useInverseTextNormalization: 1,
        },
        tokens: path.join(modelDir, 'tokens.txt'),
        numThreads: 2,
        provider: 'cpu',
        debug: 1,
      },
    }
    return new sherpa_onnx.OfflineRecognizer(recognizerConfig)
    // return sherpa_onnx.createOfflineRecognizer(recognizerConfig)
  }

  createVad() {
    const vadModel = path.join(process.cwd(), 'models/silero_vad.onnx')
    const vadConfig = {
      sileroVad: {
        model: vadModel, // 必须确保这个绝对路径文件真实存在
        threshold: 0.5, // 语音置信度阈值
        minSpeechDuration: 0.1, // 最短语音时间（秒）
        minSilenceDuration: 0.1, // 静音断句时间（秒）
        maxSpeechDuration: 20,
        windowSize: 512, // 窗口大小，只能是 512, 1024, 1536 等
      },
      sampleRate: 16000,
      debug: true,
      numThreads: 1,
      bufferSizeInSeconds: 60,
    }
    const bufferSizeInSeconds = 60
    return new sherpa_onnx.Vad(vadConfig, bufferSizeInSeconds)
    // return sherpa_onnx.createVad(vadConfig)
  }

  decode(clientId: string, buffer: Float32Array): void {
    if (!this.vad || !this.recognizer) return

    // 1. 将音频数据送入 VAD 引擎
    this.vad.acceptWaveform(buffer)

    // 2. 顺着 VAD 引擎的内部状态机队列读取就绪的语音段
    while (!this.vad.isEmpty()) {
    // 获取当前已切分好的整句语音段
      const segment = this.vad.front()
      this.vad.pop()
    
      // if (segment && segment.samples && segment.samples.length > 0) {
      // 3. 触发离线识别
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
        console.log(text)
        sse.send({ 
          clientId, 
          event: CMD.ASR_TEXT, 
          data: { text }, 
        })
      }
      // }

    }

  // ⚠️ 警告：不要在每次数据流入时盲目调用 this.vadEngine.clear()！
  // clear() 会彻底清空 VAD 内部状态，导致跨语音包（Chunk）的连续声音断裂，无法正确识别长句。
  // 只有当用户主动断开连接、或者识别彻底结束重置时，才调用 clear()。
  }
}

const sherpaOnnx = new SherpaOnnx()
export default sherpaOnnx
