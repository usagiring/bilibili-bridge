export const BILI_CMD = {
  PREPARING: 'PREPARING',
  INTERACT_WORD: 'INTERACT_WORD',
  /**
   * {
      dmscore: 4,
      pb: 'EgbokbEqKioiAQEoATC6JziptuTRBkDetcj47jNKLAjHuRoQHhoJ5aSn5q+N6bmFINWQtAEowIGDBjDAgYMGOMCBgwZguidojdsBYgB42Ibdldzt2N0YmgEAsgHBARJTCgbokbEqKioSSWh0dHA6Ly9pMS5oZHNsYi5jb20vYmZzL2ZhY2UvZDY0MDUyNzNmNWZiYzhjNzNhNzI0ODAxZjQyYjNhM2M3YTViYTgwZi5naWYaZAoJ5aSn5q+N6bmFEB4YwIGDBiDAgYMGKMCBgwYw1ZC0ATgCUMe5GmCN2wF6CSM5MTkyOThDQ4IBCSM5MTkyOThDQ4oBCSM5MTkyOThDQ5IBByNGRkZGRkaaAQkjOTE5Mjk4RTYiAggOMgC6AQDCAQA='
    }
   */
  INTERACT_WORD_V2: 'INTERACT_WORD_V2',
  /**
   * {
      data: '{"fade_duration":10000,"cnt":7,"card_appear_interval":0,"suffix_text":"人正在点赞","reset_cnt":1,"display_flag":1}',
      dmscore: 36,
      id: 173603624640512,
      status: 4,
      type: 106
    }
   */
  DM_INTERACTION: 'DM_INTERACTION',
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
  DM_STYLE: 'DM_STYLE',
  DM_RAW_STYLE: 'DM_RAW_STYLE',
  LIVE_CONFIG: 'LIVE_CONFIG',
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

export const DM_STYLE: DmStyle = {
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
  font: 'auto',
  fontWeight: 'normal',
  isUseMiniGiftCard: false,
  adminIcon: "md-star",
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

  messageSlots: [ 
    {
      type: 'medal',
      isShow: true,
    },
    {
      type: 'face',
      isShow: true,
    },
    {
      type: 'name',
      isShow: true,
    },
    {
      type: 'comment',
      isShow: true,
    },
  ],

  borderImages: [
    {
      isAdaptContent: false,
      dataUrl: '',
      isSelected: false,
      'border-width': 15,
      'border-image-width': '1.5',
      'border-image-slice': '50',
      'border-image-repeat': 'stretch',
      'border-image-outset': '0',
    },
  ],

  messageContainer0: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername0: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageComment0: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },

  messageContainer1: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername1: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageComment1: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },

  messageContainer2: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername2: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageComment2: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },

  messageContainer3: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername3: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageComment3: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },

  messageContainer99: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsername99: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageComment99: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },

  messageContainerInteract: {
    background: 'rgba(0,0,0,0)',
  },
  messageUsernameInteract: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
  messageCommentInteract: {
    'font-size': '16px',
    '--textStrokeWidth': '0px',
    "--textStrokeColor": 'rgba(0,0,0,1)',
    color: 'white',
  },
}

const DM_RAW_STYLE: DmRawStyle = {
  isWindowAlwaysOnTop: false,
  windowOpacity: 1,
  windowBackground: "rgba(0, 0, 0, 0.3)",

  duration: 10000,
  direction: 'RL',
  emojiSize: 24,
  styleExtend: 'bilibili',

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
  isAutoRecord: false,
}

const VOTE_CONFIG = {
  options: [],
  isAccurateMatch: false,
  isAllowReVote: false,
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
}

interface VoteConfig {
  options: {
    value: string
    description?: string
  }[]
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
  voteConfig: VOTE_CONFIG,
  autoReplyRule: {},

  rooms: [],
  windows: [],
  providers: [],

  signInMessage: '111',
  waitingSpeakerCount: 0,
}

interface User {
  id?: string
  face?: string
  cookie: string
  refreshToken: string
}

interface MessageSlot {
  type: 'medal' | 'face' | 'name' | 'comment'
  isShow: boolean
}

// ── 样式值 ──
type StyleValue = Record<string, string>

// ── Config 子类型 ──
export interface DmStyle {
  isShowFace: boolean
  isShowAnchorIcon: boolean
  isShowFanMedal: boolean
  isShowHeadline: boolean
  faceSize: number
  combineSimilarTime: number
  hiddenExpiredTime: number
  showHeadlineThreshold: number
  isShowInteractInfo: boolean
  showGiftCardThreshold: number
  isShowSilverGift: boolean
  font: string
  fontWeight: string
  isUseMiniGiftCard: boolean
  adminIcon: string
  isShowAdminIcon: boolean
  adminIconColor: string
  isShowType1: boolean
  isShowType2: boolean
  channelCount: number
  channelDelayTime: number
  isShowSuperChatJPN: boolean
  windowOpacity: number
  windowBackground: string
  isWindowAlwaysOnTop: boolean
  messageSlots: MessageSlot[]
  borderImages: any[]
  messageContainer0: StyleValue
  messageUsername0: StyleValue
  messageComment0: StyleValue
  messageContainer1: StyleValue
  messageUsername1: StyleValue
  messageComment1: StyleValue
  messageContainer2: StyleValue
  messageUsername2: StyleValue
  messageComment2: StyleValue
  messageContainer3: StyleValue
  messageUsername3: StyleValue
  messageComment3: StyleValue
  messageContainer99: StyleValue
  messageUsername99: StyleValue
  messageComment99: StyleValue
  messageContainerInteract: StyleValue
  messageUsernameInteract: StyleValue
  messageCommentInteract: StyleValue
}

export interface DmRawStyle {
  isWindowAlwaysOnTop: boolean
  windowOpacity: number
  windowBackground: string
  direction: 'RL' | 'LR'
  emojiSize: number
  styleExtend: 'bilibili' | 'self'
  duration: number
  windowOnTopLevel: string
  isWindowOnTopForce: boolean
  ignoreMouseEvent: boolean
}

export interface LiveConfig {
  isWindowAlwaysOnTop: boolean
  windowOpacity: number
  windowBackground: string
  isWithCookie: boolean
  volume: number
}

export interface MessageConfig {
  isRealTimeMode: boolean
  isShowUserSpaceLink: boolean
}

export interface AsrConfig {
  showLineCount: number
  audioFrom: string
}

export interface MtConfig {
  fromLang: string
  toLang: string
  disableMircrophotoNoticeMessage: boolean
}

export interface ChartConfig {
  colors: string[]
}

export interface RecordConfig {
  savePath: string
  quality: string
  isAutoRecord: boolean
}

export interface ReplyRuleTag {
  id: string
  key: string
  name: string
  kind: 'condition' | 'action'
  description?: string
  data?: any
  display?: string
}

export interface AutoReplyRule {
  id: string
  roomId: string
  type: string
  text: string
  sortOrder?: number
  isEnable: boolean
  tags: ReplyRuleTag[]
}

export interface Config {
  // 全局设置
  signInMessage: string
  isNeedRefreshCookieCache?: number
  waitingSpeakerCount?: number

  user?: User
  rooms: Room[]
  windows: Window[]
  providers: Provider[]

  dmStyle: DmStyle
  dmRawStyle: DmRawStyle
  liveConfig: LiveConfig
  messageConfig: MessageConfig
  recordConfig: RecordConfig
  asrConfig: AsrConfig
  mtConfig: MtConfig
  chartConfig: ChartConfig
  voteConfig: VoteConfig
  autoReplyRule: Record<string, AutoReplyRule>
}