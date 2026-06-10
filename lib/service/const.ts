export const BILI_CMD = {
  PREPARING: 'PREPARING',
  INTERACT_WORD: 'INTERACT_WORD',
  DANMU_MSG: 'DANMU_MSG',
  SEND_GIFT: 'SEND_GIFT',
  LIVE: 'LIVE',
  ROOM_REAL_TIME_MESSAGE_UPDATE: 'ROOM_REAL_TIME_MESSAGE_UPDATE',
  ANCHOR_LOT_START: 'ANCHOR_LOT_START',
  ANCHOR_LOT_AWARD: 'ANCHOR_LOT_AWARD',
  ANCHOR_LOT_END: 'ANCHOR_LOT_END',
  WATCHED_CHANGE: 'WATCHED_CHANGE',
  LIKE_CHANGE: 'LIKE_INFO_V3_UPDATE',
  LOG_IN_NOTICE: 'LOG_IN_NOTICE',
  ONLINE_COUNT: 'ONLINE_RANK_COUNT',
  SUPER_CHAT_MESSAGE: 'SUPER_CHAT_MESSAGE',
  SUPER_CHAT_MESSAGE_JPN: 'SUPER_CHAT_MESSAGE_JPN',
  GUARD_BUY: 'GUARD_BUY',
} as const

export const CMD = {
  ...BILI_CMD,
  PING: 'PING',
  NINKI: 'NINKI', // 人气
  DANMAKU: 'DANMAKU',
  GET_GIFT_CONFIG: 'GET_GIFT_CONFIG',
  MESSAGE: 'MESSAGE',
  AUTO_REPLY: 'AUTO_REPLY',
  DANMAKU_COMMAND: 'DANMAKU_COMMAND',
  AUDIO: 'AUDIO',
  GIFT_CONFIG: 'GIFT_CONFIG',
  COMMENT: 'COMMENT',
  INTERACT: 'INTERACT',
  SUPER_CHAT: 'SUPER_CHAT',
  GIFT: 'GIFT',
  LIVE: 'LIVE',
  PREPARING: 'PREPARING',
  SETTING: 'SETTING',
  ROOM_REAL_TIME_MESSAGE_UPDATE: 'ROOM_REAL_TIME_MESSAGE_UPDATE',
  MESSAGE_CLEAR: 'MESSAGE_CLEAR',
  EXAMPLE_COMMENT: 'EXAMPLE_COMMENT',
  EXAMPLE_INTERACT: 'EXAMPLE_INTERACT',
  EXAMPLE_GIFT: 'EXAMPLE_GIFT',
  EXAMPLE_SUPER_CHAT: 'EXAMPLE_SUPER_CHAT',
  EXAMPLE_MESSAGE_CLEAR: 'EXAMPLE_MESSAGE_CLEAR',
  ANCHOR_LOT_START: 'ANCHOR_LOT_START',
  ANCHOR_LOT_AWARD: 'ANCHOR_LOT_AWARD',
  ANCHOR_LOT_END: 'ANCHOR_LOT_END',
  EXAMPLE_MESSAGE_RESTORE: 'EXAMPLE_MESSAGE_RESTORE',
  DANMAKU_COMMAND_RESULT: 'DANMAKU_COMMAND_RESULT',
  WATCHED_CHANGE: 'WATCHED_CHANGE',
  ASR_SENTENCE_BEGIN: 'ASR_SENTENCE_BEGIN',
  ASR_SENTENCE_END: 'ASR_SENTENCE_END',
  ASR_SENTENCE_CHANGE: 'ASR_SENTENCE_CHANGE',
  SR_STARTED: 'SR_STARTED',
  SR_COMPLETED: 'SR_COMPLETED',
  MECHINE_TRANSLATE: 'MECHINE_TRANSLATE',
  SPEAK: 'SPEAK',
  LIKE_CHANGE: 'LIKE_CHANGE',
  LOG_IN_NOTICE: 'LOG_IN_NOTICE',
  RECORD_RATE: 'RECORD_RATE',
  RECORD_END: 'RECORD_END',
  RECORD_ERROR: 'RECORD_ERROR',
  RECORD_CLOSE: 'RECORD_CLOSE',
  ONLINE_COUNT: 'ONLINE_COUNT',
} as const

export const ERROR = {
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const

export const COMMON_RESPONSE = {
  message: 'ok',
} as const

export const HTTP_ERROR = {
  NOT_FOUND: {
    status: 404,
    message: 'NOT_FOUND',
  },
  PARAMS_ERROR: {
    status: 400,
    message: 'PARAMS_ERROR',
  },
  SYSTEM_ERROR: {
    status: 500,
    message: 'SYSTEM_ERROR',
  },
} as const

export const DEFAULT_DM_STYLE = {
  isShowFace: true,
  isShowAnchorIcon: true,
  isShowFanMedal: true,
  faceSize: 24,
  combineSimilarTime: 3000,
  hiddenExpiredTime: 0,
  showHeadlineThreshold: 30,
  isShowInteractInfo: false,
  showGiftCardThreshold: 0,
  isShowSilverGift: false,
  font: 'unset',
  isUseMiniGiftCard: false,
  adminIcon: "ios-home-outline",
  isShowAdminIcon: false,
  adminIconColor: 'coral',
  channelCount: 1,
  channelDelayTime: 20,

  windowOpacity: 1,
  windowBackground: "rgba(0, 0, 0, 0.3)",

  messageContainer0: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername0: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    '--textStrokeColor': 'white',
    color: 'white',
  },
  messageComment0: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },

  messageContainer1: {
    background: 'rgba(106,106,106,0.6)',
  },
  messageUsername1: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    '--textStrokeColor': 'crimson',
    color: 'white',
  },
  messageComment1: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },

  messageContainer2: {
    background: 'rgba(106,106,106,0.6)',
  },
  messageUsername2: {
    'font-size': '16px',
    '--textStrokeWidth': '0.2px',
    '--textStrokeColor': 'crimson',
    color: 'white',
  },
  messageComment2: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },

  messageContainer3: {
    background: 'rgba(106,106,106,0.6)',
  },
  messageUsername3: {
    'font-size': '16px',
    '--textStrokeWidth': '0.2px',
    '--textStrokeColor': 'crimson',
    color: 'white',
  },
  messageComment3: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },

  messageContainer99: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername99: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    '--textStrokeColor': 'white',
    color: 'white',
  },
  messageComment99: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },

  messageContainerInteract: {
    background: 'rgba(0,0,0,0)',
  },
  messageCommentInteract: {
    'font-size': '16px',
    color: 'white',
    "--textStrokeColor": 'rgba(0,0,0,1)',
  },
}