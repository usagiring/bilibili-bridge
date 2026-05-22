## B站直播录播工具

### install

```
$ npm install @tokine/bilibili-recorder -S
```

### usage
```
import BilibiliRecorder from '@tokine/bilibili-recorder'

const recorder = new BilibiliRecorder(
  { 
    onRecordRate?: Function // 注册回调方法
    onRecordEnd?: Function
    onRecordError?: Function
    onRecordClose?: Function
    axiosRequestConfig?: AxiosRequestConfig
  },
)

// 回调方法
// const onRecordRate = ({ id, bps, totalSize, roomId }) => { ... }
// const onRecordEnd = ({ id, roomId }) => { ... }


// -- methods --

// 开始录制
const { id } = await recorder.record({
  roomId, // 房间号 required
  output, // 输出流，默认当前文件夹, example: `./${roomId}_${Date.now()}.flv`,
  qn: number // 质量
  axiosRequestConfig?: AxiosRequestConfig
})

// 取消录制
recorder.cancelRecord([id])

// 随机获取一个视频流地址
const playUrl = await recorder.getRandomPlayUrl({
  roomId, // 房间号 required
  qn: number // 质量
  axiosRequestConfig?: AxiosRequestConfig
})

// 获取视频流
recorder.getLiveStream({ 
  playUrl: string
  id?: string
  axiosRequestConfig?: AxiosRequestConfig
})

