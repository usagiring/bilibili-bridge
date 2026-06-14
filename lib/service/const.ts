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

interface Window {
  id: string
  type: 'live' | 'dm' | 'dmRaw' | 'asr'
  roomId: number

  x: number
  y: number
  width: number
  height: number

}

const DM_STYLE = {
  isShowFace: true,
  isShowAnchorIcon: true,
  isShowFanMedal: true,
  isShowHeadline: true,
  faceSize: 24,
  combineSimilarTime: 3000,
  hiddenExpiredTime: 0,
  showHeadlineThreshold: 30,
  isShowInteractInfo: false,
  showGiftCardThreshold: 0,
  isShowSilverGift: false,
  font: 'unset',
  fontWeight: '',
  isUseMiniGiftCard: false,
  adminIcon: "ios-home-outline",
  isShowAdminIcon: false,
  adminIconColor: 'coral',
  isShowType1: false, // 显示节奏风暴弹幕
  isShowType2: false, // 显示天选时刻弹幕
  channelCount: 1,
  channelDelayTime: 20,
  isShowSuperChatJPN: false,

  windowOpacity: 1,
  windowBackground: "rgba(0, 0, 0, 0.3)",
  isWindowAlwaysOnTop: false,

  messageSettings: [],

  borderImages: [],

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

const DM_RAW_STYLE = {
  isWindowAlwaysOnTop: false,
  windowOpacity: 1,
  windowBackground: "rgba(0, 0, 0, 0.3)",

  direction: '',
  emojiSize: 24,
  styleExtend: '',

  windowOnTopLevel: '',
  isWindowOnTopForce: false,
  ignoreMouseEvent: true,
}

const LIVE_CONFIG = {
  isWindowAlwaysOnTop: false,
  windowOpacity: 1,
  windowBackground: "rgba(0, 0, 0, 0.3)",
  isWithCookie: false,
  volume: 100,
}

const MESSAGE_CONFIG = {
  isRealTimeMode: false,
  isShowUserSpaceLink: false,
}

const ASR_CONFIG = {
  showLineCount: 3,
  audioFrom: '',
  // ffmpegExe: string
}

const MT_CONFIG = {
  fromLang: '',
  toLang: '',
  disableMircrophotoNoticeMessage: false,
}

const CHART_CONFIG = {
  colors: [],
}

const RECORD_CONFIG = {
  savePath: '',
  quality: '',
}

interface Provider {
  type: string
  service: string
  appKey: string
  accessKeyId: string
  accessKeySecret: string

}

export interface Room {
  id: string
  userId: string
  liveStatus: number
  liveStream: string

  isAutoReply: boolean
  autoReplyRules: any[]

  voteOptions: Array<{ keyword: string; value: string }>
}

export const DEFAULT_CONFIG: Config = {
  dmStyle: DM_STYLE,
  dmRawStyle: DM_RAW_STYLE,
  liveConfig: LIVE_CONFIG,
  messageConfig: MESSAGE_CONFIG,
  recordConfig: RECORD_CONFIG,
  asrConfig: ASR_CONFIG,
  mtConfig: MT_CONFIG,
  chartConfig: CHART_CONFIG,

  rooms: [],
  windows: [],
  providers: [],

  recordDir: '',
  isAutoRecord: false,
  signInMessage: '111',
  waitingSpeakerCount: 0,
}

interface User {
  id: string
  face: string
  cookie: string
}

export interface Config {
  // 全局设置
  recordDir: string
  isAutoRecord: boolean
  signInMessage: string
  isNeedRefreshCookieCache?: number
  refreshToken?: string
  waitingSpeakerCount?: number

  user?: User,
  rooms: Room[],
  windows: Window[],
  providers: Provider[],

  dmStyle: any,
  dmRawStyle: any,
  liveConfig: any,
  messageConfig: any,
  recordConfig: any,
  asrConfig: any,
  mtConfig: any,
  chartConfig: any,
}