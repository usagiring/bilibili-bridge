import global from './lib/service/global'

// 初始化配置
function init(options) {
  global.replace(options)
  // app
  require('./app')
}

export default init

const isTest = process.argv[2] === 'test'

const testConfig = {
    "isShowAvatar": true,
    "isShowMemberShipIcon": true,
    "isShowFanMedal": true,
    "avatarSize": 24,
    "combineSimilarTime": 3000,
    "showHeadlineThreshold": 30,
    "isShowInteractInfo": false,
    "showGiftCardThreshold": 0,
    "isShowSilverGift": false,
    "opacity": 1,
    "danmakuFont": "unset",
    "isUseMiniGiftCard": false,
    "background": "rgba(0, 0, 0, 0.3)",
    "message_lv0": {
        "background": "rgba(0,0,0,0)"
    },
    "name_lv0": {
        "font-size": "16px",
        "-webkit-text-stroke-width": "0px",
        "-webkit-text-stroke-color": "white",
        "color": "white"
    },
    "comment_lv0": {
        "font-size": "16px",
        "color": "white",
        "-webkit-text-stroke-color": "rgba(0,0,0,0)"
    },
    "message_lv3": {
        "background": "rgba(0,0,0,0)"
    },
    "name_lv3": {
        "font-size": "16px",
        "-webkit-text-stroke-width": "0px",
        "-webkit-text-stroke-color": "crimson",
        "color": "white"
    },
    "comment_lv3": {
        "font-size": "16px",
        "color": "white",
        "-webkit-text-stroke-color": "rgba(0,0,0,0)"
    },
    "message_lv2": {
        "background": "rgba(0,0,0,0)"
    },
    "name_lv2": {
        "font-size": "16px",
        "-webkit-text-stroke-width": "0.2px",
        "-webkit-text-stroke-color": "crimson",
        "color": "white"
    },
    "comment_lv2": {
        "font-size": "16px",
        "color": "white",
        "-webkit-text-stroke-color": "rgba(0,0,0,0)"
    },
    "message_lv1": {
        "background": "rgba(0,0,0,0)"
    },
    "name_lv1": {
        "font-size": "16px",
        "-webkit-text-stroke-width": "0.2px",
        "-webkit-text-stroke-color": "crimson",
        "color": "white"
    },
    "comment_lv1": {
        "font-size": "16px",
        "color": "white",
        "-webkit-text-stroke-color": "rgba(0,0,0,0)"
    },
    "roomId": 1,
    "isConnected": false,
    "USER_DATA_PATH": "C:\\Users\\Holo\\AppData\\Roaming\\Electron\\data",
    "PORT": 8080,
    "EXAMPLE_MESSAGES": [
        {
            "cmd": "EXAMPLE_COMMENT",
            "payload": {
                "_id": 1,
                "id": 1,
                "type": "comment",
                "uid": "123456",
                "name": "bli_123456",
                "comment": "这是一条测试弹幕哟～",
                "guard": 3,
                "role": 3,
                "similar": 1,
                "medalName": "测试者",
                "medalLevel": 6,
                "medalColorBorder": "#5d7b9e",
                "medalColorStart": "#5d7b9e",
                "medalColorEnd": "#5d7b9e"
            }
        },
        {
            "cmd": "EXAMPLE_COMMENT",
            "payload": {
                "_id": 2,
                "id": 2,
                "guard": 0,
                "uid": "654321",
                "name": "bli_654321",
                "type": "comment",
                "comment": "～哟幕弹试测条一是这",
                "role": 0
            }
        },
        {
            "cmd": "EXAMPLE_SUPER_CHAT",
            "payload": {
                "_id": 6,
                "id": 6,
                "uid": "12345",
                "name": "bli_12345",
                "type": "superChat",
                "comment": "这是一条测试SuperChat哟～",
                "commentJPN": "これはテスト用のスパチャだよ〜",
                "price": 50,
                "totalPrice": 50,
                "role": 0,
                "guard": 0,
                "coinType": "gold"
            }
        },
        {
            "cmd": "EXAMPLE_GIFT",
            "payload": {
                "_id": 8,
                "id": 8,
                "type": "gift",
                "uid": 777777,
                "name": "bli_777777",
                "isGuardGift": true,
                "price": 198,
                "giftNumber": 1,
                "totalPrice": 198,
                "giftName": "舰长",
                "guard": 1,
                "coinType": "gold"
            }
        }
    ],
    "SAVE_ALL_BILI_MESSAGE": false,
    "HTML_PATH": "node_modules\\@tokine\\bilibili-danmaku-page",
    "displayRoomId": 80397,
    "guardNumber": 0,
    "recordDir": "S:\\Video",
    "isWithCookie": false,
    "isAutoRecord": false,
    "onlyMyselfRoom": true,
    "isWatchLottery": false,
    "optionstring": "",
    "isAutoReply": true,
    "autoReplyRules": [
        {
            "priority": 0,
            "text": "感谢 {user.name} 赠送的 {gift.name}",
            "onlyGold": false,
            "isTextReply": false,
            "isSpeakReply": false,
            "isAutoReply": false
        }
    ],
    "isSpeakReply": false,
    "realRoomId": 80397,
    "windowX": 1499,
    "windowY": 134,
    "isAlwaysOnTop": false,
    "medalId": 13139,
    "medalName": "小孩梓"
}
if (isTest) {
  init(testConfig)
}