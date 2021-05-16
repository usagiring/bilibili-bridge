// import './app'
import global from './lib/service/global'
import path from 'path'
import fs from 'fs'

// 初始化配置
function init(options) {
  const giftConfig = JSON.parse(fs.readFileSync(path.join(options.cwd, 'gift_config'), 'utf-8'))
  options.giftConfig = giftConfig
  global.replace(options)
  require('./app')
}

export default init

const isTest = process.argv[2] === 'test'

const test = {
  "cwd": "D:\\Mirror\\bilibili-bridge",
  "roomId": 6655,
  "displayRoomId": 21452505,
  "isConnected": false,
  "isShowAvatar": false,
  "isShowMemberShipIcon": true,
  "isShowFanMedal": true,
  "avatarSize": 0,
  "combineSimilarTime": 3000,
  "showGiftThreshold": 30,
  "isShowInteractInfo": false,
  "showGiftCardThreshold": 0,
  "isShowSilverGift": false,
  "guardNumber": 0,
  "windowOpacity": 1,
  "recordId": "",
  "recordStartTime": 0,
  "isRecording": false,
  "recordDir": "",
  "danmakuFont": "unset",
  "isWithCookie": false,
  "isUseMiniGiftCard": false,
  "isAutoRecord": false,
  "optionstring": "{A}\n{B}\n{C}",
  "container_style": {
    "background": "rgba(0, 0, 0, 0.3)"
  },
  "historyRooms": [
    {
      "roomId": 21449083,
      "uname": "物述有栖Official",
      "face": "http://i1.hdslb.com/bfs/face/b47463d917ec2dc7ef34951d51df490fa7f89531.jpg"
    },
    {
      "roomId": 732602,
      "uname": "大祥哥来了",
      "face": "http://i1.hdslb.com/bfs/face/1b1fbd26ca19e309425ba58c46822b04a20bdf17.jpg"
    },
    {
      "roomId": 7544221,
      "uname": "异株湖Official",
      "face": "http://i0.hdslb.com/bfs/face/aa8e7e3f1b45c30773ab8e055f11c6c8f3b8ebec.jpg"
    },
    {
      "roomId": 22625025,
      "uname": "向晚大魔王",
      "face": "http://i0.hdslb.com/bfs/face/566078c52b408571d8ae5e3bcdf57b2283024c27.jpg"
    },
    {
      "roomId": 80397,
      "uname": "阿梓从小就很可爱",
      "face": "http://i2.hdslb.com/bfs/face/c7ec7af2c0f456545c96daeffbef9b3762dc3363.jpg"
    },
    {
      "roomId": 1029,
      "uname": "黑桐谷歌",
      "face": "http://i2.hdslb.com/bfs/face/31706c82949b3ba4756a411825c3f16aeb14ad44.jpg"
    },
    {
      "roomId": 22571958,
      "uname": "美波七海-official",
      "face": "http://i0.hdslb.com/bfs/face/bf8808261f2d8e04d3a0cb0660f50f34c0b2a32c.jpg"
    },
    {
      "roomId": 22603245,
      "uname": "一包薯条嘻嘻",
      "face": "http://i1.hdslb.com/bfs/face/931e9b2e9753694145cddec57760b23b1f4596af.jpg"
    },
    {
      "roomId": 850674,
      "uname": "其妙",
      "face": "http://i1.hdslb.com/bfs/face/b5b3f09760d3c5a4c1858317dffe7dc2b2723c8d.jpg"
    },
    {
      "roomId": 21452505,
      "uname": "七海Nana7mi",
      "face": "http://i2.hdslb.com/bfs/face/68f625cf285f2086b7a6f8248e71ca21730f1422.jpg"
    }
  ],
  "0_message": {
    "background": "rgba(0,0,0,0)"
  },
  "0_name": {
    "font-size": "16px",
    "-webkit-text-stroke-width": "0px",
    "-webkit-text-stroke-color": "white",
    "color": "black"
  },
  "0_comment": {
    "font-size": "16px",
    "color": "black",
    "-webkit-text-stroke-color": "rgba(0,0,0,0)"
  },
  "3_message": {
    "background": "rgba(0,0,0,0)"
  },
  "3_name": {
    "font-size": "16px",
    "-webkit-text-stroke-width": "0px",
    "-webkit-text-stroke-color": "crimson",
    "color": "black"
  },
  "3_comment": {
    "font-size": "16px",
    "color": "black",
    "-webkit-text-stroke-color": "rgba(0,0,0,0)"
  },
  "2_message": {
    "background": "rgba(0,0,0,0)"
  },
  "2_name": {
    "font-size": "16px",
    "-webkit-text-stroke-width": "0.2px",
    "-webkit-text-stroke-color": "crimson",
    "color": "black"
  },
  "2_comment": {
    "font-size": "16px",
    "color": "black",
    "-webkit-text-stroke-color": "rgba(0,0,0,0)"
  },
  "1_message": {
    "background": "rgba(0,0,0,0)"
  },
  "1_name": {
    "font-size": "16px",
    "-webkit-text-stroke-width": "0.2px",
    "-webkit-text-stroke-color": "crimson",
    "color": "black"
  },
  "1_comment": {
    "font-size": "16px",
    "color": "black",
    "-webkit-text-stroke-color": "rgba(0,0,0,0)"
  },
  "realRoomId": 21452505,
  "ruid": 434334701,
  "windowWidth": 495,
  "windowHeight": 556,
  "windowX": 90,
  "windowY": 0,
  "isAlwaysOnTop": false,
  "medalId": 193893,
  "medalName": "脆鲨",
  "USER_DATA_PATH": "C:\\Users\\Holo\\AppData\\Roaming\\Electron\\data1",
  "PORT": 3000
}

if (isTest) {
  init(test)
}