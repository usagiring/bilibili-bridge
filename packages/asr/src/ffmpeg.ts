import ffmpeg from 'fluent-ffmpeg'
import axios from 'axios'

// export function setFfmpegPath(path: string) {
//   ffmpeg.setFfmpegPath(path)
// }

// // https://trac.ffmpeg.org/wiki/audio%20types
// // alicloud: pcm 16bit 16000K singleChannel
// export async function getAudioStream({ url }: { url: string }) {
//   const response = await axios({
//     method: 'get',
//     url,
//     responseType: 'stream',
//     headers: {
//       referer: 'https://api.live.bilibili.com/',
//       "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
//     },
//   })

//   return ffmpeg(response.data)
//   // .inputFormat('flv')
//     .noVideo()
//     .audioCodec('pcm_s16le')
//     .audioBitrate(16)
//     .audioChannels(1)
//     .audioFrequency(16000)
//     .format('wav')
//     .on('error', function (err: any) {
//       console.log('An error occurred: ' + err.message)
//     })
//     .pipe()
// }